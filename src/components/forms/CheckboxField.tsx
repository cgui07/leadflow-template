"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { forwardRef, useId } from "react";

type CheckboxVariant = "checkbox" | "switch";

interface CheckboxFieldProps {
  label?: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  variant?: CheckboxVariant;
  disabled?: boolean;
  error?: string;
  id?: string;
  className?: string;
}

export const CheckboxField = forwardRef<HTMLButtonElement, CheckboxFieldProps>(
  (
    {
      label,
      description,
      checked = false,
      onChange,
      variant = "checkbox",
      disabled,
      error,
      id,
      className,
    },
    ref
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    function handleToggle() {
      if (!disabled) {
        onChange?.(!checked);
      }
    }

    if (variant === "switch") {
      return (
        <div className={cn("flex items-start gap-3.5", className)}>
          <button
            ref={ref}
            type="button"
            role="switch"
            id={fieldId}
            aria-checked={checked}
            disabled={disabled}
            onClick={handleToggle}
            className={cn(
              "relative mt-0.5 inline-flex h-7 w-12 shrink-0 rounded-full border transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              checked
                ? "border-blue-royal bg-primary"
                : "border-neutral-line bg-neutral-surface",
            )}
          >
            <div
              className={cn(
                "absolute left-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
                checked ? "translate-x-5 text-primary" : "translate-x-0 text-neutral-muted",
              )}
            >
              {checked ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <div className="h-2 w-2 rounded-full bg-neutral-line" />
              )}
            </div>
          </button>
          {(label || description) && (
            <div className="space-y-0.5">
              {label && (
                <label
                  htmlFor={fieldId}
                  className="cursor-pointer text-sm font-medium leading-5 text-neutral-dark"
                  onClick={handleToggle}
                >
                  {label}
                </label>
              )}
              {description && (
                <div className="text-xs leading-5 text-neutral">{description}</div>
              )}
              {error && <div className="text-xs text-danger mt-1">{error}</div>}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={cn("flex items-start gap-3", className)}>
        <button
          ref={ref}
          type="button"
          role="checkbox"
          id={fieldId}
          aria-checked={checked}
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked
              ? "border-primary bg-primary text-white shadow-sm"
              : "border-neutral-line bg-white text-transparent",
          )}
        >
          {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
        </button>
        {(label || description) && (
          <div>
            {label && (
              <label
                htmlFor={fieldId}
                className="text-sm font-medium text-neutral-dark cursor-pointer"
                onClick={handleToggle}
              >
                {label}
              </label>
            )}
            {description && (
              <div className="text-xs text-neutral mt-0.5">{description}</div>
            )}
            {error && <div className="text-xs text-danger mt-1">{error}</div>}
          </div>
        )}
      </div>
    );
  }
);

CheckboxField.displayName = "CheckboxField";
