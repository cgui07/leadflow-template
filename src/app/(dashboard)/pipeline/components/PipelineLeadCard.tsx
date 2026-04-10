import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getScoreBadgeClass } from "@/lib/ui-colors";
import type { PipelineLead, SelectedLead } from "../types";
import { ArrowRightLeft, ArrowUpRight } from "lucide-react";

interface PipelineLeadCardProps {
  lead: PipelineLead;
  stageId: string;
  movingLeadId: string | null;
  onSelectLead: (lead: SelectedLead) => void;
}

export function PipelineLeadCard({
  lead,
  stageId,
  movingLeadId,
  onSelectLead,
}: PipelineLeadCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("leadId", lead.id);
    setIsDragging(true);
  }

  function handleDragEnd() {
    setIsDragging(false);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`select-none rounded-lg border border-neutral-border bg-white p-3 shadow-sm transition ${
        isDragging
          ? "scale-[0.99] shadow-card ring-2 ring-blue-ice"
          : "hover:shadow-md md:cursor-grab"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-neutral-ink">
            {lead.name}
          </div>
          <div className="mt-0.5 text-xs text-neutral-muted">{lead.phone}</div>
          {lead.value && (
            <div className="mt-2 text-xs font-medium text-neutral-dark">
              R$ {Number(lead.value).toLocaleString("pt-BR")}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <div
            className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${getScoreBadgeClass(lead.score)}`}
          >
            {lead.score}
          </div>
          <Link
            href={`/leads/${lead.id}`}
            draggable={false}
            aria-label={`Abrir lead ${lead.name}`}
            title="Abrir lead"
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-neutral-border bg-neutral-surface text-neutral-steel transition hover:bg-neutral-pale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:inline-flex"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="mt-3 md:hidden">
        <Button
          fullWidth
          type="button"
          size="sm"
          variant="outline"
          loading={movingLeadId === lead.id}
          icon={<ArrowRightLeft className="h-4 w-4" />}
          onClick={() =>
            onSelectLead({
              id: lead.id,
              name: lead.name,
              stageId,
            })}
        >
          Mover para...
        </Button>
      </div>
    </div>
  );
}
