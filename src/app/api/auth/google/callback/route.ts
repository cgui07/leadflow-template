import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getAuthRedirectPath } from "@/features/auth/utils";
import {
  authenticateWithGoogleAuthorizationCode,
  GoogleAuthError,
  GOOGLE_OAUTH_REDIRECT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/features/auth/oauth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const errorParam = req.nextUrl.searchParams.get("error");
  const expectedState = req.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const redirectPath = getAuthRedirectPath(
    req.cookies.get(GOOGLE_OAUTH_REDIRECT_COOKIE)?.value,
  );

  if (errorParam || !code || !state || !expectedState || state !== expectedState) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("error", "google_auth_failed");
    return clearOAuthCookies(NextResponse.redirect(loginUrl));
  }

  try {
    await authenticateWithGoogleAuthorizationCode({
      code,
      origin: req.nextUrl.origin,
    });

    return clearOAuthCookies(
      NextResponse.redirect(new URL(redirectPath, req.nextUrl.origin)),
    );
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      return redirectToLogin(req, err.redirectCode);
    }

    logger.error("[google-auth] Callback error", { error: err instanceof Error ? err.message : String(err) });
    return redirectToLogin(req, "google_internal_error");
  }
}

function redirectToLogin(req: NextRequest, errorCode: string) {
  const loginUrl = new URL("/login", req.nextUrl.origin);
  loginUrl.searchParams.set("error", errorCode);
  return clearOAuthCookies(NextResponse.redirect(loginUrl));
}

function clearOAuthCookies(response: NextResponse) {
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  response.cookies.delete(GOOGLE_OAUTH_REDIRECT_COOKIE);
  return response;
}
