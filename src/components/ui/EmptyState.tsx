import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="p-3 bg-neutral-pale rounded-full text-neutral-muted mb-4">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <div className="text-sm font-semibold text-neutral-ink">{title}</div>
      {description && (
        <div className="mt-1 text-sm text-neutral max-w-sm">{description}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
