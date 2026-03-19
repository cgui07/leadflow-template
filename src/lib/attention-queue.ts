export const ATTENTION_QUEUE_INITIAL_VISIBLE = 5;
export const ATTENTION_QUEUE_NO_REPLY_THRESHOLD_HOURS = 3;

export type AttentionQueueReason =
  | "unread"
  | "hot"
  | "no_reply"
  | "overdue_action";

export interface AttentionQueueItem {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadScore: number;
  unreadCount: number;
  conversationId: string | null;
  conversationStatus: string | null;
  lastRelevantAt: string | null;
  reasons: AttentionQueueReason[];
  overdueActionId: string | null;
  overdueActionTitle: string | null;
  overdueActionScheduledAt: string | null;
  overdueActionType: string | null;
  priorityRank: number;
}

interface AttentionQueuePriorityInput {
  hasUnread: boolean;
  isHot: boolean;
  hasNoReply: boolean;
  hasOverdueAction: boolean;
}

const reasonOrder: Record<AttentionQueueReason, number> = {
  overdue_action: 1,
  unread: 2,
  hot: 3,
  no_reply: 4,
};

export function getAttentionQueuePriorityRank({
  hasUnread,
  isHot,
  hasNoReply,
  hasOverdueAction,
}: AttentionQueuePriorityInput) {
  if (hasOverdueAction) return 1;
  if (isHot && hasUnread) return 2;
  if (isHot && hasNoReply) return 3;
  if (hasUnread) return 4;
  if (hasNoReply) return 5;
  if (isHot) return 6;

  return 99;
}

export function sortAttentionQueueReasons(reasons: AttentionQueueReason[]) {
  return [...reasons].sort((left, right) => {
    return reasonOrder[left] - reasonOrder[right];
  });
}
