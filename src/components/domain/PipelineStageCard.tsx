import { cn } from "@/lib/utils";
import type { PipelineStage } from "@/types";

interface PipelineStageCardProps {
  stage: PipelineStage;
  children?: React.ReactNode;
  className?: string;
}

export function PipelineStageCard({
  stage,
  children,
  className,
}: PipelineStageCardProps) {
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(stage.totalValue);

  return (
    <div
      className={cn(
        "flex flex-col bg-slate-50 rounded-xl min-w-[280px] w-[300px] flex-shrink-0",
        className
      )}
    >
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <div className="text-sm font-semibold text-slate-900 truncate">
            {stage.name}
          </div>
          <div className="text-xs font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded-full">
            {stage.leadCount}
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-1">{formattedValue}</div>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)]">
        {children}
      </div>
    </div>
  );
}
