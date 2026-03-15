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
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-slate-200 transition-colors",
              index < strength.score && strength.barClassName
            )}
          />
        ))}
      </div>

      <div className="flex items-start justify-between gap-3 text-xs">
        <span className={cn("font-medium", strength.textClassName)}>{strength.label}</span>
        <span className="text-right text-slate-500">{strength.hint}</span>
      </div>
    </div>
  );
}
