import { prisma } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { sanitizeAppRedirect } from "@/lib/redirect";
import { normalizeEmail, setAuthCookie, signToken } from "@/lib/auth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export const GOOGLE_OAUTH_STATE_COOKIE = "leadflow_google_oauth_state";
export const GOOGLE_OAUTH_REDIRECT_COOKIE = "leadflow_google_oauth_redirect";
export const GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS = 60 * 10;

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserInfo {
  email?: string;
  name?: string;
  picture?: string;
  sub: string;
}

export class GoogleAuthError extends Error {
  constructor(public readonly redirectCode: string) {
    super(redirectCode);
  }
}

function getGoogleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID_MISSING");
  }

  return clientId;
}

function getGoogleClientSecret(): string {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientSecret) {
    throw new GoogleAuthError("google_internal_error");
  }

  return clientSecret;
}

function getGoogleCallbackUrl(origin: string): URL {
  return new URL("/api/auth/google/callback", process.env.NEXT_PUBLIC_APP_URL || origin);
}

export function createGoogleAuthorizationRequest({
  origin,
  redirect,
}: {
  origin: string;
  redirect: string | null | undefined;
}) {
  const clientId = getGoogleClientId();
  const state = randomBytes(32).toString("hex");
  const callbackUrl = getGoogleCallbackUrl(origin);
  const redirectPath = sanitizeAppRedirect(redirect);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl.toString(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return {
    authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    redirectPath,
    state,
  };
}

export async function authenticateWithGoogleAuthorizationCode({
  code,
  origin,
}: {
  code: string;
  origin: string;
}): Promise<void> {
  const callbackUrl = getGoogleCallbackUrl(origin);
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: callbackUrl.toString(),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    console.error("[google-auth] Token exchange failed:", await tokenResponse.text());
    throw new GoogleAuthError("google_token_failed");
  }

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    cache: "no-store",
  });

  if (!userInfoResponse.ok) {
    console.error("[google-auth] User info fetch failed");
    throw new GoogleAuthError("google_userinfo_failed");
  }

  const googleUser = (await userInfoResponse.json()) as GoogleUserInfo;

  if (!googleUser.email) {
    throw new GoogleAuthError("google_no_email");
  }

  const normalizedEmail = normalizeEmail(googleUser.email);
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId: googleUser.sub }, { email: normalizedEmail }],
    },
    select: {
      id: true,
      googleId: true,
      avatarUrl: true,
      status: true,
      tenant: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!user) {
    throw new GoogleAuthError("no_account");
  }

  if (user.status !== "active" || user.tenant?.status === "inactive") {
    throw new GoogleAuthError("account_suspended");
  }

  if (!user.googleId) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: googleUser.sub,
        avatarUrl: user.avatarUrl || googleUser.picture || null,
      },
    });
  }

  await setAuthCookie(signToken(user.id));
}
