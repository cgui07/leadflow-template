import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { GCAL_OAUTH_STATE_COOKIE } from "@/lib/oauth-cookies";
import { exchangeGoogleCalendarCode } from "@/lib/google-calendar";

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
      logger.error("[google-calendar/callback] OAuth error", { reason });
      return NextResponse.redirect(
        `${settingsUrl}&calendar_error=${encodeURIComponent(reason)}`,
      );
    }

    // Validate CSRF state from cookie
    const cookieStore = await cookies();
    const savedState = cookieStore.get(GCAL_OAUTH_STATE_COOKIE)?.value;
    cookieStore.delete(GCAL_OAUTH_STATE_COOKIE);

    if (!savedState || savedState !== state) {
      logger.error("[google-calendar/callback] CSRF state mismatch");
      return NextResponse.redirect(
        `${settingsUrl}&calendar_error=${encodeURIComponent("invalid_state")}`,
      );
    }

    await exchangeGoogleCalendarCode(code, user.id);
    return NextResponse.redirect(`${settingsUrl}&calendar_connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    logger.error("[google-calendar/callback] Exchange failed", { message });
    return NextResponse.redirect(
      `${settingsUrl}&calendar_error=${encodeURIComponent(message)}`,
    );
  }
}
