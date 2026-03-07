import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type LoadingVariant = "spinner" | "skeleton" | "table";

interface LoadingStateProps {
  variant?: LoadingVariant;
  label?: string;
  rows?: number;
  className?: string;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-200",
        className
      )}
    />
  );
}

function SkeletonTable({ rows = 5 }: { rows: number }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/5" />
        <Skeleton className="h-4 w-1/6" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-8 w-1/5" />
          <Skeleton className="h-8 w-1/6" />
        </div>
      ))}
    </div>
  );
}

export function LoadingState({
  variant = "spinner",
  label,
  rows = 5,
  className,
}: LoadingStateProps) {
  if (variant === "table") {
    return <SkeletonTable rows={rows} />;
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 gap-3",
        className
      )}
    >
      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}
