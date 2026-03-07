"use client";

import { cn } from "@/lib/utils";
import { Search, Bell } from "lucide-react";

interface TopbarProps {
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Topbar({ title, actions, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 flex-shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 w-64 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* Actions */}
        {actions}
      </div>
    </header>
  );
}
