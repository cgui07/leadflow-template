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
  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
];

export const AI_MODEL_OPTIONS_BY_PROVIDER: Record<AIProvider, SelectOption[]> = {
  openai: OPENAI_MODEL_OPTIONS,
  anthropic: ANTHROPIC_MODEL_OPTIONS,
};

export const DEFAULT_AI_MODEL_BY_PROVIDER: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
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
