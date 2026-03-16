"use client";

import Link from "next/link";
import type { Column } from "@/types";
import { useFetch } from "@/lib/hooks";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { getScoreTextClass } from "@/lib/ui-colors";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { AttentionQueue } from "./components/AttentionQueue";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { Users, MessageSquare, CheckSquare, Plus, Flame } from "lucide-react";
import {
  useBrandText,
  useFeatureFlag,
} from "@/components/providers/BrandingProvider";
import {
  LEAD_STATUS_BADGE_VARIANTS,
  LEAD_STATUS_LABELS,
  isLeadStatus,
} from "@/lib/lead-status";

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

const columns: Column<DashboardData["recentLeads"][0]>[] = [
  { key: "name", label: "Nome", sortable: true },
  { key: "phone", label: "Telefone" },
  {
    key: "score",
    label: "Score",
    render: (value) => {
      const score = value as number;
      return (
        <div className={`font-semibold ${getScoreTextClass(score)}`}>
          {score}/100
        </div>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    render: (value) => {
      const status =
        typeof value === "string" && isLeadStatus(value) ? value : null;

      return status ? (
        <Badge variant={LEAD_STATUS_BADGE_VARIANTS[status]} size="sm" dot>
          {LEAD_STATUS_LABELS[status]}
        </Badge>
      ) : null;
    },
  },
  { key: "source", label: "Fonte" },
];

export default function DashboardPage() {
  const { data, loading } = useFetch<DashboardData>("/api/dashboard");
  const title = useBrandText("dashboardTitle", "Dashboard");
  const subtitle = useBrandText(
    "dashboardSubtitle",
    "Visao geral dos seus leads e atendimentos",
  );
  const showAttentionQueue = useFeatureFlag("attentionQueue");

  if (loading) return <LoadingState variant="skeleton" />;

  const kpis = data?.kpis;

  return (
    <PageContainer
      title={title}
      subtitle={subtitle}
      actions={
        <Link href="/leads">
          <Button icon={<Plus className="h-4 w-4" />}>Novo Lead</Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total de Leads"
          value={String(kpis?.totalLeads || 0)}
          icon={<Users className="h-5 w-5" />}
          iconVariant="blue"
          trend={{ value: kpis?.newLeads || 0, label: "novos" }}
        />
        <KpiCard
          label="Leads Quentes"
          value={String(kpis?.hotLeads || 0)}
          icon={<Flame className="h-5 w-5" />}
          iconVariant="orange"
          trend={{ value: kpis?.qualifiedLeads || 0, label: "qualificados" }}
        />
        <KpiCard
          label="Conversas nao lidas"
          value={String(kpis?.unreadConversations || 0)}
          icon={<MessageSquare className="h-5 w-5" />}
          iconVariant="purple"
        />
        <KpiCard
          label="Tarefas Pendentes"
          value={String(kpis?.pendingTasks || 0)}
          icon={<CheckSquare className="h-5 w-5" />}
          iconVariant="teal"
        />
      </div>

      {showAttentionQueue && <AttentionQueue />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionContainer
          title="Leads Recentes"
          actions={
            <Link href="/leads">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          }
          noPadding
          className="lg:col-span-2"
        >
          {data?.recentLeads?.length ? (
            <DataTable columns={columns} data={data.recentLeads} rowKey="id" />
          ) : (
            <EmptyState
              title="Nenhum lead ainda"
              description="Seus leads aparecerao aqui quando comecarem a chegar via WhatsApp ou quando voce criar manualmente."
            />
          )}
        </SectionContainer>

        <SectionContainer title="Atividade Recente">
          {data?.recentActivities?.length ? (
            <div className="space-y-3">
              {data.recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="font-medium text-neutral-dark">
                      {activity.title}
                    </div>
                    {activity.description && (
                      <div className="mt-0.5 text-xs text-neutral-muted">
                        {activity.description}
                      </div>
                    )}
                    {activity.lead && (
                      <div className="mt-0.5 text-xs text-neutral-muted">
                        {activity.lead.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-muted">
              Nenhuma atividade recente
            </div>
          )}
        </SectionContainer>
      </div>
    </PageContainer>
  );
}
