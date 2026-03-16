import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";

type AuthAlertTone = "error" | "info" | "success";

interface AuthAlertProps {
  children: ReactNode;
  className?: string;
  tone?: AuthAlertTone;
}

const toneStyles: Record<AuthAlertTone, string> = {
  error: "border-red-blush bg-red-pale text-danger",
  info: "border-blue-ice bg-blue-pale text-blue-royal",
  success: "border-green-mint-40 bg-green-mint-10 text-green-dark",
};

const toneIcons: Record<AuthAlertTone, LucideIcon> = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
};

export function AuthAlert({
  children,
  className,
  tone = "error",
}: AuthAlertProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-sm",
        toneStyles[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
