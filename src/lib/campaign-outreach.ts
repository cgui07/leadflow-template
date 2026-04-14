/**
 * Envia a mensagem de outreach de campanha (1ª mensagem) e marca a conversa
 * como aguardando resposta do lead (opção 1 ou 2).
 */
import { prisma } from "./db";
import { logger } from "./logger";
import type { AIConfig } from "./ai";
import { resolveOutreachMessage } from "./ai";
import { getWhatsAppConfig, sendAndSaveMessage, sendWhatsAppMedia } from "./whatsapp";

interface CampaignOutreachOptions {
  userId: string;
  conversationId: string;
  whatsappChatId: string;
  contactName: string;
  agentName: string;
  aiConfig: AIConfig;
  campaignOutreachMessage: string | null | undefined;
  campaignOutreachImageUrl: string | null | undefined;
  hasCampaignSecondMessage: boolean;
  whatsappPhoneId: string;
}

export async function sendCampaignOutreach(opts: CampaignOutreachOptions): Promise<boolean> {
  const {
    conversationId,
    whatsappChatId,
    contactName,
    agentName,
    aiConfig,
    campaignOutreachMessage,
    campaignOutreachImageUrl,
    hasCampaignSecondMessage,
    whatsappPhoneId,
  } = opts;

  const message = await resolveOutreachMessage(
    aiConfig,
    agentName,
    contactName,
    campaignOutreachMessage,
  );

  if (!message) {
    logger.warn("[campaign-outreach] Empty outreach message", { conversationId });
    return false;
  }

  const config = getWhatsAppConfig(whatsappPhoneId);

  if (campaignOutreachImageUrl) {
    try {
      await sendWhatsAppMedia(
        config,
        whatsappChatId,
        "image",
        campaignOutreachImageUrl,
        { caption: message },
      );

      await prisma.message.create({
        data: {
          conversationId,
          direction: "outbound",
          content: message,
          sender: "bot",
          type: "image",
        },
      });
    } catch {
      await sendAndSaveMessage(config, conversationId, whatsappChatId, message, "bot");
    }
  } else {
    await sendAndSaveMessage(config, conversationId, whatsappChatId, message, "bot");
  }

  // Marca conversa como aguardando resposta apenas se há segunda mensagem configurada
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: "bot",
      awaitingCampaignResponse: hasCampaignSecondMessage,
    },
  });

  return true;
}
