import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getScoreBadgeClass } from "@/lib/ui-colors";
import type { PipelineLead, SelectedLead } from "../types";

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
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("leadId", lead.id)}
      className="rounded-lg border border-neutral-border bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing md:cursor-grab"
    >
      <Link href={`/leads/${lead.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-neutral-ink">
              {lead.name}
            </div>
            <div className="mt-0.5 text-xs text-neutral-muted">
              {lead.phone}
            </div>
          </div>
          <div
            className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${getScoreBadgeClass(lead.score)}`}
          >
            {lead.score}
          </div>
        </div>
        {lead.value && (
          <div className="mt-2 text-xs font-medium text-neutral-dark">
            R$ {Number(lead.value).toLocaleString("pt-BR")}
          </div>
        )}
      </Link>
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
