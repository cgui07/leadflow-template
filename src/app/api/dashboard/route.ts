import { prisma } from "@/lib/db";
import { json, requireAuth, handleError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth();

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
      conversationsWithUnread,
    ] = await Promise.all([
      prisma.lead.count({ where: { userId: user.id } }),
      prisma.lead.count({ where: { userId: user.id, status: "new" } }),
      prisma.lead.count({ where: { userId: user.id, status: "qualified" } }),
      prisma.lead.count({ where: { userId: user.id, status: "won" } }),
      prisma.lead.count({ where: { userId: user.id, score: { gte: 70 } } }),
      prisma.lead.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          pipelineStage: { select: { name: true, color: true } },
          conversation: { select: { unreadCount: true, lastMessageAt: true } },
        },
      }),
      prisma.activity.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { lead: { select: { name: true } } },
      }),
      prisma.task.count({ where: { userId: user.id, status: "pending" } }),
      prisma.task.count({ where: { userId: user.id, status: "pending", dueAt: { lte: new Date() } } }),
      prisma.conversation.count({
        where: { lead: { userId: user.id }, unreadCount: { gt: 0 } },
      }),
    ]);

    const pipelineValue = await prisma.lead.aggregate({
      where: { userId: user.id, status: { notIn: ["won", "lost"] }, value: { not: null } },
      _sum: { value: true },
    });

    return json({
      kpis: {
        totalLeads,
        newLeads,
        qualifiedLeads,
        wonLeads,
        hotLeads,
        pendingTasks,
        overdueTasks,
        unreadConversations: conversationsWithUnread,
        pipelineValue: pipelineValue._sum.value || 0,
      },
      recentLeads,
      recentActivities,
    });
  } catch (err) {
    return handleError(err);
  }
}
