import { prisma } from "./db";
import { HOT_LEAD_MIN_SCORE, WARM_LEAD_MIN_SCORE } from "./lead-scoring";

export async function checkHotLeadAlert(leadId: string, previousScore: number, newScore: number) {

  if (previousScore < HOT_LEAD_MIN_SCORE && newScore >= HOT_LEAD_MIN_SCORE) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { userId: true, name: true, phone: true, score: true },
    });
    if (!lead) return;

    await prisma.activity.create({
      data: {
        userId: lead.userId,
        leadId,
        type: "status_change",
        title: `Lead quente detectado - score ${newScore}/100`,
        description: `${lead.name} foi identificado como lead quente. Tarefa de contato criada automaticamente.`,
        metadata: { previousScore, newScore, alert: "hot_lead" },
      },
    });
  }
}

export async function processEscalations() {
  const now = new Date();
  const results = [];

  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const staleQualified = await prisma.lead.findMany({
    where: {
      status: { in: ["qualifying", "qualified"] },
      score: { gte: WARM_LEAD_MIN_SCORE },
      lastContactAt: { lte: twoDaysAgo },
    },
    select: { id: true, userId: true, name: true, phone: true, score: true, lastContactAt: true },
  });

  for (const lead of staleQualified) {
    await prisma.activity.create({
      data: {
        userId: lead.userId,
        leadId: lead.id,
        type: "task",
        title: "Escalonamento: sem contato há 48h",
        description: `Tarefa de retomada criada automaticamente para ${lead.name}`,
      },
    });

    results.push({ leadId: lead.id, rule: "stale_48h" });
  }

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const abandonedNew = await prisma.lead.findMany({
    where: {
      status: "new",
      createdAt: { lte: sevenDaysAgo },
      lastContactAt: null,
    },
    select: { id: true, userId: true, name: true },
  });

  for (const lead of abandonedNew) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "lost", nextFollowUpAt: null },
    });

    await prisma.activity.create({
      data: {
        userId: lead.userId,
        leadId: lead.id,
        type: "status_change",
        title: "Lead encerrado automaticamente",
        description: `${lead.name} ficou sem contato por 7 dias e foi marcado como perdido.`,
        metadata: { rule: "auto_close_7d" },
      },
    });

    results.push({ leadId: lead.id, rule: "auto_close_7d" });
  }

  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const staleContacted = await prisma.lead.findMany({
    where: {
      status: "contacted",
      updatedAt: { lte: fourteenDaysAgo },
    },
    select: { id: true, userId: true, name: true },
  });

  for (const lead of staleContacted) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "lost", nextFollowUpAt: null },
    });

    await prisma.activity.create({
      data: {
        userId: lead.userId,
        leadId: lead.id,
        type: "status_change",
        title: "Lead encerrado automaticamente",
        description: `${lead.name} ficou sem avanço por 14 dias e foi marcado como perdido.`,
        metadata: { rule: "auto_close_14d" },
      },
    });

    results.push({ leadId: lead.id, rule: "auto_close_14d" });
  }

  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const staleProposals = await prisma.lead.findMany({
    where: {
      status: "proposal",
      updatedAt: { lte: fiveDaysAgo },
    },
    select: { id: true, userId: true, name: true },
  });

  for (const lead of staleProposals) {
    results.push({ leadId: lead.id, rule: "proposal_reminder_5d" });
  }

  return results;
}
