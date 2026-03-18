"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useId } from "react";
import { FieldWrapper } from "./FieldWrapper";

interface FileFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  hidden?: boolean;
}

export const FileField = forwardRef<HTMLInputElement, FileFieldProps>(
  (
    {
      label,
      description,
      error,
      hint,
      fullWidth = true,
      hidden = false,
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

    const input = (
      <input
        ref={ref}
        id={fieldId}
        type="file"
        disabled={disabled}
        required={required}
        className={cn(
          "w-full rounded-lg border bg-white transition-colors",
          "placeholder:text-neutral-muted",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          "disabled:bg-neutral-surface disabled:text-neutral-muted disabled:cursor-not-allowed",
          error
            ? "border-red-blush focus:ring-danger"
            : "border-neutral-line",
          "h-9 text-sm px-3",
          hidden && "hidden",
          className
        )}
        {...props}
      />
    );

    if (hidden) {
      return input;
    }

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
        {input}
      </FieldWrapper>
    );
  }
);

FileField.displayName = "FileField";
