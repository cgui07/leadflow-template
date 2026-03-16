import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "unstyled"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
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
  unstyled: "",
  danger:
    "bg-danger text-white hover:bg-red-crimson focus-visible:ring-danger shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2",
};

const buttonBaseClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface ButtonClassNameOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export function getButtonClassName({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: ButtonClassNameOptions = {}) {
  return cn(
    buttonBaseClassName,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className,
  );
}

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
        className={getButtonClassName({
          variant,
          size,
          fullWidth,
          className,
        })}
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
