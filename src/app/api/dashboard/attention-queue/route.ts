import { prisma } from "@/lib/db";
import { HOT_LEAD_MIN_SCORE } from "@/lib/lead-scoring";
import { json, requireAuth, handleError } from "@/lib/api";
import {
  AttentionQueueItem,
  ATTENTION_QUEUE_NO_REPLY_THRESHOLD_HOURS,
  getAttentionQueuePriorityRank,
  sortAttentionQueueReasons,
} from "@/lib/attention-queue";

export async function GET() {
  try {
    const user = await requireAuth();
    const now = new Date();
    const noReplyThreshold = new Date(
      now.getTime() - ATTENTION_QUEUE_NO_REPLY_THRESHOLD_HOURS * 60 * 60 * 1000,
    );

    const leads = await prisma.lead.findMany({
      where: {
        userId: user.id,
        status: { notIn: ["won", "lost"] },
        OR: [
          { score: { gte: HOT_LEAD_MIN_SCORE } },
          { tasks: { some: { status: "pending", dueAt: { lte: now } } } },
          { conversation: { isNot: null } },
        ],
      },
      include: {
        conversation: {
          select: {
            id: true,
            status: true,
            unreadCount: true,
            lastMessageAt: true,
          },
        },
        tasks: {
          where: { status: "pending", dueAt: { lte: now } },
          orderBy: { dueAt: "asc" },
          take: 1,
          select: { id: true, title: true, dueAt: true },
        },
      },
    });

    const conversationIds = leads.flatMap((lead) => {
      return lead.conversation ? [lead.conversation.id] : [];
    });

    const [latestInboundMessages, latestHumanReplies] = await Promise.all([
      conversationIds.length > 0
        ? prisma.message.groupBy({
            by: ["conversationId"],
            where: {
              conversationId: { in: conversationIds },
              direction: "inbound",
            },
            _max: { createdAt: true },
          })
        : Promise.resolve([]),
      conversationIds.length > 0
        ? prisma.message.groupBy({
            by: ["conversationId"],
            where: {
              conversationId: { in: conversationIds },
              direction: "outbound",
              sender: "agent",
            },
            _max: { createdAt: true },
          })
        : Promise.resolve([]),
    ]);

    const latestInboundByConversation = new Map(
      latestInboundMessages.map((message) => {
        return [message.conversationId, message._max.createdAt ?? null];
      }),
    );
    const latestHumanReplyByConversation = new Map(
      latestHumanReplies.map((message) => {
        return [message.conversationId, message._max.createdAt ?? null];
      }),
    );

    const items: AttentionQueueItem[] = [];

    for (const lead of leads) {
      const reasons: AttentionQueueItem["reasons"] = [];
      const conv = lead.conversation;
      const latestInboundAt = conv
        ? latestInboundByConversation.get(conv.id) ?? null
        : null;
      const latestHumanReplyAt = conv
        ? latestHumanReplyByConversation.get(conv.id) ?? null
        : null;

      const hasUnread = Boolean(conv && conv.unreadCount > 0);
      if (hasUnread) {
        reasons.push("unread");
      }

      const isHot = lead.score >= HOT_LEAD_MIN_SCORE;
      if (isHot) {
        reasons.push("hot");
      }

      const hasNoReply = Boolean(
        latestInboundAt &&
          latestInboundAt.getTime() <= noReplyThreshold.getTime() &&
          (!latestHumanReplyAt ||
            latestHumanReplyAt.getTime() < latestInboundAt.getTime()),
      );
      if (hasNoReply) {
        reasons.push("no_reply");
      }

      const overdueTask = lead.tasks[0] ?? null;
      if (overdueTask) {
        reasons.push("overdue_task");
      }

      if (reasons.length === 0) continue;

      const priorityRank = getAttentionQueuePriorityRank({
        hasUnread,
        isHot,
        hasNoReply,
        hasOverdueTask: Boolean(overdueTask),
      });

      const lastRelevantAt =
        overdueTask?.dueAt ??
        latestInboundAt ??
        conv?.lastMessageAt ??
        null;

      items.push({
        leadId: lead.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        leadScore: lead.score,
        unreadCount: conv?.unreadCount ?? 0,
        conversationId: conv?.id ?? null,
        conversationStatus: conv?.status ?? null,
        lastRelevantAt: lastRelevantAt?.toISOString() ?? null,
        reasons: sortAttentionQueueReasons(reasons),
        overdueTaskId: overdueTask?.id ?? null,
        overdueTaskTitle: overdueTask?.title ?? null,
        overdueTaskDueAt: overdueTask?.dueAt?.toISOString() ?? null,
        priorityRank,
      });
    }

    items.sort((left, right) => {
      if (left.priorityRank !== right.priorityRank) {
        return left.priorityRank - right.priorityRank;
      }

      const leftTime = left.lastRelevantAt
        ? new Date(left.lastRelevantAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const rightTime = right.lastRelevantAt
        ? new Date(right.lastRelevantAt).getTime()
        : Number.MAX_SAFE_INTEGER;

      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      if (left.leadScore !== right.leadScore) {
        return right.leadScore - left.leadScore;
      }

      return left.leadName.localeCompare(right.leadName, "pt-BR");
    });

    return json(items);
  } catch (err) {
    return handleError(err);
  }
}
