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
        "bg-white rounded-xl border border-slate-200 p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {icon && (
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={cn(
              "text-sm font-medium",
              isPositive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {isPositive ? "+" : ""}
            {trend.value}%
          </span>
          {trend.label && (
            <span className="text-sm text-slate-400">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
