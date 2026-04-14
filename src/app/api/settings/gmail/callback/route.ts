import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { GMAIL_OAUTH_STATE_COOKIE } from "@/lib/oauth-cookies";

export async function GET(req: NextRequest) {
  const redirectBase = `${env.NEXT_PUBLIC_APP_URL}/settings?section=conectores`;

  try {
    const user = await requireAuth();

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${redirectBase}&gmail_error=${encodeURIComponent(error)}`,
      );
    }

    const cookieStore = await cookies();
    const savedState = cookieStore.get(GMAIL_OAUTH_STATE_COOKIE)?.value;

    if (!state || state !== savedState) {
      return NextResponse.redirect(`${redirectBase}&gmail_error=invalid_state`);
    }

    if (!code) {
      return NextResponse.redirect(`${redirectBase}&gmail_error=no_code`);
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/settings/gmail/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!tokenRes.ok || !tokenData.access_token) {
      logger.error("[gmail] Token exchange failed", { error: tokenData.error });
      return NextResponse.redirect(
        `${redirectBase}&gmail_error=token_exchange_failed`,
      );
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        gmailAccessToken: tokenData.access_token,
        gmailRefreshToken: tokenData.refresh_token ?? null,
        gmailTokenExpiresAt: expiresAt,
      },
      update: {
        gmailAccessToken: tokenData.access_token,
        ...(tokenData.refresh_token && {
          gmailRefreshToken: tokenData.refresh_token,
        }),
        gmailTokenExpiresAt: expiresAt,
      },
    });

    logger.info("[gmail] Connected", { userId: user.id });

    cookieStore.delete(GMAIL_OAUTH_STATE_COOKIE);

    return NextResponse.redirect(`${redirectBase}&gmail_connected=1`);
  } catch (err) {
    logger.error("[gmail] Callback error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(`${redirectBase}&gmail_error=unknown`);
  }
}
