import { prisma } from "@/lib/db";
import type { DashboardData } from "./contracts";
import { HOT_LEAD_MIN_SCORE } from "@/lib/lead-scoring";
import { OPEN_ACTION_STATUSES } from "@/lib/lead-action-config";
import {
  ATTENTION_QUEUE_NO_REPLY_THRESHOLD_HOURS,
  getAttentionQueuePriorityRank,
  sortAttentionQueueReasons,
  type AttentionQueueItem,
} from "@/lib/attention-queue";

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    wonLeads,
    hotLeads,
    recentLeads,
    recentActivities,
    pendingTasks,
    overdueTasks,
    unreadConversations,
    pipelineValue,
  ] = await Promise.all([
    prisma.lead.count({ where: { userId } }),
    prisma.lead.count({ where: { userId, status: "new" } }),
    prisma.lead.count({ where: { userId, status: "qualified" } }),
    prisma.lead.count({ where: { userId, status: "won" } }),
    prisma.lead.count({
      where: { userId, score: { gte: HOT_LEAD_MIN_SCORE } },
    }),
    prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        pipelineStage: { select: { name: true, color: true } },
        conversation: { select: { unreadCount: true, lastMessageAt: true } },
      },
    }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { lead: { select: { name: true } } },
    }),
    prisma.task.count({ where: { userId, status: "pending" } }),
    prisma.task.count({
      where: { userId, status: "pending", dueAt: { lte: new Date() } },
    }),
    prisma.conversation.count({
      where: { lead: { userId }, unreadCount: { gt: 0 } },
    }),
    prisma.lead.aggregate({
      where: {
        userId,
        status: { notIn: ["won", "lost"] },
        value: { not: null },
      },
      _sum: { value: true },
    }),
  ]);

  return {
    kpis: {
      totalLeads,
      newLeads,
      qualifiedLeads,
      wonLeads,
      hotLeads,
      pendingTasks,
      overdueTasks,
      unreadConversations,
      pipelineValue: toNumber(pipelineValue._sum.value),
    },
    recentLeads: recentLeads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      status: lead.status,
      score: lead.score,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
      pipelineStage: lead.pipelineStage
        ? {
            name: lead.pipelineStage.name,
            color: lead.pipelineStage.color,
          }
        : null,
      conversation: lead.conversation
        ? {
            unreadCount: lead.conversation.unreadCount,
            lastMessageAt: lead.conversation.lastMessageAt?.toISOString() ?? null,
          }
        : null,
    })),
    recentActivities: recentActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      createdAt: activity.createdAt.toISOString(),
      lead: activity.lead ? { name: activity.lead.name } : null,
    })),
  };
}

export async function getAttentionQueueItems(
  userId: string,
): Promise<AttentionQueueItem[]> {
  const now = new Date();
  const noReplyThreshold = new Date(
    now.getTime() -
      ATTENTION_QUEUE_NO_REPLY_THRESHOLD_HOURS * 60 * 60 * 1000,
  );

  const leads = await prisma.lead.findMany({
    where: {
      userId,
      status: { notIn: ["won", "lost"] },
      OR: [
        { score: { gte: HOT_LEAD_MIN_SCORE } },
        { tasks: { some: { status: "pending", dueAt: { lte: now } } } },
        {
          leadActions: {
            some: {
              status: { in: OPEN_ACTION_STATUSES },
              scheduledAt: { lte: now },
            },
          },
        },
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
      leadActions: {
        where: {
          status: { in: OPEN_ACTION_STATUSES },
          scheduledAt: { lte: now },
        },
        orderBy: { scheduledAt: "asc" },
        take: 1,
        select: { id: true, title: true, type: true, scheduledAt: true },
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
    const conversation = lead.conversation;
    const latestInboundAt = conversation
      ? latestInboundByConversation.get(conversation.id) ?? null
      : null;
    const latestHumanReplyAt = conversation
      ? latestHumanReplyByConversation.get(conversation.id) ?? null
      : null;

    const hasUnread = Boolean(conversation && conversation.unreadCount > 0);
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

    const overdueAction = lead.leadActions[0] ?? null;
    if (overdueAction) {
      reasons.push("overdue_action");
    }

    if (reasons.length === 0) {
      continue;
    }

    const priorityRank = getAttentionQueuePriorityRank({
      hasUnread,
      isHot,
      hasNoReply,
      hasOverdueTask: Boolean(overdueTask),
      hasOverdueAction: Boolean(overdueAction),
    });

    const lastRelevantAt =
      overdueTask?.dueAt ??
      overdueAction?.scheduledAt ??
      latestInboundAt ??
      conversation?.lastMessageAt ??
      null;

    items.push({
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      leadScore: lead.score,
      unreadCount: conversation?.unreadCount ?? 0,
      conversationId: conversation?.id ?? null,
      conversationStatus: conversation?.status ?? null,
      lastRelevantAt: lastRelevantAt?.toISOString() ?? null,
      reasons: sortAttentionQueueReasons(reasons),
      overdueTaskId: overdueTask?.id ?? null,
      overdueTaskTitle: overdueTask?.title ?? null,
      overdueTaskDueAt: overdueTask?.dueAt?.toISOString() ?? null,
      overdueActionId: overdueAction?.id ?? null,
      overdueActionTitle: overdueAction?.title ?? null,
      overdueActionScheduledAt:
        overdueAction?.scheduledAt?.toISOString() ?? null,
      overdueActionType: overdueAction?.type ?? null,
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

  return items;
}
