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

export interface PdfRequest {
  propertyId: string;
  category?: string;
}

export function extractPdfTags(reply: string): {
  cleanReply: string;
  propertyIds: string[];
  pdfRequests: PdfRequest[];
} {
  const regex = /\[ENVIAR_PDF:([a-f0-9-]+)(?::([A-Z_]+))?\]/gi;
  const propertyIds: string[] = [];
  const pdfRequests: PdfRequest[] = [];
  let match;
  while ((match = regex.exec(reply)) !== null) {
    const propertyId = match[1];
    const category = match[2] || undefined;
    if (!propertyIds.includes(propertyId)) propertyIds.push(propertyId);
    pdfRequests.push({ propertyId, category });
  }
  const cleanReply = reply.replace(regex, "").trim();
  return { cleanReply, propertyIds, pdfRequests };
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
  pdfRequests: PdfRequest[],
  userId: string,
  whatsappPhoneId: string,
  conversationId: string,
  replyJid: string,
) {
  if (pdfRequests.length === 0) return;

  const propertyIds = [...new Set(pdfRequests.map((r) => r.propertyId))];

  try {
    logger.info("sendPropertyPdfs called", { pdfRequests, userId });

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
      const requestedCategories = pdfRequests
        .filter((r) => r.propertyId === prop.id)
        .map((r) => r.category);

      const pdfsArray = Array.isArray(prop.pdfs)
        ? (prop.pdfs as Array<{ url: string; filename?: string; category?: string }>)
        : [];

      const pdfList: Array<{ storagePath: string; filename: string }> = [];

      for (const pdf of pdfsArray) {
        if (!pdf.url) continue;
        const hasCategory = requestedCategories.some((c) => c != null);
        if (hasCategory) {
          if (requestedCategories.includes(pdf.category)) {
            pdfList.push({
              storagePath: pdf.url,
              filename: pdf.filename ?? "imovel.pdf",
            });
          }
        } else {
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
        requestedCategories,
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
