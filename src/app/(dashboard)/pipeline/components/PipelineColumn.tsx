import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PipelineLeadCard } from "./PipelineLeadCard";
import { getPipelineColorDotClass } from "@/lib/ui-colors";
import type { PipelineStage, SelectedLead } from "../types";
import { GripVertical, Pencil, Trash2, Lock } from "lucide-react";

interface PipelineColumnProps {
  stage: PipelineStage;
  movingLeadId: string | null;
  onDropLead: (leadId: string, stageId: string) => void;
  onSelectLead: (lead: SelectedLead) => void;
  onEditStage: (stage: PipelineStage) => void;
  onDeleteStage: (stage: PipelineStage) => void;
  onDropColumn: (draggedStageId: string, targetStageId: string) => void;
}

export function PipelineColumn({
  stage,
  movingLeadId,
  onDropLead,
  onSelectLead,
  onEditStage,
  onDeleteStage,
  onDropColumn,
}: PipelineColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isColumnDragOver, setIsColumnDragOver] = useState(false);

  const totalValue = stage.leads.reduce((sum, lead) => {
    return sum + Number(lead.value || 0);
  }, 0);

  return (
    <div
      className={`flex w-full flex-col rounded-xl border bg-gray-ghost md:w-72 md:shrink-0 transition-colors ${
        isDragOver || isColumnDragOver
          ? "border-primary/50 bg-primary/5"
          : "border-neutral-border"
      }`}
      draggable={!stage.isDefault}
      onDragStart={(e) => {
        if (stage.isDefault) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("stageId", stage.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        const hasLead = e.dataTransfer.types.includes("leadid");
        const hasStage = e.dataTransfer.types.includes("stageid");

        if (hasLead) {
          setIsDragOver(true);
        } else if (hasStage && !stage.isDefault) {
          setIsColumnDragOver(true);
        }
      }}
      onDragLeave={() => {
        setIsDragOver(false);
        setIsColumnDragOver(false);
      }}
      onDrop={(e) => {
        setIsDragOver(false);
        setIsColumnDragOver(false);

        const leadId = e.dataTransfer.getData("leadId");
        if (leadId) {
          onDropLead(leadId, stage.id);
          return;
        }

        const stageId = e.dataTransfer.getData("stageId");
        if (stageId && !stage.isDefault) {
          onDropColumn(stageId, stage.id);
        }
      }}
    >
      <div className="border-b border-neutral-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {!stage.isDefault ? (
              <GripVertical
                size={14}
                className="hidden shrink-0 text-neutral-line md:block md:cursor-grab"
              />
            ) : (
              <Lock size={12} className="shrink-0 text-neutral-line" />
            )}
            <div
              className={`h-3 w-3 shrink-0 rounded-full ${getPipelineColorDotClass(stage.color)}`}
            />
            <div className="truncate text-sm font-semibold text-neutral-dark">
              {stage.name}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!stage.isDefault ? (
              <>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => onEditStage(stage)}
                  className="rounded p-1 text-neutral-muted transition-colors hover:bg-neutral-pale hover:text-neutral-dark"
                  title="Editar coluna"
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => onDeleteStage(stage)}
                  className="rounded p-1 text-neutral-muted transition-colors hover:bg-red-pale hover:text-red-dark"
                  title="Remover coluna"
                >
                  <Trash2 size={14} />
                </Button>
              </>
            ) : null}
            <div className="ml-1 rounded-full bg-white px-2 py-0.5 text-xs text-neutral-muted">
              {stage.leads.length}
            </div>
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
