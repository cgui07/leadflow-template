"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: false;
}

interface DropdownDivider {
  divider: true;
}

type DropdownEntry = DropdownItem | DropdownDivider;

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownEntry[];
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  align = "right",
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className={cn("relative inline-block", className)} ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-[180px] bg-white rounded-lg border border-slate-200 shadow-lg py-1",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => {
            if (item.divider) {
              return (
                <div key={i} className="my-1 border-t border-slate-100" />
              );
            }

            return (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors",
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-50",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {item.icon && (
                  <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
