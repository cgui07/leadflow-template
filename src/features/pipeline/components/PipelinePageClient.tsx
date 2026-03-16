"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks";
import type { PipelineStage, SelectedLead } from "../contracts";
import { PageContainer } from "@/components/layout/PageContainer";
import { MoveLeadDrawer } from "@/app/(dashboard)/pipeline/components/MoveLeadDrawer";
import { PipelineColumn } from "@/app/(dashboard)/pipeline/components/PipelineColumn";

interface PipelinePageClientProps {
  initialStages: PipelineStage[];
}

export function PipelinePageClient({
  initialStages,
}: PipelinePageClientProps) {
  const { data, error, refetch } = useFetch<PipelineStage[]>("/api/pipeline", {
    initialData: initialStages,
    revalidateOnMount: false,
  });
  const [selectedLead, setSelectedLead] = useState<SelectedLead | null>(null);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const stages = data || [];

  async function moveLead(leadId: string, stageId: string) {
    setMovingLeadId(leadId);
    setMoveError(null);

    try {
      const response = await fetch("/api/pipeline/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, stageId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMoveError(payload?.error || "Nao foi possivel mover o lead.");
        return;
      }

      setSelectedLead(null);
      await refetch();
    } finally {
      setMovingLeadId(null);
    }
  }

  return (
    <PageContainer
      title="Pipeline"
      subtitle="Arraste no desktop ou mova pelo menu no mobile"
    >
      {error || moveError ? (
        <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
          {moveError || error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 md:-mx-6 md:flex-row md:overflow-x-auto md:px-6 md:pb-4">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            movingLeadId={movingLeadId}
            onDropLead={moveLead}
            onSelectLead={setSelectedLead}
          />
        ))}
      </div>

      <MoveLeadDrawer
        open={Boolean(selectedLead)}
        stages={stages}
        selectedLead={selectedLead}
        movingLeadId={movingLeadId}
        onClose={() => setSelectedLead(null)}
        onMoveLead={moveLead}
      />
    </PageContainer>
  );
}
