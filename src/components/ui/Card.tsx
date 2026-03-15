import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export function Card({
  children,
  className,
  hoverable,
  onClick,
  header,
  footer,
  noPadding,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-neutral-border",
        hoverable && "hover:border-neutral-line hover:shadow-sm transition-all",
        onClick && "cursor-pointer",
        className
      )}
    >
      {header && (
        <div className="px-6 py-4 border-b border-neutral-pale">{header}</div>
      )}
      <div className={cn(!noPadding && "p-6")}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-neutral-pale">{footer}</div>
      )}
    </div>
  );
}
