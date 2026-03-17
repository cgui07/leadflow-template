"use client";

import Link from "next/link";
import type { Column } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { getScoreTextClass } from "@/lib/ui-colors";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { AttentionQueueSection } from "./AttentionQueueSection";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import type { DashboardAttentionQueue, DashboardData } from "../contracts";
import { Users, MessageSquare, CheckSquare, Plus, Flame } from "lucide-react";
import {
  LEAD_STATUS_BADGE_VARIANTS,
  LEAD_STATUS_LABELS,
  isLeadStatus,
} from "@/lib/lead-status";

const columns: Column<DashboardData["recentLeads"][number]>[] = [
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

interface DashboardPageContentProps {
  attentionQueueItems: DashboardAttentionQueue;
  data: DashboardData;
  showAttentionQueue: boolean;
  subtitle: string;
  title: string;
}

export function DashboardPageContent({
  attentionQueueItems,
  data,
  showAttentionQueue,
  subtitle,
  title,
}: DashboardPageContentProps) {
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
          value={String(data.kpis.totalLeads)}
          icon={<Users className="h-5 w-5" />}
          iconVariant="blue"
          trend={{ value: data.kpis.newLeads, label: "novos" }}
        />
        <KpiCard
          label="Leads Quentes"
          value={String(data.kpis.hotLeads)}
          icon={<Flame className="h-5 w-5" />}
          iconVariant="orange"
          trend={{ value: data.kpis.qualifiedLeads, label: "qualificados" }}
        />
        <KpiCard
          label="Conversas não lidas"
          value={String(data.kpis.unreadConversations)}
          icon={<MessageSquare className="h-5 w-5" />}
          iconVariant="purple"
        />
        <KpiCard
          label="Tarefas Pendentes"
          value={String(data.kpis.pendingTasks)}
          icon={<CheckSquare className="h-5 w-5" />}
          iconVariant="teal"
        />
      </div>

      {showAttentionQueue ? (
        <AttentionQueueSection items={attentionQueueItems} />
      ) : null}

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
          {data.recentLeads.length ? (
            <DataTable columns={columns} data={data.recentLeads} rowKey="id" />
          ) : (
            <EmptyState
              title="Nenhum lead ainda"
              description="Seus leads aparecerão aqui quando começarem a chegar via WhatsApp ou quando você criar manualmente."
            />
          )}
        </SectionContainer>

        <SectionContainer title="Atividade Recente">
          {data.recentActivities.length ? (
            <div className="space-y-3">
              {data.recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="font-medium text-neutral-dark">
                      {activity.title}
                    </div>
                    {activity.description ? (
                      <div className="mt-0.5 text-xs text-neutral-muted">
                        {activity.description}
                      </div>
                    ) : null}
                    {activity.lead ? (
                      <div className="mt-0.5 text-xs text-neutral-muted">
                        {activity.lead.name}
                      </div>
                    ) : null}
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
