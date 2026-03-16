import { prisma } from "@/lib/db";
import { maskSecret, normalizeSettingsProvider } from "./utils";
import { normalizeAutoReplyDelaySeconds } from "@/lib/auto-reply-delay";
import type {
  TenantCustomizationSettings,
  UserSettings,
} from "./contracts";
import {
  DEFAULT_AI_MODEL_BY_PROVIDER,
  isSupportedAIModel,
  type AIProvider,
} from "@/lib/ai-models";
import {
  buildBranding,
  normalizeBrandColor,
  sanitizeTenantCustomTexts,
  sanitizeTenantFeatureFlags,
  type BrandColorKey,
} from "@/lib/branding";

const USER_SETTINGS_SELECT = {
  aiApiKey: true,
  aiProvider: true,
  aiModel: true,
  greetingMessage: true,
  autoReplyEnabled: true,
  auto_reply_delay_seconds: true,
  followUpEnabled: true,
  followUpDelayHours: true,
  maxFollowUps: true,
} as const;

const TENANT_CUSTOMIZATION_SELECT = {
  id: true,
  slug: true,
  status: true,
  name: true,
  logoUrl: true,
  colorPrimary: true,
  colorSecondary: true,
  customTexts: true,
  featureFlags: true,
} as const;

const DEFAULT_USER_SETTINGS: UserSettings = {
  aiProvider: "openai",
  aiApiKey: null,
  aiModel: DEFAULT_AI_MODEL_BY_PROVIDER.openai,
  greetingMessage: null,
  autoReplyEnabled: true,
  autoReplyDelaySeconds: 0,
  followUpEnabled: true,
  followUpDelayHours: 24,
  maxFollowUps: 3,
};

type UserSettingsRecord = {
  aiApiKey: string | null;
  aiProvider: string;
  aiModel: string;
  greetingMessage: string | null;
  autoReplyEnabled: boolean;
  auto_reply_delay_seconds: number;
  followUpEnabled: boolean;
  followUpDelayHours: number;
  maxFollowUps: number;
};

type TenantAccessContext = {
  role: string;
  tenantId: string | null | undefined;
};

type UserSettingsPayload = Partial<UserSettings>;
type PrismaUserSettingsPayload = Omit<UserSettingsPayload, "autoReplyDelaySeconds"> & {
  auto_reply_delay_seconds?: number;
};

export class TenantAccessError extends Error {
  constructor() {
    super("TENANT_ACCESS_DENIED");
  }
}

function mapUserSettings(
  settings: UserSettingsRecord | null | undefined,
  maskApiKey: boolean,
): UserSettings {
  if (!settings) {
    return { ...DEFAULT_USER_SETTINGS };
  }

  const provider = normalizeSettingsProvider(
    settings.aiProvider,
    DEFAULT_USER_SETTINGS.aiProvider as AIProvider,
  );

  return {
    aiProvider: provider,
    aiApiKey: maskApiKey ? maskSecret(settings.aiApiKey) : settings.aiApiKey,
    aiModel: isSupportedAIModel(provider, settings.aiModel)
      ? settings.aiModel
      : DEFAULT_AI_MODEL_BY_PROVIDER[provider],
    greetingMessage: settings.greetingMessage ?? null,
    autoReplyEnabled: settings.autoReplyEnabled,
    autoReplyDelaySeconds: normalizeAutoReplyDelaySeconds(
      settings.auto_reply_delay_seconds,
    ),
    followUpEnabled: settings.followUpEnabled,
    followUpDelayHours: settings.followUpDelayHours,
    maxFollowUps: settings.maxFollowUps,
  };
}

function pickAllowedSettings(input: Record<string, unknown>): UserSettingsPayload {
  const next: UserSettingsPayload = {};

  if (typeof input.aiProvider === "string") {
    next.aiProvider = input.aiProvider;
  }

  if (typeof input.aiApiKey === "string" || input.aiApiKey === null) {
    next.aiApiKey = input.aiApiKey;
  }

  if (typeof input.aiModel === "string") {
    next.aiModel = input.aiModel;
  }

  if (
    typeof input.greetingMessage === "string" ||
    input.greetingMessage === null
  ) {
    next.greetingMessage = input.greetingMessage;
  }

  if (typeof input.autoReplyEnabled === "boolean") {
    next.autoReplyEnabled = input.autoReplyEnabled;
  }

  if (
    typeof input.autoReplyDelaySeconds === "number" &&
    Number.isFinite(input.autoReplyDelaySeconds)
  ) {
    next.autoReplyDelaySeconds = normalizeAutoReplyDelaySeconds(
      input.autoReplyDelaySeconds,
    );
  }

  if (typeof input.followUpEnabled === "boolean") {
    next.followUpEnabled = input.followUpEnabled;
  }

  if (
    typeof input.followUpDelayHours === "number" &&
    Number.isFinite(input.followUpDelayHours)
  ) {
    next.followUpDelayHours = input.followUpDelayHours;
  }

  if (
    typeof input.maxFollowUps === "number" &&
    Number.isFinite(input.maxFollowUps)
  ) {
    next.maxFollowUps = input.maxFollowUps;
  }

  return next;
}

