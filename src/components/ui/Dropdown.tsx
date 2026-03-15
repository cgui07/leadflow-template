"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className={cn("relative inline-block", className)} ref={ref}>
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-45 bg-white rounded-lg border border-neutral-border shadow-lg py-1",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, i) => {
            if (item.divider) {
              return <div key={i} className="my-1 border-t border-neutral-pale" />;
            }

            return (
              <Button
                key={i}
                type="button"
                variant="ghost"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={cn(
                  "w-full justify-start px-3 py-2 text-sm font-normal h-auto",
                  item.danger
                    ? "text-red-crimson hover:bg-red-pale"
                    : "text-neutral-dark hover:bg-neutral-surface"
                )}
                icon={item.icon ? <div className="shrink-0 w-4 h-4">{item.icon}</div> : undefined}
              >
                {item.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
