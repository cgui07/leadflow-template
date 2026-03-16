import type { SelectOption } from "@/types";

export const AUTO_REPLY_DELAY_PRESET_VALUES = [0, 10, 15, 30] as const;
export const AUTO_REPLY_DELAY_CUSTOM_VALUE = "custom";
export const MAX_AUTO_REPLY_DELAY_SECONDS = 60 * 60 * 24;

export const AUTO_REPLY_DELAY_PRESET_OPTIONS: SelectOption[] = [
  { value: "0", label: "Imediatamente" },
  { value: "10", label: "10 segundos" },
  { value: "15", label: "15 segundos" },
  { value: "30", label: "30 segundos" },
  { value: AUTO_REPLY_DELAY_CUSTOM_VALUE, label: "Definir manualmente" },
];

export const AUTO_REPLY_DELAY_UNIT_OPTIONS: SelectOption[] = [
  { value: "seconds", label: "Segundos" },
  { value: "minutes", label: "Minutos" },
];

export type AutoReplyDelayUnit = "seconds" | "minutes";

export function normalizeAutoReplyDelaySeconds(
  value: unknown,
  fallback = 0,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const normalized = Math.round(value);
  return Math.min(Math.max(normalized, 0), MAX_AUTO_REPLY_DELAY_SECONDS);
}

export function getAutoReplyDelayPresetKey(seconds: number) {
  const normalized = normalizeAutoReplyDelaySeconds(seconds);

  return AUTO_REPLY_DELAY_PRESET_VALUES.includes(
    normalized as (typeof AUTO_REPLY_DELAY_PRESET_VALUES)[number],
  )
    ? String(normalized)
    : AUTO_REPLY_DELAY_CUSTOM_VALUE;
}

export function getAutoReplyDelayInputState(seconds: number) {
  const normalized = normalizeAutoReplyDelaySeconds(seconds);

  if (normalized >= 60 && normalized % 60 === 0) {
    return {
      amount: String(normalized / 60),
      unit: "minutes" as const,
    };
  }

  return {
    amount: String(normalized),
    unit: "seconds" as const,
  };
}

export function parseAutoReplyDelayInput(
  rawAmount: string,
  unit: AutoReplyDelayUnit,
) {
  const numericAmount = Number.parseInt(rawAmount, 10);

  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    return 0;
  }

  const multiplier = unit === "minutes" ? 60 : 1;
  return normalizeAutoReplyDelaySeconds(numericAmount * multiplier);
}
