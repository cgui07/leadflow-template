"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getScoreTextClass } from "@/lib/ui-colors";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionContainer } from "@/components/layout/SectionContainer";
import {
  ACTION_TYPE_LABELS,
  type LeadActionType,
} from "@/lib/lead-action-config";
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  ChevronDown,
  Clock,
  ExternalLink,
  Flame,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import {
  ATTENTION_QUEUE_INITIAL_VISIBLE,
  ATTENTION_QUEUE_NO_REPLY_THRESHOLD_HOURS,
  type AttentionQueueItem,
  type AttentionQueueReason,
} from "@/lib/attention-queue";

interface AttentionQueueSectionProps {
  items: AttentionQueueItem[];
}

function getOverdueActionLabel(item: AttentionQueueItem) {
  if (item.overdueActionTitle) {
    return `Ação: ${item.overdueActionTitle}`;
  }

  if (item.overdueActionType && item.overdueActionType in ACTION_TYPE_LABELS) {
    return `${ACTION_TYPE_LABELS[item.overdueActionType as LeadActionType]} vencida`;
  }

  return "Ação vencida";
}

const reasonConfig: Record<
  AttentionQueueReason,
  {
    getLabel: (item: AttentionQueueItem) => string;
    icon: React.ReactNode;
    variant: "error" | "warning" | "info" | "purple";
  }
> = {
  overdue_task: {
    getLabel: () => "Tarefa vencida",
    icon: <AlertTriangle size={10} />,
    variant: "error",
  },
  unread: {
    getLabel: (item) => {
      return item.unreadCount > 1
        ? `${item.unreadCount} não lidas`
        : "Não lida";
    },
    icon: <Mail size={10} />,
    variant: "warning",
  },
  hot: {
    getLabel: () => "Quente",
    icon: <Flame size={10} />,
    variant: "error",
  },
  no_reply: {
    getLabel: () => `Sem resposta ${ATTENTION_QUEUE_NO_REPLY_THRESHOLD_HOURS}h`,
    icon: <Clock size={10} />,
    variant: "info",
  },
  overdue_action: {
    getLabel: getOverdueActionLabel,
    icon: <AlertTriangle size={10} />,
    variant: "error",
  },
};

function formatTimeAgo(dateValue: string | null) {
  if (!dateValue) {
    return "";
  }

  const diff = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) {
    return `${minutes}min atras`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h atras`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

function getRelevantStatusText(item: AttentionQueueItem) {
  if (item.reasons.includes("overdue_task") && item.overdueTaskDueAt) {
    return `Tarefa vencida ${formatTimeAgo(item.overdueTaskDueAt)}`;
  }

  if (
    item.reasons.includes("overdue_action") &&
    item.overdueActionScheduledAt
  ) {
    return `Ação vencida ${formatTimeAgo(item.overdueActionScheduledAt)}`;
  }

  if (item.lastRelevantAt) {
    return `Cliente aguardando ${formatTimeAgo(item.lastRelevantAt)}`;
  }

  return "";
}

function QueueItem({ item }: { item: AttentionQueueItem }) {
  const relevantStatus = getRelevantStatusText(item);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-border bg-neutral-surface px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-border text-xs font-bold text-neutral-dark sm:h-10 sm:w-10 sm:text-sm">
        {item.leadName.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-neutral-ink">
            {item.leadName}
          </span>
          <span
            className={`hidden text-xs font-semibold sm:inline ${getScoreTextClass(item.leadScore)}`}
          >
            {item.leadScore}/100
          </span>
          {item.conversationStatus && (
            <div className="hidden items-center gap-0.5 text-[10px] text-neutral-muted sm:inline-flex">
              {item.conversationStatus === "bot" ? (
                <Bot size={10} />
              ) : (
                <User size={10} />
              )}
              {item.conversationStatus === "bot" ? "Bot" : "Manual"}
            </div>
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-muted">
          <span className="truncate">{item.leadPhone}</span>
          {relevantStatus && (
            <>
              <span className="text-neutral-line">|</span>
              <span className="shrink-0">{relevantStatus}</span>
            </>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.reasons.map((reason) => {
            const config = reasonConfig[reason];

            return (
              <Badge key={reason} variant={config.variant} size="sm">
                <span className="flex items-center gap-1">
                  {config.icon}
                  {config.getLabel(item)}
                </span>
              </Badge>
            );
          })}
        </div>

        {item.overdueTaskTitle && (
          <div className="mt-1 text-xs text-red-dark">
            Tarefa: {item.overdueTaskTitle}
          </div>
        )}
        {item.overdueActionTitle && (
          <div className="mt-1 text-xs text-red-dark">
            Ação: {item.overdueActionTitle}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
        {item.conversationId && (
          <Link href={`/conversations?conversationId=${item.conversationId}`}>
            <Button
              variant="primary"
              size="sm"
              icon={<MessageSquare size={13} />}
            >
              <span className="hidden sm:inline">Abrir conversa</span>
            </Button>
          </Link>
        )}
        <Link href={`/leads/${item.leadId}`}>
          <Button variant="ghost" size="sm" icon={<ExternalLink size={13} />}>
            <span className="hidden sm:inline">Ver lead</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function AttentionQueueSection({ items }: AttentionQueueSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const total = items.length;
  const visibleItems = expanded
    ? items
    : items.slice(0, ATTENTION_QUEUE_INITIAL_VISIBLE);

  return (
    <SectionContainer
      title="Quem preciso responder agora"
      description="Fila operacional priorizada para você agir sem se perder"
      icon={<AlertTriangle className="h-4 w-4 text-orange-amber" />}
      actions={
        total > 0 ? (
          <Badge variant="warning" size="sm">
            {total} {total === 1 ? "pendência" : "pendências"}
          </Badge>
        ) : undefined
      }
    >
      {!total ? (
        <EmptyState
          icon={<CheckCircle className="h-10 w-10 text-green-emerald" />}
          title="Tudo em dia"
          description="Nenhum lead precisa de atenção imediata agora."
        />
      ) : (
        <div className="space-y-2">
          {visibleItems.map((item) => (
            <QueueItem key={item.leadId} item={item} />
          ))}

          {total > ATTENTION_QUEUE_INITIAL_VISIBLE && !expanded && (
            <div className="pt-1 text-center">
              <Button
                variant="ghost"
                size="sm"
                icon={<ChevronDown size={14} />}
                onClick={() => setExpanded(true)}
              >
                Ver mais {total - ATTENTION_QUEUE_INITIAL_VISIBLE}{" "}
                {total - ATTENTION_QUEUE_INITIAL_VISIBLE === 1
                  ? "item"
                  : "itens"}
              </Button>
            </div>
          )}
        </div>
      )}
    </SectionContainer>
  );
}
