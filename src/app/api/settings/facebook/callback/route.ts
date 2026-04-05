import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/api";
import { exchangeFacebookCode } from "@/lib/facebook";
import { NextRequest, NextResponse } from "next/server";
import { FACEBOOK_OAUTH_STATE_COOKIE } from "@/lib/oauth-cookies";

export async function GET(req: NextRequest) {
  const settingsUrl = `${env.NEXT_PUBLIC_APP_URL}/settings?section=conectores`;

  try {
    const user = await requireAuth();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam || !code || !state) {
      const reason = errorParam ?? "missing_params";
      logger.error("[facebook/callback] OAuth error", { reason });
      return NextResponse.redirect(
        `${settingsUrl}&facebook_error=${encodeURIComponent(reason)}`,
      );
    }

    // Validate CSRF state from cookie
    const cookieStore = await cookies();
    const savedState = cookieStore.get(FACEBOOK_OAUTH_STATE_COOKIE)?.value;
    cookieStore.delete(FACEBOOK_OAUTH_STATE_COOKIE);

    if (!savedState || savedState !== state) {
      logger.error("[facebook/callback] CSRF state mismatch");
      return NextResponse.redirect(
        `${settingsUrl}&facebook_error=${encodeURIComponent("invalid_state")}`,
      );
    }

    await exchangeFacebookCode(code, user.id);
    return NextResponse.redirect(`${settingsUrl}&facebook_connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    logger.error("[facebook/callback] Exchange failed", { message });
    return NextResponse.redirect(
      `${settingsUrl}&facebook_error=${encodeURIComponent(message)}`,
    );
  }
}