function requireTenantAccess(context: TenantAccessContext): string {
  if (context.role !== "admin" || !context.tenantId) {
    throw new TenantAccessError();
  }

  return context.tenantId;
}

function mapTenantCustomization(
  tenant: {
    id: string;
    slug: string;
    status: string;
    name: string;
    logoUrl: string | null;
    colorPrimary: string;
    colorSecondary: string;
    customTexts: unknown;
    featureFlags: unknown;
  },
): TenantCustomizationSettings {
  return {
    id: tenant.id,
    slug: tenant.slug,
    status: tenant.status,
    ...buildBranding(tenant),
  };
}

export async function getUserSettings(
  userId: string,
  options?: { maskApiKey?: boolean },
): Promise<UserSettings> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: USER_SETTINGS_SELECT,
  });

  return mapUserSettings(settings, options?.maskApiKey ?? false);
}

export async function updateUserSettings(
  userId: string,
  input: Record<string, unknown>,
  options?: { maskApiKey?: boolean },
): Promise<UserSettings> {
  const currentSettings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { aiProvider: true },
  });
  const currentProvider = normalizeSettingsProvider(currentSettings?.aiProvider);
  const rawData = pickAllowedSettings(input);
  const { autoReplyDelaySeconds, ...restData } = rawData;
  const nextProvider = normalizeSettingsProvider(rawData.aiProvider, currentProvider);
  const data: PrismaUserSettingsPayload = {
    ...restData,
    aiProvider: nextProvider,
  };

  if (typeof autoReplyDelaySeconds === "number") {
    data.auto_reply_delay_seconds = autoReplyDelaySeconds;
  }

  if (rawData.aiModel) {
    data.aiModel = isSupportedAIModel(nextProvider, rawData.aiModel)
      ? rawData.aiModel
      : DEFAULT_AI_MODEL_BY_PROVIDER[nextProvider];
  } else if (rawData.aiProvider) {
    data.aiModel = DEFAULT_AI_MODEL_BY_PROVIDER[nextProvider];
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select: USER_SETTINGS_SELECT,
  });

  return mapUserSettings(settings, options?.maskApiKey ?? false);
}

export async function getTenantCustomization(
  context: TenantAccessContext,
): Promise<TenantCustomizationSettings | null> {
  const tenantId = requireTenantAccess(context);
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: TENANT_CUSTOMIZATION_SELECT,
  });

  return tenant ? mapTenantCustomization(tenant) : null;
}

export async function updateTenantCustomization(
  context: TenantAccessContext,
  input: Record<string, unknown>,
): Promise<TenantCustomizationSettings | null> {
  const tenantId = requireTenantAccess(context);
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (!name) {
    throw new Error("TENANT_NAME_REQUIRED");
  }

  const branding = buildBranding({
    name,
    logoUrl: typeof input.logoUrl === "string" ? input.logoUrl : null,
    colorPrimary: normalizeBrandColor(
      typeof input.colorPrimary === "string" ? input.colorPrimary : null,
      "blue" satisfies BrandColorKey,
    ),
    colorSecondary: normalizeBrandColor(
      typeof input.colorSecondary === "string" ? input.colorSecondary : null,
      "purple" satisfies BrandColorKey,
    ),
    customTexts: sanitizeTenantCustomTexts(input.customTexts),
    featureFlags: sanitizeTenantFeatureFlags(input.featureFlags),
  });

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: branding.name,
      logoUrl: branding.logoUrl,
      colorPrimary: branding.colorPrimary,
      colorSecondary: branding.colorSecondary,
      customTexts: branding.customTexts,
      featureFlags: branding.featureFlags,
    },
    select: TENANT_CUSTOMIZATION_SELECT,
  });

  return mapTenantCustomization(tenant);
}
