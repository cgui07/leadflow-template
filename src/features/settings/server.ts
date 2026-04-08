import { prisma } from "@/lib/db";
import { maskSecret, normalizeSettingsProvider } from "./utils";
import { normalizeAutoReplyDelaySeconds } from "@/lib/auto-reply-delay";
import type { TenantCustomizationSettings, UserSettings } from "./contracts";
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
  openaiTranscriptionKey: true,
  greetingMessage: true,
  autoReplyEnabled: true,
  auto_reply_delay_seconds: true,
  followUpEnabled: true,
  followUpDelayHours: true,
  maxFollowUps: true,
  followUpCustomInstructions: true,
  facebookAutoOutreach: true,
  canalProAutoOutreach: true,
  canalProWebhookToken: true,
  elevenlabsVoiceId: true,
  voiceReplyEnabled: true,
  voiceReplyMonthlyLimit: true,
  userId: true,
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
  openaiTranscriptionKey: null,
  greetingMessage: null,
  autoReplyEnabled: true,
  autoReplyDelaySeconds: 0,
  followUpEnabled: true,
  followUpDelayHours: 24,
  maxFollowUps: 3,
  followUpCustomInstructions: null,
  facebookAutoOutreach: true,
  facebookConnected: false,
  canalProAutoOutreach: true,
  canalProConnected: false,
  elevenlabsVoiceId: null,
  voiceReplyEnabled: false,
  voiceReplyMonthlyLimit: 50,
};

type UserSettingsRecord = {
  aiApiKey: string | null;
  aiProvider: string;
  aiModel: string;
  openaiTranscriptionKey: string | null;
  greetingMessage: string | null;
  autoReplyEnabled: boolean;
  auto_reply_delay_seconds: number;
  followUpEnabled: boolean;
  followUpDelayHours: number;
  maxFollowUps: number;
  followUpCustomInstructions: string | null;
  facebookAutoOutreach: boolean;
  canalProAutoOutreach: boolean;
  canalProWebhookToken: string | null;
  elevenlabsVoiceId: string | null;
  voiceReplyEnabled: boolean;
  voiceReplyMonthlyLimit: number;
  userId: string;
};

type TenantAccessContext = {
  role: string;
  tenantId: string | null | undefined;
};

type UserSettingsPayload = Partial<UserSettings>;
type PrismaUserSettingsPayload = Omit<
  UserSettingsPayload,
  "autoReplyDelaySeconds" | "facebookConnected" | "canalProConnected"
> & {
  auto_reply_delay_seconds?: number;
};

export class TenantAccessError extends Error {
  constructor() {
    super("TENANT_ACCESS_DENIED");
  }
}

async function mapUserSettings(
  settings: UserSettingsRecord | null | undefined,
  maskApiKey: boolean,
): Promise<UserSettings> {
  if (!settings) {
    return { ...DEFAULT_USER_SETTINGS };
  }

  const provider = normalizeSettingsProvider(
    settings.aiProvider,
    DEFAULT_USER_SETTINGS.aiProvider as AIProvider,
  );

  const facebookPage = await prisma.facebookPageMapping.findFirst({
    where: { userId: settings.userId },
    select: { pageId: true },
  });

  return {
    aiProvider: provider,
    aiApiKey: maskApiKey ? maskSecret(settings.aiApiKey) : settings.aiApiKey,
    aiModel: isSupportedAIModel(provider, settings.aiModel)
      ? settings.aiModel
      : DEFAULT_AI_MODEL_BY_PROVIDER[provider],
    openaiTranscriptionKey: maskApiKey
      ? maskSecret(settings.openaiTranscriptionKey)
      : settings.openaiTranscriptionKey,
    greetingMessage: settings.greetingMessage ?? null,
    autoReplyEnabled: settings.autoReplyEnabled,
    autoReplyDelaySeconds: normalizeAutoReplyDelaySeconds(
      settings.auto_reply_delay_seconds,
    ),
    followUpEnabled: settings.followUpEnabled,
    followUpDelayHours: settings.followUpDelayHours,
    maxFollowUps: settings.maxFollowUps,
    followUpCustomInstructions: settings.followUpCustomInstructions ?? null,
    facebookAutoOutreach: settings.facebookAutoOutreach,
    facebookConnected: !!facebookPage,
    canalProAutoOutreach: settings.canalProAutoOutreach,
    canalProConnected: !!settings.canalProWebhookToken,
    elevenlabsVoiceId: settings.elevenlabsVoiceId,
    voiceReplyEnabled: settings.voiceReplyEnabled,
    voiceReplyMonthlyLimit: settings.voiceReplyMonthlyLimit,
  };
}

function pickAllowedSettings(
  input: Record<string, unknown>,
): UserSettingsPayload {
  const next: UserSettingsPayload = {};

  if (typeof input.aiProvider === "string") {
    next.aiProvider = input.aiProvider;
  }

  if (typeof input.aiApiKey === "string" || input.aiApiKey === null) {
    next.aiApiKey = input.aiApiKey;
  }

  if (
    typeof input.openaiTranscriptionKey === "string" ||
    input.openaiTranscriptionKey === null
  ) {
    next.openaiTranscriptionKey = input.openaiTranscriptionKey;
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

  if (
    typeof input.followUpCustomInstructions === "string" ||
    input.followUpCustomInstructions === null
  ) {
    next.followUpCustomInstructions =
      typeof input.followUpCustomInstructions === "string" &&
      input.followUpCustomInstructions.trim()
        ? input.followUpCustomInstructions.trim()
        : null;
  }

  if (typeof input.facebookAutoOutreach === "boolean") {
    next.facebookAutoOutreach = input.facebookAutoOutreach;
  }

  if (typeof input.canalProAutoOutreach === "boolean") {
    next.canalProAutoOutreach = input.canalProAutoOutreach;
  }

  if (typeof input.elevenlabsVoiceId === "string" || input.elevenlabsVoiceId === null) {
    next.elevenlabsVoiceId = input.elevenlabsVoiceId;
  }

  if (typeof input.voiceReplyEnabled === "boolean") {
    next.voiceReplyEnabled = input.voiceReplyEnabled;
  }

  if (
    typeof input.voiceReplyMonthlyLimit === "number" &&
    Number.isFinite(input.voiceReplyMonthlyLimit) &&
    input.voiceReplyMonthlyLimit >= 0
  ) {
    next.voiceReplyMonthlyLimit = input.voiceReplyMonthlyLimit;
  }

  return next;
}

function requireTenantAccess(context: TenantAccessContext): string {
  if (context.role !== "admin" || !context.tenantId) {
    throw new TenantAccessError();
  }

  return context.tenantId;
}

function mapTenantCustomization(tenant: {
  id: string;
  slug: string;
  status: string;
  name: string;
  logoUrl: string | null;
  colorPrimary: string;
  colorSecondary: string;
  customTexts: unknown;
  featureFlags: unknown;
}): TenantCustomizationSettings {
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
  const currentProvider = normalizeSettingsProvider(
    currentSettings?.aiProvider,
  );
  const rawData = pickAllowedSettings(input);
  const { autoReplyDelaySeconds, facebookConnected: _fc, canalProConnected: _cpc, ...restData } = rawData;
  const nextProvider = normalizeSettingsProvider(
    rawData.aiProvider,
    currentProvider,
  );
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
