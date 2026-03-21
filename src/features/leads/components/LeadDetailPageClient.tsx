"use client";

import { useFetch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";
import { useEffect, useState } from "react";
import type { LeadDetail } from "../contracts";
import { Button } from "@/components/ui/Button";
import { LeadProfileTab } from "./LeadProfileTab";
import { getScoreTextClass } from "@/lib/ui-colors";
import { LeadDetailHeader } from "./LeadDetailHeader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LeadActivitiesTab } from "./LeadActivitiesTab";
import { LeadConversationTab } from "./LeadConversationTab";
import { PageContainer } from "@/components/layout/PageContainer";
import { useFeatureFlag } from "@/components/providers/BrandingProvider";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { LeadActionsSection } from "@/app/(dashboard)/leads/[id]/components/LeadActionsSection";

const statusOptions = [
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Contatado" },
  { value: "qualifying", label: "Qualificando" },
  { value: "qualified", label: "Qualificado" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
  { value: "won", label: "Ganho" },
  { value: "lost", label: "Perdido" },
];

const statusColors: Record<string, string> = {
  new: "bg-info-10 text-info",
  contacted: "bg-gray-ghost text-neutral-dark",
  qualifying: "bg-purple-pale text-secondary",
  qualified: "bg-green-pale text-success",
  proposal: "bg-yellow-pale text-warning",
  negotiation: "bg-orange-pale text-accent",
  won: "bg-green-pale text-green-dark",
  lost: "bg-red-pale text-danger",
};

interface LeadDetailPageClientProps {
  initialLead: LeadDetail;
  leadId: string;
}

export function LeadDetailPageClient({
  initialLead,
  leadId,
}: LeadDetailPageClientProps) {
  const router = useRouter();
  const {
    data: lead,
    error,
    refetch,
  } = useFetch<LeadDetail>(`/api/leads/${leadId}`, {
    initialData: initialLead,
    revalidateOnMount: false,
  });
  const [activeTab, setActiveTab] = useState("profile");
  const [phoneInput, setPhoneInput] = useState(initialLead.phone);
  const [savingPhone, setSavingPhone] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const showLeadActions = useFeatureFlag("leadActions");

  useEffect(() => {
    setPhoneInput(lead?.phone || "");
  }, [lead?.phone]);

  useEffect(() => {
    if (!showLeadActions && activeTab === "actions") {
      setActiveTab("profile");
    }
  }, [activeTab, showLeadActions]);

  if (!lead) {
    return (
      <div className="p-6 text-center text-neutral-muted">
        Lead não encontrado
      </div>
    );
  }

  async function updateStatus(status: string) {
    setActionError(null);
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setActionError(payload?.error || "Não foi possível atualizar o status.");
      return;
    }
    await refetch();
  }

  async function savePhone() {
    const nextPhone = phoneInput.trim();
    if (!lead || !nextPhone || nextPhone === lead.phone) return;

    setSavingPhone(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: nextPhone }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setActionError(payload?.error || "Não foi possível salvar o telefone.");
        return;
      }
      await refetch();
    } finally {
      setSavingPhone(false);
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    setActionError(null);
    const response = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setActionError(payload?.error || "Não foi possível excluir o lead.");
      setDeleting(false);
      return;
    }
    router.push("/leads");
  }

  const scoreColor = getScoreTextClass(lead.score);
  const messages = lead.conversation?.messages?.slice().reverse() || [];
  const tabs = [
    { id: "profile", label: "Perfil" },
    showLeadActions
      ? {
          id: "actions",
          label: "Ações",
          count: lead.leadActions.filter((a) => !["completed", "cancelled"].includes(a.status)).length,
        }
      : null,
    { id: "messages", label: "Mensagens", count: messages.length },
    { id: "activities", label: "Atividades", count: lead.activities.length },
  ].filter(Boolean) as Array<{ id: string; label: string; count?: number }>;

  return (
    <PageContainer
      title=""
      actions={
        <div className="flex gap-2">
          <select
            value={lead.status}
            onChange={(event) => updateStatus(event.target.value)}
            className="h-9 rounded-lg border border-neutral-border bg-white px-3 text-sm text-neutral-ink"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
            Excluir
          </Button>
        </div>
      }
    >
      <ErrorAlert error={actionError || error} />

      <LeadDetailHeader
        lead={lead}
        statusOptions={statusOptions}
        statusColors={statusColors}
        scoreColor={scoreColor}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "profile" ? (
        <LeadProfileTab
          lead={lead}
          phoneInput={phoneInput}
          onPhoneInputChange={setPhoneInput}
          onSavePhone={savePhone}
          savingPhone={savingPhone}
        />
      ) : null}

      {showLeadActions && activeTab === "actions" ? (
        <LeadActionsSection leadId={lead.id} actions={lead.leadActions} onRefetch={refetch} />
      ) : null}

      {activeTab === "messages" ? (
        <LeadConversationTab
          conversationId={lead.conversation?.id}
          messages={messages}
          onRefetch={refetch}
          onError={setActionError}
        />
      ) : null}

      {activeTab === "activities" ? (
        <LeadActivitiesTab activities={lead.activities} />
      ) : null}

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir lead"
        description={`Tem certeza que deseja excluir o lead "${lead.name}"? Esta ação não pode ser desfeita e todas as conversas associadas serão removidas.`}
        confirmText="Excluir"
        loading={deleting}
      />
    </PageContainer>
  );
}
