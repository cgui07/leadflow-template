"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

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
        <div className={cn("flex items-start gap-3", className)}>
          <button
            ref={ref}
            type="button"
            role="switch"
            id={fieldId}
            aria-checked={checked}
            disabled={disabled}
            onClick={handleToggle}
            className={cn(
              "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              checked ? "bg-primary" : "bg-slate-300"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5",
                checked ? "translate-x-[18px]" : "translate-x-0.5"
              )}
            />
          </button>
          {(label || description) && (
            <div>
              {label && (
                <label
                  htmlFor={fieldId}
                  className="text-sm font-medium text-slate-700 cursor-pointer"
                  onClick={handleToggle}
                >
                  {label}
                </label>
              )}
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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
            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors mt-0.5",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            checked
              ? "bg-primary border-primary text-white"
              : "border-slate-300 bg-white"
          )}
        >
          {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>
        {(label || description) && (
          <div>
            {label && (
              <label
                htmlFor={fieldId}
                className="text-sm font-medium text-slate-700 cursor-pointer"
                onClick={handleToggle}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

CheckboxField.displayName = "CheckboxField";
