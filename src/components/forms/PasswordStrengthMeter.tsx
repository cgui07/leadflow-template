"use client";

import { getPasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-neutral-border transition-colors",
              index < strength.score && strength.barClassName
            )}
          />
        ))}
      </div>
      <div className="flex items-start justify-between gap-3 text-xs">
        <div className={cn("font-medium", strength.textClassName)}>{strength.label}</div>
        <div className="text-right text-neutral">{strength.hint}</div>
      </div>
    </div>
  );
}
