"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFetch } from "@/lib/hooks";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useEffect, useRef, useState } from "react";
import {
  ACTION_TYPE_LABELS,
  type LeadActionType,
} from "@/lib/lead-action-config";
import {
  AlertTriangle,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  MessageSquare,
  User,
} from "lucide-react";
import {
  ATTENTION_QUEUE_NO_REPLY_THRESHOLD_HOURS,
  type AttentionQueueItem,
  type AttentionQueueReason,
} from "@/lib/attention-queue";

const MAX_VISIBLE_NOTIFICATIONS = 5;

function formatTimeAgo(dateStr: string | null) {
  if (!dateStr) return "";

  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes}min atrás`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;

  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

function getOverdueActionLabel(item: AttentionQueueItem) {
  if (item.overdueActionTitle) {
    return item.overdueActionTitle;
  }

  if (
    item.overdueActionType &&
    item.overdueActionType in ACTION_TYPE_LABELS
  ) {
    return ACTION_TYPE_LABELS[item.overdueActionType as LeadActionType];
  }

  return "Ação vencida";
}

function getPrimaryReason(
  reason: AttentionQueueReason,
  item: AttentionQueueItem,
) {
  switch (reason) {
    case "overdue_task":
      return {
        label: item.overdueTaskTitle || "Tarefa vencida",
        icon: <AlertTriangle className="h-3.5 w-3.5 text-red-dark" />,
        tone: "text-red-dark",
      };
    case "overdue_action":
      return {
        label: getOverdueActionLabel(item),
        icon: <AlertTriangle className="h-3.5 w-3.5 text-red-dark" />,
        tone: "text-red-dark",
      };
    case "unread":
      return {
        label:
          item.unreadCount > 1
            ? `${item.unreadCount} mensagens não lidas`
            : "Mensagem não lida",
        icon: <MessageSquare className="h-3.5 w-3.5 text-orange-amber" />,
        tone: "text-yellow-dark",
      };
    case "hot":
      return {
        label: "Lead quente",
        icon: <Flame className="h-3.5 w-3.5 text-red-dark" />,
        tone: "text-red-dark",
      };
    case "no_reply":
      return {
        label: `Sem resposta há ${ATTENTION_QUEUE_NO_REPLY_THRESHOLD_HOURS}h`,
        icon: <Clock3 className="h-3.5 w-3.5 text-blue-navy" />,
        tone: "text-blue-navy",
      };
    default:
      return {
        label: "Notificação",
        icon: <Bell className="h-3.5 w-3.5 text-neutral-dark" />,
        tone: "text-neutral-dark",
      };
  }
}

function getNotificationHref(item: AttentionQueueItem) {
  if (item.conversationId) {
    return `/conversations?conversationId=${item.conversationId}`;
  }

  return `/leads/${item.leadId}`;
}

export function NotificationBell() {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const {
    data: items,
    loading,
    error,
    refetch,
  } = useFetch<AttentionQueueItem[]>(
    "/api/dashboard/attention-queue",
  );
  const total = items?.length ?? 0;
  const visibleItems = items?.slice(0, MAX_VISIBLE_NOTIFICATIONS) ?? [];

  useEffect(() => {
    function handlePointerOrKeyDown(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") {
          setOpen(false);
        }
        return;
      }

      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (!open) return;

    document.addEventListener("mousedown", handlePointerOrKeyDown);
    document.addEventListener("keydown", handlePointerOrKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerOrKeyDown);
      document.removeEventListener("keydown", handlePointerOrKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        icon={<Bell className="h-5 w-5" />}
        className="relative"
        aria-label={
          total > 0
            ? `Abrir notificações (${total} pendências)`
            : "Abrir notificações"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="notification-bell-panel"
        onClick={() => setOpen((current) => !current)}
      >
        {total > 0 && (
          <div className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {total > 9 ? "9+" : total}
          </div>
        )}
      </Button>

      {open && (
        <div
          id="notification-bell-panel"
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-neutral-border bg-white shadow-lg"
        >
          <div className="border-b border-neutral-pale px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-neutral-ink">
                  Notificações
                </div>
                <div className="text-xs text-neutral-muted">
                  Prioridades para você agir agora
                </div>
              </div>
              <Badge variant={total > 0 ? "warning" : "default"} size="sm">
                {total} {total === 1 ? "item" : "itens"}
              </Badge>
            </div>
          </div>

          <div className="max-h-[26rem] overflow-y-auto px-3 py-3">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-18 animate-pulse rounded-xl bg-neutral-pale"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-pale">
                  <AlertTriangle className="h-6 w-6 text-red-dark" />
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-ink">
                    Não foi possível carregar agora
                  </div>
                  <div className="mt-1 text-xs text-neutral-muted">
                    Tente novamente para atualizar sua fila operacional.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : total === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-pale">
                  <CheckCircle2 className="h-6 w-6 text-green-forest" />
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-ink">
                    Sem notificações urgentes
                  </div>
                  <div className="mt-1 text-xs text-neutral-muted">
                    Sua fila está em dia neste momento.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleItems.map((item) => {
                  const primaryReason = getPrimaryReason(item.reasons[0], item);

                  return (
                    <Link
                      key={item.leadId}
                      href={getNotificationHref(item)}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl border border-neutral-border bg-neutral-surface px-3 py-3 transition-colors hover:bg-neutral-pale"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-border text-sm font-semibold text-neutral-dark">
                          {item.leadName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-semibold text-neutral-ink">
                              {item.leadName}
                            </div>
                            <div className="shrink-0 text-[11px] text-neutral-muted">
                              {formatTimeAgo(item.lastRelevantAt)}
                            </div>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs">
                            {primaryReason.icon}
                            <span className={cn("truncate", primaryReason.tone)}>
                              {primaryReason.label}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-neutral-muted">
                            <span className="truncate">{item.leadPhone}</span>
                            {item.conversationStatus && (
                              <span className="inline-flex items-center gap-1">
                                {item.conversationStatus === "bot" ? (
                                  <Bot className="h-3 w-3" />
                                ) : (
                                  <User className="h-3 w-3" />
                                )}
                                {item.conversationStatus === "bot"
                                  ? "Bot"
                                  : "Manual"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-pale px-3 py-2">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-dark transition-colors hover:bg-neutral-surface"
            >
              <span>Ver fila completa</span>
              <ChevronRight className="h-4 w-4 text-neutral-muted" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
