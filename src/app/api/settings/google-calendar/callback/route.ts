import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCalendarCode } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId passed as state
  const errorParam = searchParams.get("error");

  const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?section=calendar`;

  if (errorParam || !code || !state) {
    const reason = errorParam ?? "missing_params";
    console.error("[google-calendar/callback] OAuth error:", reason);
    return NextResponse.redirect(
      `${settingsUrl}&calendar_error=${encodeURIComponent(reason)}`,
    );
  }

  try {
    await exchangeGoogleCalendarCode(code, state);
    return NextResponse.redirect(`${settingsUrl}&calendar_connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.error("[google-calendar/callback] Exchange failed:", message);
    return NextResponse.redirect(
      `${settingsUrl}&calendar_error=${encodeURIComponent(message)}`,
    );
  }
}
