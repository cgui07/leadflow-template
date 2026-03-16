import { randomBytes } from "node:crypto";
import { sanitizeAppRedirect } from "@/lib/redirect";
import { NextRequest, NextResponse } from "next/server";

const GOOGLE_OAUTH_STATE_COOKIE = "leadflow_google_oauth_state";
const GOOGLE_OAUTH_REDIRECT_COOKIE = "leadflow_google_oauth_redirect";
const GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS = 60 * 10;

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth não configurado" },
      { status: 500 },
    );
  }

  const redirect = sanitizeAppRedirect(req.nextUrl.searchParams.get("redirect"));
  const state = randomBytes(32).toString("hex");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const callbackUrl = new URL("/api/auth/google/callback", appUrl);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl.toString(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  const response = NextResponse.redirect(googleAuthUrl);
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  response.cookies.set(GOOGLE_OAUTH_REDIRECT_COOKIE, redirect, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
