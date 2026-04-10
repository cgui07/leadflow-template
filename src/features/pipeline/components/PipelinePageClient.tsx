"use client";

import { Plus } from "lucide-react";
import { useFetch } from "@/lib/hooks";
import { Button } from "@/components/ui/Button";
import { useCallback, useMemo, useState } from "react";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import type { PipelineStage, SelectedLead } from "../contracts";
import { PageContainer } from "@/components/layout/PageContainer";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { AddStageModal } from "@/app/(dashboard)/pipeline/components/AddStageModal";
import { MoveLeadDrawer } from "@/app/(dashboard)/pipeline/components/MoveLeadDrawer";
import { PipelineColumn } from "@/app/(dashboard)/pipeline/components/PipelineColumn";
import { EditStageModal } from "@/app/(dashboard)/pipeline/components/EditStageModal";

interface PipelinePageClientProps {
  initialStages: PipelineStage[];
}

export function PipelinePageClient({
  initialStages,
}: PipelinePageClientProps) {
  const { data, error, refetch, mutate } = useFetch<PipelineStage[]>("/api/pipeline", {
    initialData: initialStages,
    revalidateOnMount: false,
  });
  const [selectedLead, setSelectedLead] = useState<SelectedLead | null>(null);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [deletingStage, setDeletingStage] = useState<PipelineStage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const stages = useMemo(() => data || [], [data]);

  const moveLead = useCallback(async (leadId: string, stageId: string) => {
    setMovingLeadId(leadId);
    setMoveError(null);

    let snapshot: PipelineStage[] | null = null;

    mutate((current) => {
      if (!current) return current;
      snapshot = current;

      let movingLead: PipelineStage["leads"][number] | null = null;
      for (const stage of current) {
        const found = stage.leads.find((l) => l.id === leadId);
        if (found) {
          movingLead = found;
          break;
        }
      }
      if (!movingLead) return current;

      return current.map((stage) => {
        if (stage.leads.some((l) => l.id === leadId)) {
          return { ...stage, leads: stage.leads.filter((l) => l.id !== leadId) };
        }
        if (stage.id === stageId) {
          return { ...stage, leads: [movingLead!, ...stage.leads] };
        }
        return stage;
      });
    });

    setSelectedLead(null);

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
        if (snapshot) mutate(snapshot);
        setMoveError(payload?.error || "Nao foi possivel mover o lead.");
        return;
      }

      await refetch();
    } catch (err) {
      if (snapshot) mutate(snapshot);
      setMoveError(err instanceof Error ? err.message : "Nao foi possivel mover o lead.");
    } finally {
      setMovingLeadId(null);
    }
  }, [mutate, refetch]);

  const handleAddStage = useCallback(async (name: string, color: string) => {
    const response = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || "Erro ao criar coluna.");
    }

    setShowAddModal(false);
    await refetch();
  }, [refetch]);

  const handleEditStage = useCallback(async (stageId: string, name: string, color: string) => {
    const response = await fetch(`/api/pipeline/${stageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || "Erro ao editar coluna.");
    }

    setEditingStage(null);
    await refetch();
  }, [refetch]);

  const handleDeleteStage = useCallback(async () => {
    if (!deletingStage) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/pipeline/${deletingStage.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMoveError(payload?.error || "Erro ao remover coluna.");
        return;
      }

      setDeletingStage(null);
      await refetch();
    } finally {
      setIsDeleting(false);
    }
  }, [deletingStage, refetch]);

  const handleDropColumn = useCallback(async (draggedStageId: string, targetStageId: string) => {
    if (draggedStageId === targetStageId) return;

    const currentIds = stages.map((s) => s.id);
    const fromIndex = currentIds.indexOf(draggedStageId);
    const toIndex = currentIds.indexOf(targetStageId);
    if (fromIndex < 0 || toIndex < 0) return;

    // Don't allow moving into position 0 (default column position)
    if (toIndex === 0) return;
    // Don't allow moving the default column
    if (fromIndex === 0) return;

    const newIds = [...currentIds];
    newIds.splice(fromIndex, 1);
    newIds.splice(toIndex, 0, draggedStageId);

    const response = await fetch("/api/pipeline/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageIds: newIds }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMoveError(payload?.error || "Erro ao reordenar colunas.");
    }

    await refetch();
  }, [stages, refetch]);

  return (
    <PageContainer
      title="Pipeline"
      subtitle="Arraste leads entre colunas. Gerencie suas etapas."
      actions={
        <Button
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Nova coluna
        </Button>
      }
    >
      <ErrorAlert error={moveError || error} />

      <div className="flex flex-col gap-4 md:-mx-6 md:flex-row md:overflow-x-auto md:px-6 md:pb-4">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            movingLeadId={movingLeadId}
            onDropLead={moveLead}
            onSelectLead={setSelectedLead}
            onEditStage={setEditingStage}
            onDeleteStage={setDeletingStage}
            onDropColumn={handleDropColumn}
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

      <AddStageModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddStage}
      />

      {editingStage ? (
        <EditStageModal
          open={Boolean(editingStage)}
          stage={editingStage}
          onClose={() => setEditingStage(null)}
          onSubmit={handleEditStage}
        />
      ) : null}

      <DeleteConfirmationModal
        open={Boolean(deletingStage)}
        onClose={() => setDeletingStage(null)}
        onConfirm={handleDeleteStage}
        title="Remover coluna"
        description={
          deletingStage
            ? `Tem certeza que deseja remover "${deletingStage.name}"? Os ${deletingStage.leads.length} leads desta coluna serao movidos para a primeira coluna.`
            : ""
        }
        confirmText="Remover"
        loading={isDeleting}
      />
    </PageContainer>
  );
}
