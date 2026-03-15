"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface Tab {
  key?: string;
  id?: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (key: string) => void;
  onTabChange?: (key: string) => void;
  children?: (activeKey: string) => React.ReactNode;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  onTabChange,
  children,
  className,
}: TabsProps) {
  const getKey = (tab: Tab) => tab.key ?? tab.id ?? tab.label;
  const [internalActive, setInternalActive] = useState(getKey(tabs[0]) ?? "");
  const active = activeTab ?? internalActive;

  function handleChange(key: string) {
    setInternalActive(key);
    onChange?.(key);
    onTabChange?.(key);
  }

  return (
    <div className={className}>
      <div className="flex border-b border-slate-200">
        {tabs.map((tab) => {
          const isActive = active === getKey(tab);
          return (
            <Button
              key={getKey(tab)}
              type="button"
              variant="ghost"
              onClick={() => handleChange(getKey(tab))}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px h-auto gap-2",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
              icon={tab.icon}
              iconRight={tab.count !== undefined && (
                <div
                  className={cn(
                    "px-1.5 py-0.5 text-xs rounded-full",
                    isActive
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {tab.count}
                </div>
              )}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>
      {children && <div className="pt-4">{children(active)}</div>}
    </div>
  );
}
