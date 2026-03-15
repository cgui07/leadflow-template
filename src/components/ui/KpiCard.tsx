import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

type KpiCardIconVariant =
  | "blue"
  | "orange"
  | "purple"
  | "teal"
  | "green"
  | "red";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconVariant?: KpiCardIconVariant;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

const iconVariantStyles: Record<KpiCardIconVariant, string> = {
  blue: "bg-blue-pale text-blue-royal",
  orange: "bg-orange-pale text-orange-burn",
  purple: "bg-purple-pale text-purple-grape",
  teal: "bg-teal-pale text-teal-deep",
  green: "bg-green-pale text-green-forest",
  red: "bg-red-pale text-red-crimson",
};

export function KpiCard({
  label,
  value,
  icon,
  iconVariant = "blue",
  trend,
  className,
}: KpiCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-neutral-border p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="text-sm font-medium text-neutral">{label}</div>
          <div className="text-2xl font-bold text-neutral-ink">{value}</div>
        </div>
        {icon && (
          <div
            className={cn(
              "rounded-lg p-2.5",
              iconVariantStyles[iconVariant],
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-emerald" />
          ) : (
            <TrendingDown className="h-4 w-4 text-danger" />
          )}
          <div
            className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-dark" : "text-red-crimson"
            )}
          >
            {isPositive ? "+" : ""}
            {trend.value}%
          </div>
          {trend.label && (
            <div className="text-sm text-neutral-muted">{trend.label}</div>
          )}
        </div>
      )}
    </div>
  );
}
