import { prisma } from "./db";
import { generateFollowUpMessage } from "./ai";
import { getWhatsAppConfig, sendAndSaveMessage } from "./whatsapp";
import { logger } from "./logger";

const FOLLOW_UP_TEMPLATES = [
  "Olá! Tudo bem? Estou passando para saber se você ainda tem interesse em encontrar o imóvel ideal. Posso ajudar com alguma informação?",
  "Oi! Notei que faz um tempo desde nosso último contato. Surgiram boas oportunidades na região que você mencionou. Quer que eu te envie algumas opções?",
  "Olá! Só passando para lembrar que sigo à disposição caso queira retomar sua busca. Se fizer sentido, posso te ajudar com os próximos passos.",
];

import {
  FOLLOW_UP_PROCESSING_LEASE_MINUTES,
  FOLLOW_UP_RETRY_DELAY_MINUTES,
  DEFAULT_MAX_FOLLOW_UPS,
} from "./constants";

async function loadDueLeads(now: Date) {
  return prisma.lead.findMany({
    where: {
      nextFollowUpAt: { lte: now },
      status: { notIn: ["won", "lost"] },
      conversation: { status: { not: "human" } },
      user: {
        settings: { followUpEnabled: true },
      },
    },
    include: {
      user: { include: { settings: true } },
      conversation: {
        include: { messages: { orderBy: { createdAt: "desc" }, take: 10 } },
      },
    },
  });
}

type DueLead = Awaited<ReturnType<typeof loadDueLeads>>[number];

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function getFollowUpDelayHours(delayHours: number | null | undefined) {
  return delayHours && delayHours > 0 ? delayHours : 24;
}

function getTemplateFollowUp(lead: DueLead) {
  return FOLLOW_UP_TEMPLATES[lead.followUpCount % FOLLOW_UP_TEMPLATES.length];
}

async function claimLeadForFollowUp(leadId: string, now: Date) {
  const processingLeaseUntil = addMinutes(now, FOLLOW_UP_PROCESSING_LEASE_MINUTES);
  const result = await prisma.lead.updateMany({
    where: {
      id: leadId,
      nextFollowUpAt: { lte: now },
    },
    data: {
      nextFollowUpAt: processingLeaseUntil,
    },
  });

  return result.count > 0;
}

async function clearScheduledFollowUp(leadId: string) {
  await prisma.lead.update({
    where: { id: leadId },
    data: { nextFollowUpAt: null },
  });
}

async function scheduleFailedRetry(lead: DueLead, now: Date, reason: string) {
  const retryAt = addMinutes(now, FOLLOW_UP_RETRY_DELAY_MINUTES);

  await prisma.lead.update({
    where: { id: lead.id },
    data: { nextFollowUpAt: retryAt },
  });

  await prisma.activity.create({
    data: {
      userId: lead.userId,
      leadId: lead.id,
      type: "follow_up_error",
      title: "Falha no follow-up automático",
      description: `${reason} Nova tentativa agendada para ${retryAt.toLocaleString("pt-BR")}.`,
    },
  });

  return retryAt;
}

async function buildFollowUpMessage(lead: DueLead) {
  const settings = lead.user.settings;
  if (!settings?.aiApiKey || !lead.conversation?.messages.length) {
    return getTemplateFollowUp(lead);
  }

  try {
    const aiMessage = await generateFollowUpMessage(
      {
        provider: settings.aiProvider,
        apiKey: settings.aiApiKey,
        model: settings.aiModel,
      },
      lead.user.name,
      [...lead.conversation.messages].reverse().map((message) => ({
        direction: message.direction,
        content: message.content,
        sender: message.sender,
      })),
    );

    return aiMessage.trim() || getTemplateFollowUp(lead);
  } catch (error) {
    logger.error("AI generation failed for follow-up", { leadId: lead.id, error: error instanceof Error ? error.message : String(error) });
    return getTemplateFollowUp(lead);
  }
}

export async function processFollowUps() {
  const now = new Date();
  const leads = await loadDueLeads(now);
  const results: Array<Record<string, string>> = [];

  for (const lead of leads) {
    const claimed = await claimLeadForFollowUp(lead.id, now);
    if (!claimed) {
      results.push({ leadId: lead.id, status: "skipped", reason: "already-claimed" });
      continue;
    }

    const settings = lead.user.settings;
    if (!settings?.whatsappPhoneId || !lead.conversation) {
      const retryAt = await scheduleFailedRetry(
        lead,
        now,
        "Não foi possível localizar a configuração do WhatsApp para enviar o follow-up.",
      );
      results.push({
        leadId: lead.id,
        status: "failed",
        reason: "whatsapp-not-configured",
        retryAt: retryAt.toISOString(),
      });
      continue;
    }

    if (lead.followUpCount >= (settings.maxFollowUps || DEFAULT_MAX_FOLLOW_UPS)) {
      await clearScheduledFollowUp(lead.id);
      results.push({ leadId: lead.id, status: "skipped", reason: "limit-reached" });
      continue;
    }

    const config = getWhatsAppConfig(settings.whatsappPhoneId);
    const message = await buildFollowUpMessage(lead);

    try {
      await sendAndSaveMessage(config, lead.conversation.id, lead.phone, message, "bot");

      const nextFollowUp = addHours(now, getFollowUpDelayHours(settings.followUpDelayHours));

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          followUpCount: { increment: 1 },
          nextFollowUpAt: nextFollowUp,
          lastContactAt: now,
        },
      });

      await prisma.activity.create({
        data: {
          userId: lead.userId,
          leadId: lead.id,
          type: "message",
          title: "Follow-up automático enviado",
          description: `Follow-up #${lead.followUpCount + 1} enviado com sucesso.`,
        },
      });

      results.push({ leadId: lead.id, status: "sent", nextFollowUpAt: nextFollowUp.toISOString() });
    } catch (error) {
      logger.error("Follow-up send failed", { leadId: lead.id, error: error instanceof Error ? error.message : String(error) });
      const retryAt = await scheduleFailedRetry(
        lead,
        now,
        "O envio falhou e o sistema vai tentar novamente em breve.",
      );
      results.push({
        leadId: lead.id,
        status: "failed",
        reason: "send-failed",
        retryAt: retryAt.toISOString(),
      });
    }
  }

  return results;
}

export async function scheduleFollowUp(leadId: string, delayHours = 24) {
  const nextFollowUp = addHours(new Date(), getFollowUpDelayHours(delayHours));

  await prisma.lead.update({
    where: { id: leadId },
    data: { nextFollowUpAt: nextFollowUp },
  });

  return nextFollowUp;
}

export async function cancelFollowUp(leadId: string) {
  await prisma.lead.update({
    where: { id: leadId },
    data: { nextFollowUpAt: null, followUpCount: 0 },
  });
}
