import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth nao configurado" },
      { status: 500 },
    );
  }

  const redirect = req.nextUrl.searchParams.get("redirect") || "/dashboard";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const callbackUrl = new URL("/api/auth/google/callback", appUrl);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl.toString(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state: redirect,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  return NextResponse.redirect(googleAuthUrl);
}
