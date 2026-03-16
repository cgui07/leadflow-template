"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "./Button";

type DrawerSide = "right" | "left";
type DrawerSize = "sm" | "md" | "lg" | "xl";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: DrawerSide;
  size?: DrawerSize;
  className?: string;
}

const sizeStyles: Record<DrawerSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  size = "md",
  className,
}: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-black-50 transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative ml-auto flex h-full w-full flex-col bg-white shadow-xl",
          sizeStyles[size],
          side === "left" && "mr-auto ml-0",
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-neutral-border">
            <div>
              {title && (
                <div className="text-lg font-semibold text-neutral-ink">
                  {title}
                </div>
              )}
              {description && (
                <div className="mt-1 text-sm text-neutral">{description}</div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={<X className="h-5 w-5" />}
            />
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
