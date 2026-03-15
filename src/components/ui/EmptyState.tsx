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
      <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-4">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {description && (
        <div className="mt-1 text-sm text-slate-500 max-w-sm">{description}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
