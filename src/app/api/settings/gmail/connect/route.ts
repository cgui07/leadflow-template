import { env } from "@/lib/env";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { handleError, requireAuth } from "@/lib/api";
import { GMAIL_OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE_MAX_AGE_SECONDS } from "@/lib/oauth-cookies";

export async function GET() {
  try {
    await requireAuth();
    const state = randomBytes(32).toString("hex");

    const cookieStore = await cookies();
    cookieStore.set(GMAIL_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: OAUTH_STATE_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/settings/gmail/callback`,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    );
  } catch (err) {
    return handleError(err);
  }
}
