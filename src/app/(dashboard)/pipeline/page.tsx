"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { useFetch } from "@/lib/hooks";
import {
  getPipelineColorDotClass,
  getScoreBadgeClass,
} from "@/lib/ui-colors";
import Link from "next/link";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  leads: Array<{
    id: string;
    name: string;
    phone: string;
    score: number;
    value?: number;
    status: string;
    lastContactAt?: string;
    createdAt: string;
  }>;
}

export default function PipelinePage() {
  const { data: stages, loading, refetch } = useFetch<PipelineStage[]>("/api/pipeline");

  async function handleDrop(leadId: string, stageId: string) {
    await fetch("/api/pipeline/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, stageId }),
    });
    refetch();
  }

  if (loading) return <LoadingState variant="skeleton" />;

  return (
    <PageContainer title="Pipeline" subtitle="Arraste os leads entre os estágios">
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
        {(stages || []).map((stage) => (
          <div
            key={stage.id}
            className="shrink-0 w-72 flex flex-col bg-gray-ghost rounded-xl border border-neutral-border"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const leadId = e.dataTransfer.getData("leadId");
              if (leadId) handleDrop(leadId, stage.id);
            }}
          >
            <div className="p-3 border-b border-neutral-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${getPipelineColorDotClass(stage.color)}`} />
                  <h3 className="text-sm font-semibold text-neutral-dark">{stage.name}</h3>
                </div>
                <span className="text-xs text-neutral-muted bg-white rounded-full px-2 py-0.5">
                  {stage.leads.length}
                </span>
              </div>
              {stage.leads.length > 0 && (
                <p className="text-xs text-neutral-muted mt-1">
                  R$ {stage.leads.reduce((sum, l) => sum + Number(l.value || 0), 0).toLocaleString("pt-BR")}
                </p>
              )}
            </div>

            <div className="p-2 flex-1 space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {stage.leads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("leadId", lead.id)}
                  className="rounded-lg bg-white border border-neutral-border p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition"
                >
                  <Link href={`/leads/${lead.id}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-ink">{lead.name}</p>
                        <p className="text-xs text-neutral-muted mt-0.5">{lead.phone}</p>
                      </div>
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${getScoreBadgeClass(lead.score)}`}>
                        {lead.score}
                      </span>
                    </div>
                    {lead.value && (
                      <p className="text-xs font-medium text-neutral-dark mt-2">
                        R$ {Number(lead.value).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </Link>
                </div>
              ))}
              {stage.leads.length === 0 && (
                <p className="text-center text-xs text-neutral-line py-8">Arraste leads aqui</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
