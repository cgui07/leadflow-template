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
    <div
      className={cn(
        "bg-white rounded-xl border border-neutral-border",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-pale">
          <div>
            {title && (
              <div className="text-base font-semibold text-neutral-ink flex items-center gap-2">
                {icon}{title}
              </div>
            )}
            {description && (
              <div className="mt-0.5 text-sm text-neutral">{description}</div>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(!noPadding && "p-6")}>{children}</div>
    </div>
  );
}
