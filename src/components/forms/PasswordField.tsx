"use client";

import { TextField } from "./TextField";
import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentPropsWithoutRef } from "react";

type PasswordFieldProps = Omit<
  ComponentPropsWithoutRef<typeof TextField>,
  "type" | "suffix"
>;

export function PasswordField({
  autoComplete = "current-password",
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      autoComplete={autoComplete}
      type={visible ? "text" : "password"}
      suffix={
        <button
          type="button"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="flex items-center justify-center rounded text-neutral-muted transition-colors hover:text-neutral-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      }
    />
  );
}
