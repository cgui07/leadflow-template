import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth";
import { buildBranding } from "@/lib/branding";
import { sendActivationEmail } from "@/lib/email";
import { generateInviteToken } from "@/lib/tenant";
import { normalizeTenantSlug } from "@/lib/tenant-slug";
import type {
  ActivationLinkSummary,
  CreatePlatformClientResponse,
  PlatformClientAccessState,
  PlatformClientRow,
  PlatformClientsResponse,
  RegenerateActivationLinkResponse,
} from "./contracts";

const DEFAULT_INVITE_EXPIRATION_DAYS = 7;
const MAX_INVITE_EXPIRATION_DAYS = 30;

const PLATFORM_CLIENT_SELECT = {
  id: true,
  name: true,
  slug: true,
  status: true,
  createdAt: true,
  users: {
    orderBy: { createdAt: "asc" },
    take: 1,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  },
  inviteTokens: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      token: true,
      email: true,
      expiresAt: true,
      usedCount: true,
      maxUses: true,
    },
  },
  _count: {
    select: {
      users: true,
    },
  },
} as const;

type PlatformClientRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
  users: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  }>;
  inviteTokens: Array<{
    token: string;
    email: string | null;
    expiresAt: Date;
    usedCount: number;
    maxUses: number;
  }>;
  _count: {
    users: number;
  };
} | null;

export class PlatformClientError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 400,
    message?: string,
  ) {
    super(message ?? code);
  }
}

function assertRequiredString(
  value: unknown,
  code: string,
  message: string,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new PlatformClientError(code, 400, message);
  }

  return value.trim();
}

function parseInviteExpirationDays(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_INVITE_EXPIRATION_DAYS;
  }

  return Math.max(1, Math.min(MAX_INVITE_EXPIRATION_DAYS, Math.round(value)));
}

function buildActivationLink(
  appUrl: string | null | undefined,
  token: string,
): string {
  const baseUrl = typeof appUrl === "string" ? appUrl.trim() : "";

  if (!baseUrl) {
    return `/register?token=${token}`;
  }

  return new URL(`/register?token=${token}`, baseUrl).toString();
}

function isInvitePending(
  invite:
    | {
        expiresAt: Date;
        usedCount: number;
        maxUses: number;
      }
    | null
    | undefined,
): boolean {
  return (
    !!invite &&
    invite.expiresAt.getTime() > Date.now() &&
    invite.usedCount < invite.maxUses
  );
}

function mapAccessState(
  status: string,
  usersCount: number,
  hasPendingInvite: boolean,
): PlatformClientAccessState {
  if (status !== "active") {
    return "suspended";
  }

  if (usersCount > 0) {
    return "active";
  }

  return hasPendingInvite ? "pending" : "setup";
}

function mapPlatformClient(
  tenant: NonNullable<PlatformClientRecord>,
  appUrl?: string | null,
): PlatformClientRow {
  const owner = tenant.users[0] ?? null;
  const latestInvite = tenant.inviteTokens[0] ?? null;
  const pendingInvite = owner
    ? null
    : isInvitePending(latestInvite)
      ? latestInvite
      : null;
  const usersCount = tenant._count.users;

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    createdAt: tenant.createdAt.toISOString(),
    activatedAt: owner?.createdAt.toISOString() ?? null,
    usersCount,
    ownerName: owner?.name ?? null,
    ownerEmail: owner?.email ?? latestInvite?.email ?? null,
    activationEmail: owner ? null : (latestInvite?.email ?? null),
    activationLink: pendingInvite
      ? buildActivationLink(appUrl, pendingInvite.token)
      : null,
    activationExpiresAt: latestInvite?.expiresAt.toISOString() ?? null,
    accessState: mapAccessState(
      tenant.status,
      usersCount,
      Boolean(pendingInvite),
    ),
  };
}

async function getPlatformClientById(
  tenantId: string,
  options?: { appUrl?: string | null },
): Promise<PlatformClientRow | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: PLATFORM_CLIENT_SELECT,
  });

  return tenant ? mapPlatformClient(tenant, options?.appUrl) : null;
}

function buildActivationSummary(params: {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  email: string;
  token: string;
  expiresAt: Date;
  appUrl?: string | null;
}): ActivationLinkSummary {
  return {
    tenantId: params.tenantId,
    tenantName: params.tenantName,
    tenantSlug: params.tenantSlug,
    email: params.email,
    activationLink: buildActivationLink(params.appUrl, params.token),
    expiresAt: params.expiresAt.toISOString(),
  };
}

