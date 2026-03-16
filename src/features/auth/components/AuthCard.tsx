import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-ash bg-white p-8 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
