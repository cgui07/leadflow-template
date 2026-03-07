"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { ActivityTimeline } from "@/components/domain/chat/ActivityTimeline";
import { Users, DollarSign, Target, CheckSquare, Plus } from "lucide-react";
import type { Column, Activity } from "@/types";

interface RecentLead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
  value: string;
  date: string;
}

const leads: RecentLead[] = [
  {
    id: "1",
    name: "Maria Silva",
    email: "maria@empresa.com",
    company: "TechCorp",
    status: "new",
    value: "R$ 15.000",
    date: "Hoje",
  },
  {
    id: "2",
    name: "João Santos",
    email: "joao@startup.io",
    company: "StartupX",
    status: "contacted",
    value: "R$ 8.500",
    date: "Ontem",
  },
  {
    id: "3",
    name: "Ana Costa",
    email: "ana@agencia.com",
    company: "Agência Digital",
    status: "qualified",
    value: "R$ 22.000",
    date: "2 dias",
  },
  {
    id: "4",
    name: "Pedro Lima",
    email: "pedro@corp.com",
    company: "CorpBrasil",
    status: "proposal",
    value: "R$ 45.000",
    date: "3 dias",
  },
  {
    id: "5",
    name: "Carla Mendes",
    email: "carla@retail.com",
    company: "RetailPro",
    status: "negotiation",
    value: "R$ 12.000",
    date: "4 dias",
  },
];

const statusMap: Record<string, { label: string; variant: "info" | "default" | "purple" | "warning" | "success" }> = {
  new: { label: "Novo", variant: "info" },
  contacted: { label: "Contatado", variant: "default" },
  qualified: { label: "Qualificado", variant: "purple" },
  proposal: { label: "Proposta", variant: "warning" },
  negotiation: { label: "Negociação", variant: "warning" },
};

const columns: Column<RecentLead>[] = [
  { key: "name", label: "Nome", sortable: true },
  { key: "company", label: "Empresa", sortable: true },
  { key: "value", label: "Valor", sortable: true },
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
  { key: "date", label: "Data", className: "text-slate-400" },
];

const recentActivities: Activity[] = [
  {
    id: "1",
    type: "status_change",
    title: "Lead movido para Proposta",
    description: "Pedro Lima - CorpBrasil",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    user: { name: "Carlos" },
  },
  {
    id: "2",
    type: "call",
    title: "Ligação realizada",
    description: "Conversa com Ana Costa sobre projeto de marketing",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    user: { name: "Carlos" },
  },
  {
    id: "3",
    type: "email",
    title: "E-mail enviado",
    description: "Proposta comercial enviada para TechCorp",
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    user: { name: "Carlos" },
  },
  {
    id: "4",
    type: "note",
    title: "Nota adicionada",
    description: "Cliente interessado em plano anual com desconto",
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    user: { name: "Carlos" },
  },
  {
    id: "5",
    type: "meeting",
    title: "Reunião agendada",
    description: "Demo do produto para StartupX - Quarta 14h",
    timestamp: new Date(Date.now() - 1000 * 60 * 360),
    user: { name: "Carlos" },
  },
];

export default function DashboardPage() {
  return (
    <PageContainer
      title="Dashboard"
      subtitle="Visão geral do seu pipeline de vendas"
      actions={
        <Button icon={<Plus className="h-4 w-4" />}>Novo Lead</Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total de Leads"
          value="248"
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 12.5, label: "vs mês anterior" }}
        />
        <KpiCard
          label="Receita Pipeline"
          value="R$ 384K"
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: 8.2, label: "vs mês anterior" }}
        />
        <KpiCard
          label="Taxa de Conversão"
          value="24.8%"
          icon={<Target className="h-5 w-5" />}
          trend={{ value: -2.1, label: "vs mês anterior" }}
        />
        <KpiCard
          label="Tarefas Pendentes"
          value="12"
          icon={<CheckSquare className="h-5 w-5" />}
          trend={{ value: 5, label: "novas hoje" }}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads Table */}
        <SectionContainer
          title="Leads Recentes"
          actions={
            <Button variant="ghost" size="sm">
              Ver todos
            </Button>
          }
          noPadding
          className="lg:col-span-2"
        >
          <DataTable columns={columns} data={leads} rowKey="id" />
        </SectionContainer>

        {/* Activity Timeline */}
        <SectionContainer title="Atividade Recente">
          <ActivityTimeline activities={recentActivities} />
        </SectionContainer>
      </div>
    </PageContainer>
  );
}
