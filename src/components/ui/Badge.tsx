import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "purple";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-neutral-pale text-neutral-dark",
  success: "bg-green-pale text-green-forest",
  warning: "bg-yellow-pale text-yellow-dark",
  error: "bg-red-pale text-red-dark",
  info: "bg-blue-pale text-blue-navy",
  purple: "bg-purple-pale text-purple-grape",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-neutral-muted",
  success: "bg-green-emerald",
  warning: "bg-orange-amber",
  error: "bg-danger",
  info: "bg-blue",
  purple: "bg-purple",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot,
  className,
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <div className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />
      )}
      {children}
    </div>
  );
}
