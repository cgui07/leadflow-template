import type { SelectOption } from "@/types";

export type AIProvider = "openai" | "anthropic";

export const AI_PROVIDER_OPTIONS: SelectOption[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic (Claude)" },
];

const OPENAI_MODEL_OPTIONS: SelectOption[] = [
  { value: "gpt-4o-mini", label: "GPT-4o mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
];

const ANTHROPIC_MODEL_OPTIONS: SelectOption[] = [
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  { value: "claude-sonnet-4-6-20250627", label: "Claude Sonnet 4.6" },
  { value: "claude-opus-4-6-20250627", label: "Claude Opus 4.6" },
];

export const AI_MODEL_OPTIONS_BY_PROVIDER: Record<AIProvider, SelectOption[]> =
  {
    openai: OPENAI_MODEL_OPTIONS,
    anthropic: ANTHROPIC_MODEL_OPTIONS,
  };

export const DEFAULT_AI_MODEL_BY_PROVIDER: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
};

export function isSupportedAIProvider(value: string): value is AIProvider {
  return value === "openai" || value === "anthropic";
}

export function getAIModelOptions(provider: AIProvider) {
  return AI_MODEL_OPTIONS_BY_PROVIDER[provider];
}

export function isSupportedAIModel(provider: AIProvider, model: string) {
  return getAIModelOptions(provider).some((option) => option.value === model);
}
