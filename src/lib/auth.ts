import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "./env";
import { prisma } from "./db";
import { cookies } from "next/headers";
import { ensureLegacyTenantAccess } from "./tenant";
import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  BCRYPT_ROUNDS,
  JWT_EXPIRY,
  COOKIE_MAX_AGE,
} from "./constants";

const TOKEN_NAME = "lospeflow_token";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
  };
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const sessionUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      status: true,
      tenantId: true,
    },
  });

  if (!sessionUser || sessionUser.status !== "active") {
    return null;
  }

  if (!sessionUser.tenantId) {
    await ensureLegacyTenantAccess(sessionUser.id);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      status: true,
      tenantId: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          colorPrimary: true,
          colorSecondary: true,
          status: true,
          featureFlags: true,
          customTexts: true,
        },
      },
    },
  });

  if (!user) return null;
  if (user.tenant && user.tenant.status !== "active") return null;

  return user;
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}
