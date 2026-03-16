import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail, signToken, setAuthCookie } from "@/lib/auth";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state") || "/dashboard";
  const errorParam = req.nextUrl.searchParams.get("error");

  if (errorParam || !code) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("error", "google_auth_failed");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const callbackUrl = new URL("/api/auth/google/callback", req.nextUrl.origin);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: callbackUrl.toString(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[google-auth] Token exchange failed:", await tokenRes.text());
      return redirectToLogin(req, "google_token_failed");
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );

    if (!userInfoRes.ok) {
      console.error("[google-auth] User info fetch failed");
      return redirectToLogin(req, "google_userinfo_failed");
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    if (!googleUser.email) {
      return redirectToLogin(req, "google_no_email");
    }

    const normalizedEmail = normalizeEmail(googleUser.email);
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.sub }, { email: normalizedEmail }],
      },
      select: {
        id: true,
        googleId: true,
        avatarUrl: true,
        status: true,
        tenant: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!user) {
      return redirectToLogin(req, "no_account");
    }

    if (user.status !== "active" || user.tenant?.status === "inactive") {
      return redirectToLogin(req, "account_suspended");
    }

    if (!user.googleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.sub,
          avatarUrl: user.avatarUrl || googleUser.picture || null,
        },
      });
    }

    const token = signToken(user.id);
    await setAuthCookie(token);

    return NextResponse.redirect(new URL(state, req.nextUrl.origin));
  } catch (err) {
    console.error("[google-auth] Callback error:", err);
    return redirectToLogin(req, "google_internal_error");
  }
}

function redirectToLogin(req: NextRequest, error: string) {
  const loginUrl = new URL("/login", req.nextUrl.origin);
  loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}
