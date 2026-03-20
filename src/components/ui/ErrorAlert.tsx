import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({ error, onDismiss, className }: ErrorAlertProps) {
  if (!error) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">{error}</div>
        {onDismiss ? (
          <div
            role="button"
            tabIndex={0}
            className="shrink-0 cursor-pointer rounded-md p-0.5 text-red-dark/60 transition-colors hover:text-red-dark"
            onClick={onDismiss}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onDismiss();
              }
            }}
          >
            <X className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
