import { prisma } from "./db";
import { sendAndSaveMessage } from "./whatsapp";
import { generateAutoReply } from "./ai";

const FOLLOW_UP_TEMPLATES = [
  "Olá! Tudo bem? Estou passando para saber se ainda tem interesse em encontrar o imóvel ideal. Posso ajudar com alguma informação?",
  "Oi! Notei que faz um tempo desde nosso último contato. Surgiram ótimas opções na região que você mencionou. Quer que eu te conte mais?",
  "Olá! Só passando para lembrar que estou à disposição caso queira retomar a busca pelo seu imóvel. É só me chamar!",
];

export async function processFollowUps() {
  const now = new Date();

  const leads = await prisma.lead.findMany({
    where: {
      nextFollowUpAt: { lte: now },
      status: { notIn: ["won", "lost"] },
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

  const results = [];

  for (const lead of leads) {
    const settings = lead.user.settings;
    if (!settings?.whatsappPhoneId || !settings?.whatsappToken) continue;
    if (lead.followUpCount >= (settings.maxFollowUps || 3)) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { nextFollowUpAt: null },
      });
      continue;
    }

    const config = { phoneId: settings.whatsappPhoneId, token: settings.whatsappToken };

    try {
      let message: string;

      if (settings.aiApiKey && lead.conversation?.messages.length) {
        const aiConfig = {
          provider: settings.aiProvider,
          apiKey: settings.aiApiKey,
          model: settings.aiModel,
        };
        message = await generateAutoReply(
          aiConfig,
          lead.user.name,
          lead.conversation.messages.reverse().map((m) => ({
            direction: m.direction,
            content: m.content,
            sender: m.sender,
          }))
        );
      } else {
        message = FOLLOW_UP_TEMPLATES[lead.followUpCount % FOLLOW_UP_TEMPLATES.length];
      }

      if (lead.conversation) {
        await sendAndSaveMessage(config, lead.conversation.id, lead.phone, message, "bot");
      }

      const delayHours = settings.followUpDelayHours || 24;
      const nextFollowUp = new Date(now.getTime() + delayHours * 60 * 60 * 1000);

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
          description: `Follow-up #${lead.followUpCount + 1} enviado`,
        },
      });

      results.push({ leadId: lead.id, status: "sent" });
    } catch (error) {
      console.error(`Follow-up failed for lead ${lead.id}:`, error);
      results.push({ leadId: lead.id, status: "failed", error });
    }
  }

  return results;
}

export async function scheduleFollowUp(leadId: string, delayHours: number = 24) {
  const nextFollowUp = new Date(Date.now() + delayHours * 60 * 60 * 1000);

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
