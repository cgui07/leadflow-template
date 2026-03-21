import {
  ACTION_TYPE_LABELS,
  type LeadActionType,
} from "@/lib/lead-action-config";
import type { AttentionQueueItem } from "@/lib/attention-queue";

export function formatTimeAgo(dateStr: string | null) {
  if (!dateStr) return "";

  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes}min atrás`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;

  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function getOverdueActionLabel(item: AttentionQueueItem) {
  if (item.overdueActionTitle) {
    return item.overdueActionTitle;
  }

  if (item.overdueActionType && item.overdueActionType in ACTION_TYPE_LABELS) {
    return ACTION_TYPE_LABELS[item.overdueActionType as LeadActionType];
  }

  return "Ação vencida";
}

export function getNotificationHref(item: AttentionQueueItem) {
  if (item.conversationId) {
    return `/conversations?conversationId=${item.conversationId}`;
  }

  return `/leads/${item.leadId}`;
}
