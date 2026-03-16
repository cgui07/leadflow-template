import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleAuthorizationRequest,
  GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS,
  GOOGLE_OAUTH_REDIRECT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/features/auth/oauth";

export async function GET(req: NextRequest) {
  try {
    const { authorizationUrl, redirectPath, state } =
      createGoogleAuthorizationRequest({
        origin: req.nextUrl.origin,
        redirect: req.nextUrl.searchParams.get("redirect"),
      });
    const response = NextResponse.redirect(authorizationUrl);
    const secure = process.env.NODE_ENV === "production";

    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });
    response.cookies.set(GOOGLE_OAUTH_REDIRECT_COOKIE, redirectPath, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Google OAuth não configurado" },
      { status: 500 },
    );
  }
}
