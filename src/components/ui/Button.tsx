import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-blue-royal focus-visible:ring-primary shadow-sm",
  secondary:
    "bg-neutral-pale text-neutral-dark hover:bg-neutral-border focus-visible:ring-neutral",
  outline:
    "border border-neutral-border text-neutral-dark hover:bg-neutral-surface focus-visible:ring-primary",
  ghost: "text-neutral-steel hover:bg-neutral-pale focus-visible:ring-neutral",
  danger:
    "bg-danger text-white hover:bg-red-crimson focus-visible:ring-danger shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      icon,
      iconRight,
      fullWidth,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
        {!loading && iconRight}
      </button>
    );
  },
);

Button.displayName = "Button";
