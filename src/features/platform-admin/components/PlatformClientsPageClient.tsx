"use client";

import type { Column } from "@/types";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { TextField } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateClientModal } from "./CreateClientModal";
import { usePlatformClients } from "../hooks/usePlatformClients";
import { PageContainer } from "@/components/layout/PageContainer";
import { ActivationSummaryModal } from "./ActivationSummaryModal";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { RegenerateActivationLinkModal } from "./RegenerateActivationLinkModal";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { Building2, Copy, KeyRound, PauseCircle, PlayCircle, Plus, Search, Trash2 } from "lucide-react";
import type {
  PlatformClientAccessState,
  PlatformClientRow,
  PlatformClientsResponse,
} from "../contracts";

interface PlatformClientsPageClientProps {
  initialData: PlatformClientsResponse;
}

const accessStateConfig: Record<
  PlatformClientAccessState,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "purple" }
> = {
  pending: { label: "Link pendente", variant: "warning" },
  active: { label: "Ativo", variant: "success" },
  suspended: { label: "Suspenso", variant: "error" },
  setup: { label: "Sem ativação", variant: "default" },
};

function formatDate(dateValue: string | null): string {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("pt-BR");
}

function getNoticeClassName(tone: "success" | "error"): string {
  return tone === "success"
    ? "border-green-sage bg-green-pale text-green-forest"
    : "border-red-blush bg-red-pale text-red-dark";
}

export function PlatformClientsPageClient({ initialData }: PlatformClientsPageClientProps) {
  const {
    clients,
    tabs,
    filteredClients,
    error,
    notice,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    showCreateModal,
    showRegenerateModal,
    activationSummary,
    createForm,
    regenerateForm,
    setRegenerateForm,
    selectedClient,
    creating,
    regenerating,
    isDeleting,
    deletingClient,
    setDeletingClient,
    updatingClientId,
    copiedActivationLink,
    openCreateModal,
    closeCreateModal,
    openRegenerateModal,
    closeRegenerateModal,
    closeActivationSummary,
    updateCreateField,
    handleCopyLink,
    handleCreateClient,
    handleRegenerateLink,
    handleDeleteClient,
    handleToggleStatus,
    handleCopyActivationSummary,
  } = usePlatformClients(initialData);

  const columns: Column<PlatformClientRow>[] = [
    {
      key: "name",
      label: "Cliente",
      sortable: true,
      className: "min-w-[220px]",
      render: (_, row) => (
        <div>
          <div className="font-semibold text-neutral-ink">{row.name}</div>
          <div className="text-xs text-neutral-muted">/{row.slug}</div>
        </div>
      ),
    },
    {
      key: "ownerEmail",
      label: "Acesso principal",
      className: "min-w-[220px]",
      render: (_, row) => (
        <div>
          <div className="font-medium text-neutral-dark">
            {row.ownerName || "Aguardando ativação"}
          </div>
          <div className="text-xs text-neutral-muted">
            {row.ownerEmail || row.activationEmail || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "accessState",
      label: "Status",
      className: "min-w-[190px]",
      render: (_, row) => (
        <div className="space-y-1">
          <Badge variant={accessStateConfig[row.accessState].variant} size="sm" dot>
            {accessStateConfig[row.accessState].label}
          </Badge>
          <div className="text-xs text-neutral-muted">
            {row.accessState === "pending"
              ? `Expira em ${formatDate(row.activationExpiresAt)}`
              : row.accessState === "active"
                ? `Ativado em ${formatDate(row.activatedAt)}`
                : row.accessState === "suspended"
                  ? "Login bloqueado até a reativação"
                  : "Gere um novo link para liberar o acesso"}
          </div>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Criado em",
      sortable: true,
      render: (value) => formatDate(value as string),
    },
    {
      key: "actions",
      label: "Ações",
      className: "min-w-[260px]",
      render: (_, row) => (
        <div className="flex flex-wrap justify-end gap-2">
          {row.usersCount === 0 && row.activationLink ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Copy className="h-3.5 w-3.5" />}
              onClick={() => void handleCopyLink(row.activationLink!)}
            >
              Copiar link
            </Button>
          ) : null}

          {row.usersCount === 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<KeyRound className="h-3.5 w-3.5" />}
              loading={regenerating && selectedClient?.id === row.id}
              onClick={() => openRegenerateModal(row)}
            >
              {row.activationLink ? "Novo link" : "Gerar link"}
            </Button>
          ) : null}

          <Button
            type="button"
            variant={row.status === "active" ? "ghost" : "outline"}
            size="sm"
            icon={
              row.status === "active" ? (
                <PauseCircle className="h-3.5 w-3.5" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )
            }
            loading={updatingClientId === row.id}
            onClick={() => void handleToggleStatus(row)}
          >
            {row.status === "active" ? "Suspender" : "Reativar"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}
            onClick={() => setDeletingClient(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Clientes"
      subtitle="Crie o workspace do corretor, gere o link de ativação e controle o acesso mensal."
      actions={
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
          Novo cliente
        </Button>
      }
    >
      {notice ? (
        <div className={`rounded-xl border px-4 py-3 text-sm ${getNoticeClassName(notice.tone)}`}>
          {notice.message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="w-full max-w-md">
          <TextField
            icon={<Search className="h-4 w-4" />}
            placeholder="Buscar por cliente, slug ou email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <SectionContainer
          title="Carteira de clientes"
          description="Acompanhe quem já ativou a conta, quem ainda precisa receber o link e quem está suspenso."
          noPadding
        >
          <Tabs
            tabs={tabs}
            activeTab={statusFilter}
            onTabChange={setStatusFilter}
            className="px-6 pt-2"
          />

          <div className="px-6 pb-6 pt-4">
            {filteredClients.length === 0 && clients.length > 0 ? (
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="Nenhum cliente encontrado"
                description="Ajuste os filtros ou a busca para localizar outro workspace."
              />
            ) : clients.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-6 w-6" />}
                title="Nenhum cliente cadastrado"
                description="Comece criando o primeiro workspace e envie o link de ativação assim que o pagamento for confirmado."
                action={
                  <Button icon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
                    Criar primeiro cliente
                  </Button>
                }
              />
            ) : (
              <DataTable columns={columns} data={filteredClients} rowKey="id" />
            )}
          </div>
        </SectionContainer>
      </div>

      <CreateClientModal
        open={showCreateModal}
        onClose={closeCreateModal}
        onSubmit={handleCreateClient}
        form={createForm}
        onFieldChange={updateCreateField}
        creating={creating}
      />

      <RegenerateActivationLinkModal
        open={showRegenerateModal}
        onClose={closeRegenerateModal}
        onSubmit={handleRegenerateLink}
        form={regenerateForm}
        onFieldChange={(field, value) =>
          setRegenerateForm((current) => ({ ...current, [field]: value }))
        }
        regenerating={regenerating}
      />

      <ActivationSummaryModal
        summary={activationSummary}
        onClose={closeActivationSummary}
        copied={copiedActivationLink}
        onCopy={() => void handleCopyActivationSummary()}
      />

      <DeleteConfirmationModal
        open={Boolean(deletingClient)}
        onClose={() => setDeletingClient(null)}
        onConfirm={() => void handleDeleteClient()}
        title="Excluir cliente"
        description={
          deletingClient
            ? `Tem certeza que deseja excluir "${deletingClient.name}"? Todos os dados do workspace (leads, conversas, configurações) serão apagados permanentemente.`
            : ""
        }
        confirmText="Excluir permanentemente"
        loading={isDeleting}
      />
    </PageContainer>
  );
}
