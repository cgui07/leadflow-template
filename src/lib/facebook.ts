import { createHmac } from "crypto";
import { logger } from "./logger";
import { env } from "./env";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

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

const PHONE_FIELD_NAMES = new Set(["phone_number", "phone", "telefone", "whatsapp", "celular"]);
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
    logger.error("Failed to fetch lead data", { status: res.status, body: await res.text() });
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
