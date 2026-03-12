"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (key: string) => void;
  children?: (activeKey: string) => React.ReactNode;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  children,
  className,
}: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.key ?? "");
  const active = activeTab ?? internalActive;

  function handleChange(key: string) {
    setInternalActive(key);
    onChange?.(key);
  }

  return (
    <div className={className}>
      <div className="flex border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleChange(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              active === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-xs rounded-full",
                  active === tab.key
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {children && <div className="pt-4">{children(active)}</div>}
    </div>
  );
}
