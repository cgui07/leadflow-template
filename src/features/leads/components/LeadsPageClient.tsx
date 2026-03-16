"use client";

import Link from "next/link";
import type { Column } from "@/types";
import { useFetch } from "@/lib/hooks";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDeferredValue, useState } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { getScoreBadgeClass } from "@/lib/ui-colors";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LeadRow, LeadsResponse } from "../contracts";
import { TextField, TextareaField } from "@/components/forms";
import { PageContainer } from "@/components/layout/PageContainer";
import { ChevronDown, MessageSquare, Plus, Search } from "lucide-react";
import { SectionContainer } from "@/components/layout/SectionContainer";

const statusMap: Record<
  string,
  {
    label: string;
    variant: "info" | "default" | "purple" | "warning" | "success" | "error";
  }
> = {
  new: { label: "Novo", variant: "info" },
  contacted: { label: "Contatado", variant: "default" },
  qualifying: { label: "Qualificando", variant: "purple" },
  qualified: { label: "Qualificado", variant: "success" },
  proposal: { label: "Proposta", variant: "warning" },
  negotiation: { label: "Negociacao", variant: "warning" },
  won: { label: "Ganho", variant: "success" },
  lost: { label: "Perdido", variant: "error" },
};

const tabs = [
  { id: "all", label: "Todos" },
  { id: "new", label: "Novos" },
  { id: "qualifying", label: "Qualificando" },
  { id: "qualified", label: "Qualificados" },
  { id: "proposal", label: "Proposta" },
  { id: "won", label: "Ganhos" },
  { id: "lost", label: "Perdidos" },
];

const columns: Column<LeadRow>[] = [
  {
    key: "name",
    label: "Lead",
    sortable: true,
    render: (_, row) => (
      <Link
        href={`/leads/${row.id}`}
        className="font-medium text-neutral-ink hover:text-primary"
      >
        <div>{row.name}</div>
        <div className="text-xs text-neutral-muted">{row.phone}</div>
      </Link>
    ),
  },
  {
    key: "score",
    label: "Score",
    sortable: true,
    render: (value) => {
      const score = value as number;
      return (
        <div
          className={`rounded-full px-2 py-1 text-xs font-bold ${getScoreBadgeClass(score)}`}
        >
          {score}
        </div>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    render: (value) => {
      const config = statusMap[value as string];
      return config ? (
        <Badge variant={config.variant} size="sm" dot>
          {config.label}
        </Badge>
      ) : null;
    },
  },
  { key: "region", label: "Regiao", render: (value) => (value as string) || "-" },
  { key: "source", label: "Fonte" },
  {
    key: "conversation",
    label: "",
    render: (_, row) =>
      row.conversation?.unreadCount ? (
        <div className="flex items-center gap-1 text-primary">
          <MessageSquare size={14} />
          <div className="text-xs font-bold">{row.conversation.unreadCount}</div>
        </div>
      ) : null,
  },
];

interface LeadsPageClientProps {
  initialData: LeadsResponse;
}

export function LeadsPageClient({ initialData }: LeadsPageClientProps) {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "manual",
    region: "",
    notes: "",
  });

  const queryParams = new URLSearchParams({
    status,
    page: String(page),
    limit: "20",
  });
  if (deferredSearch) {
    queryParams.set("search", deferredSearch);
  }

  const { data, error, refetch } = useFetch<LeadsResponse>(
    `/api/leads?${queryParams.toString()}`,
    {
      initialData,
      revalidateOnMount: false,
    },
  );

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setActionError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setActionError(payload?.error || "Nao foi possivel criar o lead.");
        return;
      }

      setShowCreateModal(false);
      setForm({
        name: "",
        phone: "",
        email: "",
        source: "manual",
        region: "",
        notes: "",
      });
      await refetch();
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageContainer
      title="Leads"
      subtitle={`${data?.total || 0} leads no total`}
      actions={
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Novo Lead
        </Button>
      }
    >
      {error || actionError ? (
        <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
          {actionError || error}
        </div>
      ) : null}

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="w-full max-w-md flex-1">
          <TextField
            icon={<Search className="h-4 w-4" />}
            placeholder="Buscar por nome, telefone ou regiao..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="hidden md:block">
          <Tabs
            tabs={tabs}
            activeTab={status}
            onTabChange={(nextStatus) => {
              setStatus(nextStatus);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full md:hidden">
          <Dropdown
            align="left"
            className="w-full"
            trigger={
              <Button
                variant="outline"
                className="flex w-full items-center justify-between"
              >
                <div>{tabs.find((tab) => tab.id === status)?.label || "Filtrar"}</div>
                <ChevronDown className="h-4 w-4 shrink-0 text-neutral-muted" />
              </Button>
            }
            items={tabs.map((tab) => ({
              label: tab.label,
              onClick: () => {
                setStatus(tab.id);
                setPage(1);
              },
            }))}
          />
        </div>
      </div>

      <SectionContainer noPadding>
        {data?.leads?.length ? (
          <>
            <DataTable columns={columns} data={data.leads} rowKey="id" />
            {data.pages > 1 ? (
              <div className="flex items-center justify-between border-t border-neutral-border px-4 py-3">
                <div className="text-sm text-neutral-muted">
                  Pagina {data.page} de {data.pages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            title="Nenhum lead encontrado"
            description={
              deferredSearch
                ? "Tente uma busca diferente."
                : "Seus leads aparecerao aqui quando comecarem a chegar via WhatsApp."
            }
          />
        )}
      </SectionContainer>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Novo Lead"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <TextField
            label="Nome"
            type="text"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <TextField
            label="Telefone (WhatsApp)"
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <TextField
            label="Regiao"
            type="text"
            value={form.region}
            onChange={(event) => setForm({ ...form, region: event.target.value })}
            placeholder="Ex: Zona Sul, Barra da Tijuca"
          />
          <TextareaField
            label="Observacoes"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
              Criar Lead
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
