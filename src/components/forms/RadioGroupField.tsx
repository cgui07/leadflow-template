"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface RadioOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface RadioGroupFieldProps<T extends string = string> {
  label?: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layout?: "vertical" | "horizontal";
  className?: string;
}

export function RadioGroupField<T extends string = string>({
  label,
  options,
  value,
  onChange,
  layout = "vertical",
  className,
}: RadioGroupFieldProps<T>) {
  const groupId = useId();

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="text-sm font-medium text-neutral-dark">{label}</div>
      )}
      <div
        className={cn(
          "gap-2",
          layout === "horizontal"
            ? "grid grid-cols-2"
            : "flex flex-col",
        )}
      >
        {options.map((option) => {
          const checked = option.value === value;
          const inputId = `${groupId}-${option.value}`;

          return (
            <div
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                checked
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface-raised hover:border-neutral-line",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  checked
                    ? "border-primary"
                    : "border-neutral-line bg-white",
                )}
              >
                {checked && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <div className="space-y-0.5">
                <label
                  htmlFor={inputId}
                  className="cursor-pointer text-sm font-medium leading-5 text-neutral-dark"
                >
                  {option.label}
                </label>
                {option.description && (
                  <div className="text-xs leading-relaxed text-neutral">
                    {option.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
