import { prisma } from "@/lib/db";
import { MetaProvider } from "./meta/provider";
import { EvolutionProvider } from "./evolution/provider";
import type { WhatsAppProvider, ProviderType } from "./types";

// Singleton instances — stateless, safe to reuse
const providers: Record<ProviderType, WhatsAppProvider> = {
  evolution: new EvolutionProvider(),
  meta: new MetaProvider(),
};

/**
 * Get a provider instance by type.
 */
export function getProvider(type: ProviderType = "evolution"): WhatsAppProvider {
  return providers[type];
}

/**
 * Get the Evolution provider (typed). Use when you need Evolution-specific
 * methods like getQrCode() or setWebhook().
 */
export function getEvolutionProvider(): EvolutionProvider {
  return providers.evolution as EvolutionProvider;
}

/**
 * Resolve the correct provider + instanceId for a given user.
 * Reads whatsappProvider from the database (defaults to "evolution").
 */
export async function resolveProviderForUser(userId: string): Promise<{
  provider: WhatsAppProvider;
  instanceId: string;
  providerType: ProviderType;
}> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { whatsappPhoneId: true },
  });

  const providerType: ProviderType = "evolution";
  const provider = getProvider(providerType);
  const instanceId = settings?.whatsappPhoneId || provider.instanceIdForUser(userId);

  return { provider, instanceId, providerType };
}

/**
 * Resolve provider by instanceId (used in webhook where we only have the instance name).
 * Looks up which user owns this instance and returns their provider.
 */
export async function resolveProviderByInstance(instanceId: string): Promise<{
  provider: WhatsAppProvider;
  userId: string;
  settings: {
    whatsappWebhookToken: string | null;
    autoReplyEnabled: boolean;
    auto_reply_delay_seconds: number;
    followUpEnabled: boolean;
    followUpDelayHours: number;
    audioTranscriptionEnabled: boolean;
    aiApiKey: string | null;
    openaiTranscriptionKey: string | null;
  };
} | null> {
  const settings = await prisma.userSettings.findFirst({
    where: { whatsappPhoneId: instanceId },
    include: { user: true },
  });

  if (!settings) return null;

  const providerType: ProviderType = "evolution";

  return {
    provider: getProvider(providerType),
    userId: settings.userId,
    settings: {
      whatsappWebhookToken: settings.whatsappWebhookToken,
      autoReplyEnabled: settings.autoReplyEnabled,
      auto_reply_delay_seconds: settings.auto_reply_delay_seconds,
      followUpEnabled: settings.followUpEnabled,
      followUpDelayHours: settings.followUpDelayHours,
      audioTranscriptionEnabled: settings.audioTranscriptionEnabled,
      aiApiKey: settings.aiApiKey,
      openaiTranscriptionKey: settings.openaiTranscriptionKey,
    },
  };
}
