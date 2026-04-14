import { prisma } from "./db";
import { logger } from "./logger";
import { getWhatsAppConfig, sendAndSaveMessage, sendWhatsAppMedia } from "./whatsapp";

const OPTION_1_PATTERNS = [
  /^1$/,
  /\b1\b/,
  /aqui/i,
  /por aqui/i,
  /receber/i,
  /manda/i,
  /pode mandar/i,
  /sim/i,
  /quero/i,
  /pode/i,
];

const OPTION_2_PATTERNS = [
  /^2$/,
  /\b2\b/,
  /ligar/i,
  /liga/i,
  /me liga/i,
  /prefiro.*lig/i,
  /prefer.*ligar/i,
  /ligue/i,
  /por.*telefone/i,
];

export function detectCampaignOption(text: string): "1" | "2" | null {
  const clean = text.trim();

  for (const pattern of OPTION_2_PATTERNS) {
    if (pattern.test(clean)) return "2";
  }

  for (const pattern of OPTION_1_PATTERNS) {
    if (pattern.test(clean)) return "1";
  }

  return null;
}

export async function handleCampaignReply(
  conversationId: string,
  messageText: string,
  userId: string,
  leadId: string,
  whatsappChatId: string,
): Promise<boolean> {
  const option = detectCampaignOption(messageText);

  if (!option) return false;

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      whatsappPhoneId: true,
      campaignSecondMessage: true,
      campaignSecondImageUrl: true,
    },
  });

  if (!settings?.whatsappPhoneId) return false;

  if (option === "2") {
    // Alerta no CRM — corretor precisa ligar
    await prisma.activity.create({
      data: {
        userId,
        leadId,
        type: "alert",
        title: "Lead prefere ser ligado",
        description: "O lead respondeu que prefere receber uma ligação. Entre em contato por telefone.",
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        awaitingCampaignResponse: false,
        status: "paused",
      },
    });

    logger.info("[campaign-reply] Lead prefers call, activity created", { leadId });
    return true;
  }

  // Opção 1 — envia segunda mensagem e ativa IA
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { awaitingCampaignResponse: false, status: "bot" },
  });

  const config = getWhatsAppConfig(settings.whatsappPhoneId);

  if (settings.campaignSecondMessage?.trim()) {
    if (settings.campaignSecondImageUrl) {
      try {
        await sendWhatsAppMedia(
          config,
          whatsappChatId,
          "image",
          settings.campaignSecondImageUrl,
          { caption: settings.campaignSecondMessage ?? undefined },
        );

        await prisma.message.create({
          data: {
            conversationId,
            direction: "outbound",
            content: settings.campaignSecondMessage ?? "",
            sender: "bot",
            type: "image",
          },
        });
      } catch {
        await sendAndSaveMessage(config, conversationId, whatsappChatId, settings.campaignSecondMessage, "bot");
      }
    } else {
      await sendAndSaveMessage(config, conversationId, whatsappChatId, settings.campaignSecondMessage, "bot");
    }
  }

  logger.info("[campaign-reply] Second message sent, AI activated", { leadId });
  return true;
}
