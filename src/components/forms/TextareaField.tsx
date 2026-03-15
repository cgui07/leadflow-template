"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useId } from "react";
import { FieldWrapper } from "./FieldWrapper";

interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  showCount?: boolean;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    {
      label,
      description,
      error,
      hint,
      fullWidth = true,
      showCount,
      maxLength,
      className,
      id,
      required,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <FieldWrapper
        label={label}
        htmlFor={fieldId}
        required={required}
        error={error}
        hint={hint}
        description={description}
        className={fullWidth ? "w-full" : undefined}
      >
        <textarea
          ref={ref}
          id={fieldId}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          rows={4}
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors resize-y",
            "placeholder:text-neutral-muted",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:bg-neutral-surface disabled:text-neutral-muted disabled:cursor-not-allowed",
            error ? "border-red-blush focus:ring-danger" : "border-neutral-line",
            className
          )}
          {...props}
        />
        {showCount && maxLength && (
          <div className="text-xs text-neutral-muted text-right">
            {charCount}/{maxLength}
          </div>
        )}
      </FieldWrapper>
    );
  }
);

TextareaField.displayName = "TextareaField";
