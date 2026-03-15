import { cn } from "@/lib/utils";

interface PageContainerProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({
  title,
  subtitle,
  actions,
  children,
  className,
}: PageContainerProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-900">{title}</div>
          {subtitle && (
            <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 mt-3 sm:mt-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
