import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { exchangeFacebookCode } from "@/lib/facebook";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const settingsUrl = `${env.NEXT_PUBLIC_APP_URL}/settings?section=conectores`;

  if (errorParam || !code || !state) {
    const reason = errorParam ?? "missing_params";
    logger.error("[facebook/callback] OAuth error", { reason });
    return NextResponse.redirect(
      `${settingsUrl}&facebook_error=${encodeURIComponent(reason)}`,
    );
  }

  try {
    await exchangeFacebookCode(code, state);
    return NextResponse.redirect(`${settingsUrl}&facebook_connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    logger.error("[facebook/callback] Exchange failed", { message });
    return NextResponse.redirect(
      `${settingsUrl}&facebook_error=${encodeURIComponent(message)}`,
    );
  }
}
