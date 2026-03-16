import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { buildBranding } from "@/lib/branding";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  tenantId: string | null;
}

export interface SessionData {
  user: SessionUser;
  branding: ReturnType<typeof buildBranding>;
  canManageTenant: boolean;
}

function mapSessionUser(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    tenantId: user.tenantId ?? null,
  };
}

export const getSession = cache(async (): Promise<SessionData | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return {
    user: mapSessionUser(user),
    branding: buildBranding(user.tenant),
    canManageTenant: user.role === "admin" && Boolean(user.tenantId),
  };
});

export const requireSession = cache(async (): Promise<SessionData> => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
});
