import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

export function KpiCard({ label, value, icon, trend, className }: KpiCardProps) {
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
          <div className="p-2.5 bg-blue-pale text-blue-royal rounded-lg">
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
