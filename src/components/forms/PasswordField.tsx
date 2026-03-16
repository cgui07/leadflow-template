"use client";

import { TextField } from "./TextField";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
        <Button
          type="button"
          variant="unstyled"
          size="sm"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          icon={
            visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )
          }
          onClick={() => setVisible((current) => !current)}
          className="h-auto w-auto px-0 text-neutral-muted transition-colors hover:text-neutral-dark focus-visible:ring-primary"
        />
      }
    />
  );
}
