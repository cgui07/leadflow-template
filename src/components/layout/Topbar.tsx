"use client";

import { cn } from "@/lib/utils";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TopbarProps {
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Topbar({ title, actions, className }: TopbarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between h-16 px-6 bg-white border-b border-neutral-border flex-shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {title && (
          <div className="text-lg font-semibold text-neutral-ink">{title}</div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-muted" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 w-64 text-sm bg-neutral-surface border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent placeholder:text-neutral-muted"
          />
        </div>
        <Button variant="ghost" size="sm" icon={<Bell className="h-5 w-5" />} className="relative">
          <div className="absolute top-1.5 right-1.5 h-2 w-2 bg-danger rounded-full" />
        </Button>
        {actions}
      </div>
    </div>
  );
}
