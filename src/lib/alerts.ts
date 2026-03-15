import { prisma } from "./db";

export async function checkHotLeadAlert(leadId: string, previousScore: number, newScore: number) {

  if (previousScore < 70 && newScore >= 70) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { userId: true, name: true, phone: true, score: true },
    });
    if (!lead) return;

    await prisma.task.create({
      data: {
        userId: lead.userId,
        leadId,
        type: "call",
        title: `Lead quente: ${lead.name} (score ${newScore})`,
        description: `O lead ${lead.name} (${lead.phone}) atingiu score ${newScore}/100. Recomendado entrar em contato imediatamente.`,
        dueAt: new Date(),
      },
    });

    await prisma.activity.create({
      data: {
        userId: lead.userId,
        leadId,
        type: "status_change",
        title: `Lead quente detectado — score ${newScore}/100`,
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
      score: { gte: 40 },
      lastContactAt: { lte: twoDaysAgo },
      tasks: { none: { type: "call", status: "pending", createdAt: { gte: twoDaysAgo } } },
    },
    select: { id: true, userId: true, name: true, phone: true, score: true, lastContactAt: true },
  });

  for (const lead of staleQualified) {
    await prisma.task.create({
      data: {
        userId: lead.userId,
        leadId: lead.id,
        type: "call",
        title: `Sem resposta há 48h: ${lead.name}`,
        description: `Lead com score ${lead.score} não recebe contato desde ${lead.lastContactAt?.toLocaleDateString("pt-BR")}. Recomendado retomar contato.`,
        dueAt: now,
      },
    });

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
      tasks: { none: { type: "proposal", status: "pending", createdAt: { gte: fiveDaysAgo } } },
    },
    select: { id: true, userId: true, name: true },
  });

  for (const lead of staleProposals) {
    await prisma.task.create({
      data: {
        userId: lead.userId,
        leadId: lead.id,
        type: "proposal",
        title: `Proposta sem retorno: ${lead.name}`,
        description: `A proposta para ${lead.name} foi enviada há mais de 5 dias sem retorno. Recomendado fazer follow-up.`,
        dueAt: now,
      },
    });

    results.push({ leadId: lead.id, rule: "proposal_reminder_5d" });
  }

  return results;
}
