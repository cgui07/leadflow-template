import { isSupportedAIProvider, type AIProvider } from "@/lib/ai-models";

const SETTINGS_MASK_PREFIX = "••••••";

export function normalizeSettingsProvider(
  provider: string | undefined,
  fallback: AIProvider = "openai",
): AIProvider {
  return provider && isSupportedAIProvider(provider) ? provider : fallback;
}

export function maskSecret(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return `${SETTINGS_MASK_PREFIX}${value.slice(-4)}`;
}
