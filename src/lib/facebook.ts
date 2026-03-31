import { env } from "./env";
import { prisma } from "./db";
import { logger } from "./logger";
import { createHmac } from "crypto";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const FB_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_manage_ads",
  "leads_retrieval",
  "ads_management",
].join(",");

export function getFacebookOAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: env.FACEBOOK_APP_ID,
    redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/settings/facebook/callback`,
    scope: FB_OAUTH_SCOPES,
    response_type: "code",
    state: userId,
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface PageInfo {
  id: string;
  name: string;
  access_token: string;
}

export async function exchangeFacebookCode(
  code: string,
  userId: string,
): Promise<void> {
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/settings/facebook/callback`;

  const tokenRes = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?${new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      redirect_uri: redirectUri,
      code,
    })}`,
  );

  const tokenData = (await tokenRes.json()) as TokenResponse & {
    error?: { message: string };
  };

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(
      `Facebook token exchange failed: ${tokenData.error?.message ?? "unknown"}`,
    );
  }

  const longLivedRes = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?${new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      fb_exchange_token: tokenData.access_token,
    })}`,
  );

  const longLivedData = (await longLivedRes.json()) as TokenResponse & {
    error?: { message: string };
  };
  const userToken = longLivedData.access_token ?? tokenData.access_token;

  const pagesRes = await fetch(
    `${GRAPH_API_BASE}/me/accounts?access_token=${encodeURIComponent(userToken)}`,
  );

  const pagesData = (await pagesRes.json()) as {
    data?: PageInfo[];
    error?: { message: string };
  };

  if (!pagesRes.ok || !pagesData.data?.length) {
    throw new Error(
      pagesData.error?.message ??
        "Nenhuma página encontrada. Verifique se sua conta gerencia pelo menos uma Página.",
    );
  }

  for (const page of pagesData.data) {
    await fetch(`${GRAPH_API_BASE}/${page.id}/subscribed_apps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscribed_fields: ["leadgen"],
        access_token: page.access_token,
      }),
    });

    await prisma.facebookPageMapping.upsert({
      where: { pageId: page.id },
      create: {
        pageId: page.id,
        pageName: page.name,
        userId,
      },
      update: {
        pageName: page.name,
        userId,
      },
    });
  }

  const primaryPage = pagesData.data[0];

  await prisma.userSettings.update({
    where: { userId },
    data: {
      facebookPageAccessToken: primaryPage.access_token,
    },
  });

  logger.info("[facebook] OAuth completed", {
    userId,
    pages: pagesData.data.map((p) => p.id),
  });
}

export async function getFacebookConnectionStatus(userId: string) {
  const pages = await prisma.facebookPageMapping.findMany({
    where: { userId },
    select: { pageId: true, pageName: true, createdAt: true },
  });

  return {
    connected: pages.length > 0,
    pages,
  };
}

export async function disconnectFacebook(userId: string): Promise<void> {
  await prisma.facebookPageMapping.deleteMany({ where: { userId } });

  await prisma.userSettings.update({
    where: { userId },
    data: { facebookPageAccessToken: null },
  });

  logger.info("[facebook] Disconnected", { userId });
}

export function verifyFacebookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const appSecret = env.FACEBOOK_APP_SECRET;

  if (!appSecret || !signatureHeader) {
    return false;
  }

  const [algorithm, signature] = signatureHeader.split("=", 2);

  if (algorithm !== "sha256" || !signature) {
    return false;
  }

  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  return expected === signature;
}

export function getFacebookVerifyToken(): string {
  return env.FACEBOOK_VERIFY_TOKEN;
}

interface LeadFieldData {
  name: string;
  values: string[];
}

interface ParsedLead {
  name: string;
  phone: string;
  email: string | null;
}

const PHONE_FIELD_NAMES = new Set([
  "phone_number",
  "phone",
  "telefone",
  "whatsapp",
  "celular",
]);
const NAME_FIELD_NAMES = new Set(["full_name", "name", "nome", "first_name"]);
const EMAIL_FIELD_NAMES = new Set(["email", "e-mail"]);

export function parseLeadFieldData(fieldData: LeadFieldData[]): ParsedLead {
  let name = "";
  let phone = "";
  let email: string | null = null;

  for (const field of fieldData) {
    const key = field.name.toLowerCase();
    const value = field.values?.[0] ?? "";

    if (!value) {
      continue;
    }

    if (NAME_FIELD_NAMES.has(key)) {
      name = value;
    } else if (PHONE_FIELD_NAMES.has(key)) {
      phone = value.replace(/\D/g, "");
    } else if (EMAIL_FIELD_NAMES.has(key)) {
      email = value;
    }
  }

  return { name, phone, email };
}

export async function fetchLeadData(
  leadgenId: string,
  pageAccessToken: string,
): Promise<ParsedLead | null> {
  const url = `${GRAPH_API_BASE}/${leadgenId}?access_token=${encodeURIComponent(pageAccessToken)}`;

  const res = await fetch(url);

  if (!res.ok) {
    logger.error("Failed to fetch lead data", {
      status: res.status,
      body: await res.text(),
    });
    return null;
  }

  const data = await res.json();
  const fieldData: LeadFieldData[] = data.field_data ?? [];

  if (fieldData.length === 0) {
    logger.warn("Lead has no field_data", { leadgenId });
    return null;
  }

  return parseLeadFieldData(fieldData);
}
