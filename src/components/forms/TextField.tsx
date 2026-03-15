"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef, useId } from "react";
import { FieldWrapper } from "./FieldWrapper";

type TextFieldSize = "sm" | "md" | "lg";

interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fieldSize?: TextFieldSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const sizeStyles: Record<TextFieldSize, string> = {
  sm: "h-8 text-sm px-3",
  md: "h-9 text-sm px-3",
  lg: "h-11 text-base px-4",
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      description,
      error,
      hint,
      icon,
      prefix,
      suffix,
      fieldSize = "md",
      fullWidth = true,
      loading,
      className,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    const hasPrefix = !!prefix || !!icon;
    const hasSuffix = !!suffix || loading;

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
        <div className="relative">
          {hasPrefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-neutral-muted pointer-events-none">
              {icon ?? prefix}
            </div>
          )}
          <input
            ref={ref}
            id={fieldId}
            disabled={disabled || loading}
            required={required}
            className={cn(
              "w-full rounded-lg border bg-white transition-colors",
              "placeholder:text-neutral-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "disabled:bg-neutral-surface disabled:text-neutral-muted disabled:cursor-not-allowed",
              error
                ? "border-red-blush focus:ring-danger"
                : "border-neutral-line",
              sizeStyles[fieldSize],
              hasPrefix && "pl-9",
              hasSuffix && "pr-9",
              className
            )}
            {...props}
          />
          {hasSuffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-neutral-muted">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                suffix
              )}
            </div>
          )}
        </div>
      </FieldWrapper>
    );
  }
);

TextField.displayName = "TextField";
