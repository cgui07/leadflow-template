import { cn } from "@/lib/utils";

interface SectionContainerProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionContainer({
  title,
  description,
  icon,
  actions,
  children,
  className,
  noPadding,
}: SectionContainerProps) {
  return (
    <section
      className={cn(
        "bg-white rounded-xl border border-slate-200",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                {icon}{title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(!noPadding && "p-6")}>{children}</div>
    </section>
  );
}
