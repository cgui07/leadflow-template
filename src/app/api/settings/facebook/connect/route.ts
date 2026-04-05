import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { handleError, requireAuth } from "@/lib/api";
import { getFacebookOAuthUrl } from "@/lib/facebook";
import {
  FACEBOOK_OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/oauth-cookies";

export async function GET() {
  try {
    await requireAuth();
    const state = randomBytes(32).toString("hex");

    const cookieStore = await cookies();
    cookieStore.set(FACEBOOK_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: OAUTH_STATE_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });

    const url = getFacebookOAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (err) {
    return handleError(err);
  }
}
