"use client";

import { cn } from "@/lib/utils";
import { useId, useState } from "react";
import { TextField } from "./TextField";
import { SelectField } from "./SelectField";
import { FieldWrapper } from "./FieldWrapper";
import {
  AUTO_REPLY_DELAY_CUSTOM_VALUE,
  AUTO_REPLY_DELAY_PRESET_OPTIONS,
  AUTO_REPLY_DELAY_UNIT_OPTIONS,
  getAutoReplyDelayInputState,
  getAutoReplyDelayPresetKey,
  normalizeAutoReplyDelaySeconds,
  parseAutoReplyDelayInput,
  type AutoReplyDelayUnit,
} from "@/lib/auto-reply-delay";

interface DurationFieldProps {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  valueSeconds: number;
  onChange: (seconds: number) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

function getDisplayedAmount(seconds: number, unit: AutoReplyDelayUnit) {
  const normalized = normalizeAutoReplyDelaySeconds(seconds);

  if (unit === "minutes") {
    return String(Math.round(normalized / 60));
  }

  return String(normalized);
}

export function DurationField({
  label,
  description,
  error,
  hint,
  valueSeconds,
  onChange,
  disabled,
  id,
  className,
}: DurationFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const amountId = `${fieldId}-amount`;
  const unitId = `${fieldId}-unit`;
  const selectedPreset = getAutoReplyDelayPresetKey(valueSeconds);
  const initialCustomState = getAutoReplyDelayInputState(valueSeconds);
  const [customOpen, setCustomOpen] = useState(false);
  const [customUnit, setCustomUnit] = useState<AutoReplyDelayUnit | null>(null);
  const [draftAmount, setDraftAmount] = useState<string | null>(null);
  const resolvedUnit = customUnit ?? initialCustomState.unit;
  const derivedAmount = getDisplayedAmount(valueSeconds, resolvedUnit);
  const displayedAmount = draftAmount ?? derivedAmount;
  const selectValue =
    customOpen || selectedPreset === AUTO_REPLY_DELAY_CUSTOM_VALUE
      ? AUTO_REPLY_DELAY_CUSTOM_VALUE
      : selectedPreset;

  function handlePresetChange(nextPreset: string) {
    setDraftAmount(null);

    if (nextPreset === AUTO_REPLY_DELAY_CUSTOM_VALUE) {
      setCustomOpen(true);
      return;
    }

    setCustomOpen(false);
    onChange(Number.parseInt(nextPreset, 10) || 0);
  }

  function handleCustomAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextAmount = event.target.value.replace(/[^\d]/g, "");
    setDraftAmount(nextAmount);
    onChange(parseAutoReplyDelayInput(nextAmount, resolvedUnit));
  }

  function handleCustomAmountBlur() {
    setDraftAmount(null);
  }

  function handleCustomUnitChange(nextUnit: string) {
    const normalizedUnit = nextUnit as AutoReplyDelayUnit;
    setCustomUnit(normalizedUnit);
    setDraftAmount(null);

    if (normalizedUnit === "minutes") {
      onChange(
        Math.round(normalizeAutoReplyDelaySeconds(valueSeconds) / 60) * 60,
      );
      return;
    }

    onChange(normalizeAutoReplyDelaySeconds(valueSeconds));
  }

  return (
    <FieldWrapper
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      description={description}
      className={className}
    >
      <div
        className={cn(
          "grid gap-3",
          selectValue === AUTO_REPLY_DELAY_CUSTOM_VALUE && "md:grid-cols-3",
        )}
      >
        <div
          className={cn(
            selectValue !== AUTO_REPLY_DELAY_CUSTOM_VALUE && "md:max-w-[280px]",
          )}
        >
          <SelectField
            id={fieldId}
            value={selectValue}
            options={AUTO_REPLY_DELAY_PRESET_OPTIONS}
            placeholder="Selecione o tempo"
            onChange={handlePresetChange}
            disabled={disabled}
            error={error}
          />
        </div>

        {selectValue === AUTO_REPLY_DELAY_CUSTOM_VALUE && (
          <>
            <TextField
              id={amountId}
              type="number"
              min={0}
              inputMode="numeric"
              value={displayedAmount}
              disabled={disabled}
              error={error}
              onBlur={handleCustomAmountBlur}
              onChange={handleCustomAmountChange}
              placeholder="Ex.: 45"
            />
            <SelectField
              id={unitId}
              value={resolvedUnit}
              options={AUTO_REPLY_DELAY_UNIT_OPTIONS}
              onChange={handleCustomUnitChange}
              disabled={disabled}
              error={error}
            />
          </>
        )}
      </div>
    </FieldWrapper>
  );
}
