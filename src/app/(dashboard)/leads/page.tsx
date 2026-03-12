"use client";

import { useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFetch } from "@/lib/hooks";
import { getScoreBadgeClass } from "@/lib/ui-colors";
import { Plus, Search, MessageSquare } from "lucide-react";
import type { Column } from "@/types";

interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  score: number;
  source: string;
  region?: string;
  value?: number;
  createdAt: string;
  pipelineStage?: { name: string; color: string };
  conversation?: { unreadCount: number; lastMessageAt: string };
}

interface LeadsResponse {
  leads: LeadRow[];
  total: number;
  page: number;
  pages: number;
}

const statusMap: Record<string, { label: string; variant: "info" | "default" | "purple" | "warning" | "success" | "error" }> = {
  new: { label: "Novo", variant: "info" },
  contacted: { label: "Contatado", variant: "default" },
  qualifying: { label: "Qualificando", variant: "purple" },
  qualified: { label: "Qualificado", variant: "success" },
  proposal: { label: "Proposta", variant: "warning" },
  negotiation: { label: "Negociação", variant: "warning" },
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

export default function LeadsPage() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "manual", region: "", notes: "" });

  const queryParams = new URLSearchParams({ status, page: String(page), limit: "20" });
  if (search) queryParams.set("search", search);

  const { data, loading, refetch } = useFetch<LeadsResponse>(`/api/leads?${queryParams}`);

  const columns: Column<LeadRow>[] = [
    {
      key: "name",
      label: "Lead",
      sortable: true,
      render: (_, row) => (
        <Link href={`/leads/${row.id}`} className="font-medium text-slate-900 hover:text-blue-600">
          <div>{row.name}</div>
          <div className="text-xs text-slate-400">{row.phone}</div>
        </Link>
      ),
    },
    {
      key: "score",
      label: "Score",
      sortable: true,
      render: (value) => {
        const score = value as number;
        const color = getScoreBadgeClass(score);
        return <span className={`px-2 py-1 rounded-full text-xs font-bold ${color}`}>{score}</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const config = statusMap[value as string];
        return config ? <Badge variant={config.variant} size="sm" dot>{config.label}</Badge> : null;
      },
    },
    { key: "region", label: "Região", render: (v) => (v as string) || "—" },
    { key: "source", label: "Fonte" },
    {
      key: "conversation",
      label: "",
      render: (_, row) => (
        row.conversation?.unreadCount ? (
          <span className="flex items-center gap-1 text-blue-600">
            <MessageSquare size={14} />
            <span className="text-xs font-bold">{row.conversation.unreadCount}</span>
          </span>
        ) : null
      ),
    },
  ];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setForm({ name: "", phone: "", email: "", source: "manual", region: "", notes: "" });
        refetch();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageContainer
      title="Leads"
      subtitle={`${data?.total || 0} leads no total`}
      actions={
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
          Novo Lead
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou região..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <Tabs tabs={tabs} activeTab={status} onTabChange={(t) => { setStatus(t); setPage(1); }} />
      </div>

      <SectionContainer noPadding>
        {loading ? (
          <LoadingState variant="table" />
        ) : data?.leads?.length ? (
          <>
            <DataTable columns={columns} data={data.leads} rowKey="id" />
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Página {data.page} de {data.pages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Nenhum lead encontrado"
            description={search ? "Tente uma busca diferente." : "Seus leads aparecerão aqui quando começarem a chegar via WhatsApp."}
          />
        )}
      </SectionContainer>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Novo Lead" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Telefone (WhatsApp) *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Região</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ex: Zona Sul, Barra da Tijuca"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button type="submit" loading={creating}>Criar Lead</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
