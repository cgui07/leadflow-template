import { handleError, requireAuth } from "@/lib/api";
import { getGoogleCalendarAuthUrl } from "@/lib/google-calendar";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const url = getGoogleCalendarAuthUrl(user.id);
    return NextResponse.redirect(url);
  } catch (err) {
    return handleError(err);
  }
}
