"use client";

import Link from "next/link";
import { useFetch } from "@/lib/hooks";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  getPipelineColorDotClass,
  getScoreBadgeClass,
} from "@/lib/ui-colors";

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
      <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-4 md:-mx-6 md:px-6">
        {(stages || []).map((stage) => (
          <div
            key={stage.id}
            className="w-full flex flex-col bg-gray-ghost rounded-xl border border-neutral-border md:shrink-0 md:w-72"
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
                  <div className="text-sm font-semibold text-neutral-dark">{stage.name}</div>
                </div>
                <div className="text-xs text-neutral-muted bg-white rounded-full px-2 py-0.5">
                  {stage.leads.length}
                </div>
              </div>
              {stage.leads.length > 0 && (
                <div className="text-xs text-neutral-muted mt-1">
                  R$ {stage.leads.reduce((sum, l) => sum + Number(l.value || 0), 0).toLocaleString("pt-BR")}
                </div>
              )}
            </div>
            <div className="p-2 flex-1 space-y-2 max-h-64 overflow-y-auto md:max-h-[calc(100vh-16rem)]">
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
                        <div className="text-sm font-medium text-neutral-ink">{lead.name}</div>
                        <div className="text-xs text-neutral-muted mt-0.5">{lead.phone}</div>
                      </div>
                      <div className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${getScoreBadgeClass(lead.score)}`}>
                        {lead.score}
                      </div>
                    </div>
                    {lead.value && (
                      <div className="text-xs font-medium text-neutral-dark mt-2">
                        R$ {Number(lead.value).toLocaleString("pt-BR")}
                      </div>
                    )}
                  </Link>
                </div>
              ))}
              {stage.leads.length === 0 && (
                <div className="text-center text-xs text-neutral-line py-8">Arraste leads aqui</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
