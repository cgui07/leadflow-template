"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks";
import type { PipelineStage, SelectedLead } from "./types";
import { LoadingState } from "@/components/ui/LoadingState";
import { MoveLeadDrawer } from "./components/MoveLeadDrawer";
import { PipelineColumn } from "./components/PipelineColumn";
import { PageContainer } from "@/components/layout/PageContainer";

export default function PipelinePage() {
  const { data, loading, refetch } = useFetch<PipelineStage[]>("/api/pipeline");
  const [selectedLead, setSelectedLead] = useState<SelectedLead | null>(null);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const stages = data || [];

  async function moveLead(leadId: string, stageId: string) {
    setMovingLeadId(leadId);

    try {
      const response = await fetch("/api/pipeline/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, stageId }),
      });

      if (!response.ok) {
        throw new Error("Erro ao mover lead");
      }

      setSelectedLead(null);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Nao foi possivel mover o lead. Tente novamente.");
    } finally {
      setMovingLeadId(null);
    }
  }

  if (loading) return <LoadingState variant="skeleton" />;

  return (
    <PageContainer
      title="Pipeline"
      subtitle="Arraste no desktop ou mova pelo menu no mobile"
    >
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
        open={!!selectedLead}
        stages={stages}
        selectedLead={selectedLead}
        movingLeadId={movingLeadId}
        onClose={() => setSelectedLead(null)}
        onMoveLead={moveLead}
      />
    </PageContainer>
  );
}
