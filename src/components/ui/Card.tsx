import { cn } from "@/lib/utils";
import type { MouseEventHandler, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  header?: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
}

interface CardSectionProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn("border-b border-neutral-pale px-6 py-4", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardSectionProps) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={cn("border-t border-neutral-pale px-6 py-4", className)}>
      {children}
    </div>
  );
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
        "rounded-xl border border-neutral-border bg-white",
        hoverable && "transition-all hover:border-neutral-line hover:shadow-sm",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {header ? <CardHeader>{header}</CardHeader> : null}
      <CardContent className={cn(!noPadding && "p-6")}>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </div>
  );
}
