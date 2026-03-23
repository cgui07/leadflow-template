import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getPropertyPdfUrl } from "@/lib/storage";
import { generateSpeechBase64 } from "@/lib/elevenlabs";
import {
  shouldUseVoiceReply,
  getVoiceUsageThisMonth,
  incrementVoiceUsage,
} from "@/lib/voice-reply";
import {
  getWhatsAppConfig,
  sendAndSaveMessage,
  sendAndSaveAudioPTT,
  sendPresenceUpdate,
} from "@/lib/whatsapp";

export function extractPdfTags(reply: string): {
  cleanReply: string;
  propertyIds: string[];
} {
  const regex = /\[ENVIAR_PDF:([a-f0-9-]+)\]/gi;
  const propertyIds: string[] = [];
  let match;
  while ((match = regex.exec(reply)) !== null) {
    propertyIds.push(match[1]);
  }
  const cleanReply = reply.replace(regex, "").trim();
  return { cleanReply, propertyIds };
}

export function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface VoiceConfig {
  elevenlabsApiKey: string;
  elevenlabsVoiceId: string;
  voiceReplyMonthlyLimit: number;
}

export async function sendVoiceReply(
  voiceConfig: VoiceConfig,
  whatsappPhoneId: string,
  conversationId: string,
  replyJid: string,
  cleanReply: string,
  inboundText: string,
  orderedMessages: Array<{ direction: string; type: string }>,
  userId: string,
): Promise<boolean> {
  const currentMonthUsage = await getVoiceUsageThisMonth(userId);

  const finalDecision = shouldUseVoiceReply({
    replyText: cleanReply,
    inboundText,
    isFirstBotReply:
      orderedMessages.filter((m) => m.direction === "outbound").length === 0,
    recentOutboundMessages: orderedMessages
      .filter((m) => m.direction === "outbound")
      .map((m) => ({ type: m.type })),
    voiceEnabled: true,
    monthlyLimit: voiceConfig.voiceReplyMonthlyLimit,
    currentMonthUsage,
  });

  logger.info("Voice decision", {
    useVoice: finalDecision.useVoice,
    reason: finalDecision.reason,
    currentMonthUsage,
    monthlyLimit: voiceConfig.voiceReplyMonthlyLimit,
  });

  if (!finalDecision.useVoice) {
    return false;
  }

  const whatsappConfig = getWhatsAppConfig(whatsappPhoneId);

  try {
    await sendPresenceUpdate(whatsappConfig, replyJid, "recording");

    const base64Audio = await generateSpeechBase64(
      cleanReply,
      voiceConfig.elevenlabsVoiceId,
      voiceConfig.elevenlabsApiKey,
    );

    await sendAndSaveAudioPTT(
      whatsappConfig,
      conversationId,
      replyJid,
      cleanReply,
      base64Audio,
      "bot",
    );

    await incrementVoiceUsage(userId);
    return true;
  } catch (err) {
    logger.error("Voice generation failed, falling back to text", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export async function sendTextReply(
  whatsappPhoneId: string,
  conversationId: string,
  replyJid: string,
  cleanReply: string,
) {
  const whatsappConfig = getWhatsAppConfig(whatsappPhoneId);
  await sendPresenceUpdate(whatsappConfig, replyJid, "composing");

  await sendAndSaveMessage(
    whatsappConfig,
    conversationId,
    replyJid,
    cleanReply,
    "bot",
  );
}

export async function sendPropertyPdfs(
  propertyIds: string[],
  userId: string,
  whatsappPhoneId: string,
  conversationId: string,
  replyJid: string,
) {
  if (propertyIds.length === 0) return;

  try {
    logger.info("sendPropertyPdfs called", { propertyIds, userId });

    const propertiesWithPdf = await prisma.properties.findMany({
      where: {
        id: { in: propertyIds },
        user_id: userId,
      },
      select: {
        id: true,
        title: true,
        pdf_url: true,
        pdf_filename: true,
        pdfs: true,
      },
    });

    logger.info("Properties found for PDF send", {
      requested: propertyIds.length,
      found: propertiesWithPdf.length,
    });

    for (const prop of propertiesWithPdf) {
      // Coleta todos os PDFs: array novo (pdfs) + campo legado (pdf_url)
      const pdfList: Array<{ storagePath: string; filename: string }> = [];

      const pdfsArray = Array.isArray(prop.pdfs)
        ? (prop.pdfs as Array<{ url: string; filename?: string }>)
        : [];

      for (const pdf of pdfsArray) {
        if (pdf.url) {
          pdfList.push({
            storagePath: pdf.url,
            filename: pdf.filename ?? "imovel.pdf",
          });
        }
      }

      // Fallback para campo legado se não houver pdfs no array
      if (pdfList.length === 0 && prop.pdf_url) {
        pdfList.push({
          storagePath: prop.pdf_url,
          filename: prop.pdf_filename ?? "imovel.pdf",
        });
      }

      logger.info("PDFs to send for property", {
        propertyId: prop.id,
        count: pdfList.length,
      });

      for (const pdf of pdfList) {
        const signedUrl = await getPropertyPdfUrl(pdf.storagePath);
        logger.info("Sending PDF", {
          propertyId: prop.id,
          filename: pdf.filename,
        });
        await sendAndSaveMessage(
          getWhatsAppConfig(whatsappPhoneId),
          conversationId,
          replyJid,
          `📋 ${prop.title ?? "Detalhes do imóvel"}`,
          "bot",
          {
            type: "document",
            url: signedUrl,
            caption: `📋 ${prop.title ?? "Detalhes do imóvel"}`,
            fileName: pdf.filename,
            mimetype: "application/pdf",
          },
        );
      }
    }
  } catch (err) {
    logger.error("Failed to send property PDFs", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
