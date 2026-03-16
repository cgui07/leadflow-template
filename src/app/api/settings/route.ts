import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { json, error, requireAuth, handleError } from "@/lib/api";
import {
  DEFAULT_AI_MODEL_BY_PROVIDER,
  isSupportedAIModel,
  isSupportedAIProvider,
  type AIProvider,
} from "@/lib/ai-models";

type SettingsPayload = {
  aiProvider?: string;
  aiApiKey?: string | null;
  aiModel?: string;
  greetingMessage?: string | null;
  autoReplyEnabled?: boolean;
  followUpEnabled?: boolean;
  followUpDelayHours?: number;
  maxFollowUps?: number;
};

function pickAllowedSettings(input: Record<string, unknown>): SettingsPayload {
  const next: SettingsPayload = {};

  if (typeof input.aiProvider === "string") next.aiProvider = input.aiProvider;
  if (typeof input.aiApiKey === "string" || input.aiApiKey === null) next.aiApiKey = input.aiApiKey;
  if (typeof input.aiModel === "string") next.aiModel = input.aiModel;
  if (typeof input.greetingMessage === "string" || input.greetingMessage === null) {
    next.greetingMessage = input.greetingMessage;
  }
  if (typeof input.autoReplyEnabled === "boolean") next.autoReplyEnabled = input.autoReplyEnabled;
  if (typeof input.followUpEnabled === "boolean") next.followUpEnabled = input.followUpEnabled;
  if (typeof input.followUpDelayHours === "number" && Number.isFinite(input.followUpDelayHours)) {
    next.followUpDelayHours = input.followUpDelayHours;
  }
  if (typeof input.maxFollowUps === "number" && Number.isFinite(input.maxFollowUps)) {
    next.maxFollowUps = input.maxFollowUps;
  }

  return next;
}

function normalizeProvider(provider: string | undefined, fallback: AIProvider = "openai"): AIProvider {
  return provider && isSupportedAIProvider(provider) ? provider : fallback;
}

export async function GET() {
  try {
    const user = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) return error("Configurações não encontradas", 404);

    return json({
      aiApiKey: settings.aiApiKey ? "••••••" + settings.aiApiKey.slice(-4) : null,
      aiProvider: settings.aiProvider,
      aiModel: settings.aiModel,
      greetingMessage: settings.greetingMessage,
      autoReplyEnabled: settings.autoReplyEnabled,
      followUpEnabled: settings.followUpEnabled,
      followUpDelayHours: settings.followUpDelayHours,
      maxFollowUps: settings.maxFollowUps,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const currentSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: { aiProvider: true },
    });
    const currentProvider = normalizeProvider(currentSettings?.aiProvider);
    const rawData = pickAllowedSettings(body);
    const nextProvider = normalizeProvider(rawData.aiProvider, currentProvider);
    const data: SettingsPayload = {
      ...rawData,
      aiProvider: nextProvider,
    };

    if (rawData.aiModel) {
      data.aiModel = isSupportedAIModel(nextProvider, rawData.aiModel)
        ? rawData.aiModel
        : DEFAULT_AI_MODEL_BY_PROVIDER[nextProvider];
    } else if (rawData.aiProvider) {
      data.aiModel = DEFAULT_AI_MODEL_BY_PROVIDER[nextProvider];
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });

    return json(settings);
  } catch (err) {
    return handleError(err);
  }
}