export async function listPlatformClients(options?: {
  appUrl?: string | null;
  excludeTenantId?: string | null;
}): Promise<PlatformClientsResponse> {
  const tenants = await prisma.tenant.findMany({
    where: options?.excludeTenantId
      ? {
          NOT: {
            id: options.excludeTenantId,
          },
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: PLATFORM_CLIENT_SELECT,
  });

  return {
    clients: tenants.map((tenant) =>
      mapPlatformClient(tenant, options?.appUrl),
    ),
  };
}

export async function createPlatformClient(
  input: Record<string, unknown>,
  options?: { appUrl?: string | null },
): Promise<CreatePlatformClientResponse> {
  const name = assertRequiredString(
    input.name,
    "CLIENT_NAME_REQUIRED",
    "Nome do cliente é obrigatório.",
  );
  const ownerEmail = normalizeEmail(
    assertRequiredString(
      input.ownerEmail,
      "CLIENT_EMAIL_REQUIRED",
      "Email do corretor é obrigatório.",
    ),
  );
  const rawSlug =
    typeof input.slug === "string" && input.slug.trim()
      ? input.slug.trim()
      : name;
  const slug = normalizeTenantSlug(rawSlug);
  const expiresInDays = parseInviteExpirationDays(input.expiresInDays);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const existingTenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingTenant) {
    throw new PlatformClientError(
      "CLIENT_SLUG_TAKEN",
      409,
      "Esse slug já está em uso.",
    );
  }

  const activationToken = generateInviteToken();
  const branding = buildBranding({ name });

  const tenant = await prisma.$transaction(async (tx) => {
    const createdTenant = await tx.tenant.create({
      data: {
        name: branding.name,
        slug,
        logoUrl: branding.logoUrl,
        colorPrimary: branding.colorPrimary,
        colorSecondary: branding.colorSecondary,
        featureFlags: branding.featureFlags,
        customTexts: branding.customTexts,
      },
      select: { id: true, name: true, slug: true },
    });

    await tx.inviteToken.create({
      data: {
        tenantId: createdTenant.id,
        token: activationToken,
        email: null,
        role: "admin",
        maxUses: 1,
        expiresAt,
      },
    });

    return createdTenant;
  });

  const client = await getPlatformClientById(tenant.id, options);

  if (!client) {
    throw new PlatformClientError(
      "CLIENT_NOT_FOUND",
      404,
      "Cliente não encontrado.",
    );
  }

  const activation = buildActivationSummary({
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    email: ownerEmail,
    token: activationToken,
    expiresAt,
    appUrl: options?.appUrl,
  });

  await sendActivationEmail({
    to: ownerEmail,
    tenantName: tenant.name,
    activationLink: activation.activationLink,
    expiresAt: expiresAt.toISOString(),
  });

  return { client, activation };
}

export async function regeneratePlatformActivationLink(
  tenantId: string,
  input: Record<string, unknown>,
  options?: { appUrl?: string | null; forbidTenantId?: string | null },
): Promise<RegenerateActivationLinkResponse> {
  if (options?.forbidTenantId && tenantId === options.forbidTenantId) {
    throw new PlatformClientError(
      "CLIENT_INTERNAL_TENANT",
      400,
      "Não é possível gerar links para o tenant interno da plataforma.",
    );
  }

  const email = normalizeEmail(
    assertRequiredString(
      input.email,
      "CLIENT_EMAIL_REQUIRED",
      "Email do corretor é obrigatório.",
    ),
  );
  const expiresInDays = parseInviteExpirationDays(input.expiresInDays);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  const activationToken = generateInviteToken();
  const now = new Date();

  const tenant = await prisma.$transaction(async (tx) => {
    const existingTenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { users: true } },
      },
    });

    if (!existingTenant) {
      throw new PlatformClientError(
        "CLIENT_NOT_FOUND",
        404,
        "Cliente não encontrado.",
      );
    }

    if (existingTenant._count.users > 0) {
      throw new PlatformClientError(
        "CLIENT_ALREADY_ACTIVATED",
        409,
        "Esse cliente já ativou a conta. Use a recuperação de senha para novos acessos.",
      );
    }

    await tx.inviteToken.updateMany({
      where: {
        tenantId,
        role: "admin",
        expiresAt: { gt: now },
      },
      data: {
        expiresAt: now,
      },
    });

    await tx.inviteToken.create({
      data: {
        tenantId,
        token: activationToken,
        email: null,
        role: "admin",
        maxUses: 1,
        expiresAt,
      },
    });

    return existingTenant;
  });

  const client = await getPlatformClientById(tenant.id, options);

  if (!client) {
    throw new PlatformClientError(
      "CLIENT_NOT_FOUND",
      404,
      "Cliente não encontrado.",
    );
  }

  const activation = buildActivationSummary({
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    email,
    token: activationToken,
    expiresAt,
    appUrl: options?.appUrl,
  });

  await sendActivationEmail({
    to: email,
    tenantName: tenant.name,
    activationLink: activation.activationLink,
    expiresAt: expiresAt.toISOString(),
  });

  return { client, activation };
}

export async function updatePlatformClientStatus(
  tenantId: string,
  input: Record<string, unknown>,
  options?: { appUrl?: string | null; forbidTenantId?: string | null },
): Promise<PlatformClientRow> {
  if (options?.forbidTenantId && tenantId === options.forbidTenantId) {
    throw new PlatformClientError(
      "CLIENT_INTERNAL_TENANT",
      400,
      "Não é possível alterar o tenant interno da plataforma.",
    );
  }

  const status =
    input.status === "active" || input.status === "inactive"
      ? input.status
      : null;

  if (!status) {
    throw new PlatformClientError(
      "CLIENT_STATUS_INVALID",
      400,
      "Status inválido.",
    );
  }

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
      select: { id: true },
    });
  } catch {
    throw new PlatformClientError(
      "CLIENT_NOT_FOUND",
      404,
      "Cliente não encontrado.",
    );
  }

  const client = await getPlatformClientById(tenantId, options);

  if (!client) {
    throw new PlatformClientError(
      "CLIENT_NOT_FOUND",
      404,
      "Cliente não encontrado.",
    );
  }

  return client;
}
