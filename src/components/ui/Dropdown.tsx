"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Build a list of indices that correspond to actionable (non-divider) items
  const actionableIndices = useMemo(
    () => items.reduce<number[]>((acc, item, i) => {
      if (!item.divider) acc.push(i);
      return acc;
    }, []),
    [items]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Focus the active item when activeIndex changes
  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [open, activeIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;

      const currentPos = actionableIndices.indexOf(activeIndex);

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const nextPos = currentPos < actionableIndices.length - 1 ? currentPos + 1 : 0;
          setActiveIndex(actionableIndices[nextPos]);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prevPos = currentPos > 0 ? currentPos - 1 : actionableIndices.length - 1;
          setActiveIndex(actionableIndices[prevPos]);
          break;
        }
        case "Home": {
          e.preventDefault();
          if (actionableIndices.length > 0) {
            setActiveIndex(actionableIndices[0]);
          }
          break;
        }
        case "End": {
          e.preventDefault();
          if (actionableIndices.length > 0) {
            setActiveIndex(actionableIndices[actionableIndices.length - 1]);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          setOpen(false);
          setActiveIndex(-1);
          break;
        }
        case "Enter":
        case " ": {
          if (activeIndex >= 0) {
            e.preventDefault();
            const item = items[activeIndex];
            if (item && !item.divider && !item.disabled) {
              item.onClick();
              setOpen(false);
              setActiveIndex(-1);
            }
          }
          break;
        }
      }
    },
    [open, activeIndex, actionableIndices, items]
  );

  const handleOpen = useCallback(() => {
    const next = !open;
    setOpen(next);
    if (next && actionableIndices.length > 0) {
      setActiveIndex(actionableIndices[0]);
    } else {
      setActiveIndex(-1);
    }
  }, [open, actionableIndices]);

  return (
    <div
      className={cn("relative inline-block", className)}
      ref={ref}
      onKeyDown={handleKeyDown}
    >
      <div onClick={handleOpen} aria-expanded={open} aria-haspopup="true">
        {trigger}
      </div>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-1 min-w-45 bg-white rounded-lg border border-neutral-border shadow-lg py-1",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, i) => {
            if (item.divider) {
              return <div key={i} role="separator" className="my-1 border-t border-neutral-pale" />;
            }

            return (
              <Button
                key={i}
                ref={(el: HTMLButtonElement | null) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={i === activeIndex ? 0 : -1}
                variant="ghost"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                  setActiveIndex(-1);
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
