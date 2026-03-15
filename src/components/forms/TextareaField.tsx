"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
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
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
            error ? "border-red-300 focus:ring-danger" : "border-slate-300",
            className
          )}
          {...props}
        />
        {showCount && maxLength && (
          <div className="text-xs text-slate-400 text-right">
            {charCount}/{maxLength}
          </div>
        )}
      </FieldWrapper>
    );
  }
);

TextareaField.displayName = "TextareaField";
