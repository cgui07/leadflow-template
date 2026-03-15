"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { FieldWrapper } from "./FieldWrapper";

type DateFieldType = "date" | "datetime-local" | "time" | "month";
type DateFieldSize = "sm" | "md" | "lg";

interface DateFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  fieldType?: DateFieldType;
  fieldSize?: DateFieldSize;
  fullWidth?: boolean;
}

const sizeStyles: Record<DateFieldSize, string> = {
  sm: "h-8 text-sm px-3",
  md: "h-9 text-sm px-3",
  lg: "h-11 text-base px-4",
};

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  (
    {
      label,
      description,
      error,
      hint,
      fieldType = "date",
      fieldSize = "md",
      fullWidth = true,
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
        <input
          ref={ref}
          id={fieldId}
          type={fieldType}
          disabled={disabled}
          required={required}
          className={cn(
            "w-full rounded-lg border bg-white transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:bg-neutral-surface disabled:text-neutral-muted disabled:cursor-not-allowed",
            error ? "border-red-blush focus:ring-danger" : "border-neutral-line",
            sizeStyles[fieldSize],
            className
          )}
          {...props}
        />
      </FieldWrapper>
    );
  }
);

DateField.displayName = "DateField";
