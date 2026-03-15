import { PipelineLeadCard } from "./PipelineLeadCard";
import type { PipelineStage, SelectedLead } from "../types";
import {
  getPipelineColorDotClass,
} from "@/lib/ui-colors";

interface PipelineColumnProps {
  stage: PipelineStage;
  movingLeadId: string | null;
  onDropLead: (leadId: string, stageId: string) => void;
  onSelectLead: (lead: SelectedLead) => void;
}

export function PipelineColumn({
  stage,
  movingLeadId,
  onDropLead,
  onSelectLead,
}: PipelineColumnProps) {
  const totalValue = stage.leads.reduce((sum, lead) => {
    return sum + Number(lead.value || 0);
  }, 0);

  return (
    <div
      className="flex w-full flex-col rounded-xl border border-neutral-border bg-gray-ghost md:w-72 md:shrink-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const leadId = e.dataTransfer.getData("leadId");
        if (leadId) {
          onDropLead(leadId, stage.id);
        }
      }}
    >
      <div className="border-b border-neutral-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${getPipelineColorDotClass(stage.color)}`}
            />
            <div className="text-sm font-semibold text-neutral-dark">
              {stage.name}
            </div>
          </div>
          <div className="rounded-full bg-white px-2 py-0.5 text-xs text-neutral-muted">
            {stage.leads.length}
          </div>
        </div>
        {stage.leads.length > 0 && (
          <div className="mt-1 text-xs text-neutral-muted">
            R$ {totalValue.toLocaleString("pt-BR")}
          </div>
        )}
      </div>
      <div className="max-h-64 flex-1 space-y-2 overflow-y-auto p-2 md:max-h-[calc(100vh-16rem)]">
        {stage.leads.map((lead) => (
          <PipelineLeadCard
            key={lead.id}
            lead={lead}
            stageId={stage.id}
            movingLeadId={movingLeadId}
            onSelectLead={onSelectLead}
          />
        ))}
        {stage.leads.length === 0 && (
          <div className="py-8 text-center text-xs text-neutral-line">
            Arraste leads aqui
          </div>
        )}
      </div>
    </div>
  );
}
