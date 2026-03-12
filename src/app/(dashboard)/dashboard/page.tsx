"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFetch } from "@/lib/hooks";
import { getScoreTextClass } from "@/lib/ui-colors";
import { Users, MessageSquare, CheckSquare, Plus, Flame } from "lucide-react";
import type { Column } from "@/types";
import Link from "next/link";

interface DashboardData {
  kpis: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    wonLeads: number;
    hotLeads: number;
    pendingTasks: number;
    unreadConversations: number;
    pipelineValue: number;
  };
  recentLeads: Array<{
    id: string;
    name: string;
    phone: string;
    status: string;
    score: number;
    source: string;
    createdAt: string;
    pipelineStage?: { name: string; color: string };
    conversation?: { unreadCount: number };
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    createdAt: string;
    lead?: { name: string };
  }>;
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

const columns: Column<DashboardData["recentLeads"][0]>[] = [
  { key: "name", label: "Nome", sortable: true },
  { key: "phone", label: "Telefone" },
  {
    key: "score",
    label: "Score",
    render: (value) => {
      const score = value as number;
      return (
        <span className={`font-semibold ${getScoreTextClass(score)}`}>
          {score}/100
        </span>
      );
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
  { key: "source", label: "Fonte" },
];

export default function DashboardPage() {
  const { data, loading } = useFetch<DashboardData>("/api/dashboard");

  if (loading) return <LoadingState variant="skeleton" />;

  const kpis = data?.kpis;

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Visão geral dos seus leads e atendimentos"
      actions={
        <Link href="/leads">
          <Button icon={<Plus className="h-4 w-4" />}>Novo Lead</Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total de Leads"
          value={String(kpis?.totalLeads || 0)}
          icon={<Users className="h-5 w-5" />}
          trend={{ value: kpis?.newLeads || 0, label: "novos" }}
        />
        <KpiCard
          label="Leads Quentes"
          value={String(kpis?.hotLeads || 0)}
          icon={<Flame className="h-5 w-5" />}
          trend={{ value: kpis?.qualifiedLeads || 0, label: "qualificados" }}
        />
        <KpiCard
          label="Conversas não lidas"
          value={String(kpis?.unreadConversations || 0)}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <KpiCard
          label="Tarefas Pendentes"
          value={String(kpis?.pendingTasks || 0)}
          icon={<CheckSquare className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionContainer
          title="Leads Recentes"
          actions={<Link href="/leads"><Button variant="ghost" size="sm">Ver todos</Button></Link>}
          noPadding
          className="lg:col-span-2"
        >
          {data?.recentLeads?.length ? (
            <DataTable columns={columns} data={data.recentLeads} rowKey="id" />
          ) : (
            <EmptyState
              title="Nenhum lead ainda"
              description="Seus leads aparecerão aqui quando começarem a chegar via WhatsApp ou quando você criar manualmente."
            />
          )}
        </SectionContainer>

        <SectionContainer title="Atividade Recente">
          {data?.recentActivities?.length ? (
            <div className="space-y-3">
              {data.recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-700">{activity.title}</p>
                    {activity.description && (
                      <p className="text-slate-500 text-xs mt-0.5">{activity.description}</p>
                    )}
                    {activity.lead && (
                      <p className="text-slate-400 text-xs mt-0.5">{activity.lead.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhuma atividade recente</p>
          )}
        </SectionContainer>
      </div>
    </PageContainer>
  );
}
