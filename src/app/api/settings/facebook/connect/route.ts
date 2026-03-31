import { NextResponse } from "next/server";
import { handleError, requireAuth } from "@/lib/api";
import { getFacebookOAuthUrl } from "@/lib/facebook";

export async function GET() {
  try {
    const user = await requireAuth();
    const url = getFacebookOAuthUrl(user.id);
    return NextResponse.redirect(url);
  } catch (err) {
    return handleError(err);
  }
}
