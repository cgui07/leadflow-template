import crypto from "node:crypto";
import { prisma } from "./db";
import { env } from "./env";
import { normalizeTenantSlug } from "./tenant-slug";
import {
  buildBranding,
  createDefaultBranding,
  type TenantBranding,
} from "./branding";

function buildTenantName(name: string | null | undefined, email: string): string {
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return email.split("@")[0] || "Workspace";
}

function slugifyTenantValue(value: string): string {
  return normalizeTenantSlug(value, 48);
}

async function resolveUniqueTenantSlug(
  client: Pick<typeof prisma, "tenant">,
  baseSlug: string,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  while (await client.tenant.findUnique({ where: { slug }, select: { id: true } })) {
    const suffixLabel = `-${suffix}`;
    const trimmedBase = baseSlug.slice(0, Math.max(1, 63 - suffixLabel.length));
    slug = `${trimmedBase}${suffixLabel}`;
    suffix += 1;
  }

  return slug;
}

export async function ensureLegacyTenantAccess(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // SELECT FOR UPDATE adquire um lock pessimista na linha do usuário durante a transação.
    // Previne race conditions quando múltiplas requisições simultâneas tentam criar um Tenant
    // para o mesmo userId (ex: abas duplicadas no onboarding). O lock garante que apenas uma
    // execução passe pelo bloco de criação — as demais aguardam e, ao adquirir o lock, encontram
    // tenantId já preenchido e saem pelo early return. $queryRaw é necessário porque Prisma não
    // expõe SELECT FOR UPDATE de forma nativa.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        tenantId: true,
      },
    });

    if (!user || user.status !== "active" || user.tenantId) {
      return;
    }

    const tenantName = buildTenantName(user.name, user.email);
    const tenantSlug = await resolveUniqueTenantSlug(
      tx,
      slugifyTenantValue(tenantName || user.email.split("@")[0] || "workspace"),
    );
    const tenant = await tx.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
      },
      select: { id: true },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        tenantId: tenant.id,
        role: "admin",
      },
    });
  });
}

export async function getTenantBranding(
  tenantId?: string | null,
): Promise<TenantBranding> {
  if (!tenantId) {
    return createDefaultBranding();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      logoUrl: true,
      colorPrimary: true,
      colorSecondary: true,
      customTexts: true,
      featureFlags: true,
      status: true,
    },
  });

  if (!tenant || tenant.status !== "active") {
    return createDefaultBranding();
  }

  return buildBranding(tenant);
}

export async function getTenantBrandingBySlug(
  slug: string,
): Promise<TenantBranding | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      name: true,
      logoUrl: true,
      colorPrimary: true,
      colorSecondary: true,
      customTexts: true,
      featureFlags: true,
      status: true,
    },
  });

  if (!tenant || tenant.status !== "active") {
    return null;
  }

  return buildBranding(tenant);
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function validateInviteToken(token: string) {
  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          status: true,
          logoUrl: true,
          colorPrimary: true,
          colorSecondary: true,
          customTexts: true,
          featureFlags: true,
        },
      },
    },
  });

  if (!invite) return null;
  if (invite.tenant.status !== "active") return null;
  if (invite.expiresAt.getTime() <= Date.now()) return null;
  if (invite.usedCount >= invite.maxUses) return null;

  return invite;
}

export function hasFeatureFlag(
  branding: TenantBranding,
  flag: string,
): boolean {
  return flag in branding.featureFlags
    ? branding.featureFlags[flag as keyof TenantBranding["featureFlags"]] === true
    : false;
}

export function isPlatformAdminEmail(email: string): boolean {
  const raw = env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return false;

  const allowedEmails = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.trim().toLowerCase());
}
