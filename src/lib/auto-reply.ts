import { prisma } from "./db";
import { resolveMediaContent } from "./media";
import { getPropertyPdfUrl } from "./storage";
import { generateSpeechBase64 } from "./elevenlabs";
import type { AIConfig, MessageContent } from "./ai";
import { generateAutoReply, qualifyLead } from "./ai";
import { normalizeAutoReplyDelaySeconds } from "./auto-reply-delay";
import {
  handleConfirmationReplyIfNeeded,
  handleSchedulingIfNeeded,
} from "./scheduling-handler";
import {
  shouldUseVoiceReply,
  getVoiceUsageThisMonth,
  incrementVoiceUsage,
} from "./voice-reply";
import {
  getWhatsAppConfig,
  resolveSendTarget,
  sendAndSaveMessage,
  sendAndSaveAudioPTT,
} from "./whatsapp";

function extractPdfTags(reply: string): { cleanReply: string; propertyIds: string[] } {
  const regex = /\[ENVIAR_PDF:([a-f0-9-]+)\]/gi;
  const propertyIds: string[] = [];
  let match;
  while ((match = regex.exec(reply)) !== null) {
    propertyIds.push(match[1]);
  }
  const cleanReply = reply.replace(regex, "").trim();
  return { cleanReply, propertyIds };
}

interface ProcessScheduledAutoReplyInput {
  conversationId: string;
  triggerMessageId: string;
  delaySeconds: number;
  remoteJid: string;
  remoteJidAlt?: string | null;
  wasActiveConversation: boolean;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const MEDIA_TYPES = new Set(["image", "audio", "document"]);

async function enrichMessageWithMedia(
  message: {
    content: string;
    type: string;
    metadata: unknown;
    whatsappMsgId: string | null;
    direction: string;
  },
  instanceName: string,
  aiConfig: AIConfig,
): Promise<MessageContent> {
  if (message.direction !== "inbound" || !MEDIA_TYPES.has(message.type)) {
    return message.content;
  }

  const meta = (message.metadata || {}) as Record<string, unknown>;

  try {
    const media = await resolveMediaContent({
      mediaType: message.type,
      base64Data: (meta.base64 as string) || null,
      mimeType: (meta.mimetype as string) || "application/octet-stream",
      fileName: (meta.fileName as string) || undefined,
      seconds: (meta.seconds as number) || undefined,
      instanceName,
      messageId: message.whatsappMsgId || "",
      aiConfig,
    });

    if (!media) return message.content;

    if (media.type === "audio" && media.transcription) {
      return `[Transcrição do áudio]: ${media.transcription}`;
    }

    if (media.type === "image") {
      const parts: MessageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: media.mimeType,
            data: media.base64,
          },
        },
      ];
      if (message.content && message.content !== "[Imagem recebida]") {
        parts.push({ type: "text", text: message.content });
      } else {
        parts.push({ type: "text", text: "O cliente enviou esta imagem." });
      }
      return parts;
    }

    if (media.type === "document") {
      const parts: MessageContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: media.mimeType,
            data: media.base64,
          },
        },
        {
          type: "text",
          text: media.fileName
            ? `O cliente enviou o documento: ${media.fileName}`
            : "O cliente enviou um documento.",
        },
      ];
      return parts;
    }
  } catch (err) {
    console.error("[auto-reply] Media enrichment failed:", err);
  }

  return message.content;
}

export async function processScheduledAutoReply(
  input: ProcessScheduledAutoReplyInput,
) {
  const delaySeconds = normalizeAutoReplyDelaySeconds(input.delaySeconds);

  if (delaySeconds > 0) {
    await wait(delaySeconds * 1000);
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: input.conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      lead: {
        include: {
          user: {
            include: {
              settings: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return;
  }

  const settings = conversation.lead.user.settings;

  if (!settings?.whatsappPhoneId || !settings.autoReplyEnabled) {
    return;
  }

  if (conversation.status !== "bot" && conversation.status !== "active") {
    return;
  }

  const latestInbound = conversation.messages.find(
    (m) => m.direction === "inbound",
  );

  if (!latestInbound || latestInbound.id !== input.triggerMessageId) {
    return;
  }

  // ── Appointment confirmation short-circuit ────────────────────────────────
  // If the client replied SIM/NÃO to a pending visit confirmation, handle it
  // directly and skip the normal AI reply.
  const replyJidEarly = resolveSendTarget(
    input.remoteJidAlt,
    input.remoteJid,
    conversation.whatsappChatId,
    conversation.lead.phone,
  );
  if (replyJidEarly) {
    const handled = await handleConfirmationReplyIfNeeded(
      conversation.lead.id,
      conversation.lead.user.id,
      conversation.id,
      replyJidEarly,
      latestInbound.content,
      settings,
    );
    if (handled) return;
  }

  const replyJid = resolveSendTarget(
    input.remoteJidAlt,
    input.remoteJid,
    conversation.whatsappChatId,
    conversation.lead.phone,
  );

  if (!replyJid) {
    console.warn(
      "[auto-reply] Skipping reply because the target JID could not be resolved:",
      input.remoteJid,
    );
    return;
  }

  const orderedMessages = [...conversation.messages].reverse();

  if (settings.aiApiKey) {
    const aiConfig: AIConfig = {
      provider: settings.aiProvider,
      apiKey: settings.aiApiKey,
      model: settings.aiModel,
      transcriptionApiKey: settings.openaiTranscriptionKey ?? undefined,
    };

    const enrichedMessages: Array<{
      direction: string;
      content: MessageContent;
      sender: string;
    }> = [];
    for (const message of orderedMessages) {
      if (message.id === input.triggerMessageId) {
        const enrichedContent = await enrichMessageWithMedia(
          message,
          settings.whatsappPhoneId!,
          aiConfig,
        );
        enrichedMessages.push({
          direction: message.direction,
          content: enrichedContent,
          sender: message.sender,
        });
      } else {
        enrichedMessages.push({
          direction: message.direction,
          content: message.content,
          sender: message.sender,
        });
      }
    }

    let propertiesCatalog: Array<{
      id?: string;
      title: string | null;
      type: string | null;
      purpose: string | null;
      price: string | null;
      area: string | null;
      bedrooms: number | null;
      bathrooms: number | null;
      parking_spots: number | null;
      neighborhood: string | null;
      city: string | null;
      state: string | null;
      amenities: string[];
      description: string | null;
      hasPdf?: boolean;
    }> = [];

    try {
      const userProperties = await prisma.properties.findMany({
        where: { user_id: conversation.lead.userId },
        orderBy: { created_at: "desc" },
        take: 20,
      });
      console.log("[auto-reply] properties found:", userProperties.length, "for userId:", conversation.lead.userId);
      propertiesCatalog = userProperties.map((p) => ({
        ...p,
        id: p.id,
        price: p.price?.toString() ?? null,
        area: p.area?.toString() ?? null,
        hasPdf: Boolean(p.pdf_url),
      }));
    } catch (err) {
      console.error("[auto-reply] failed to fetch properties:", err);
    }

    const reply = await generateAutoReply(
      aiConfig,
      conversation.lead.user.name,
      enrichedMessages,
      propertiesCatalog.length > 0 ? propertiesCatalog : undefined,
    );

    if (!reply) {
      return;
    }

    // Extract [ENVIAR_PDF:id] tags from AI reply
    const { cleanReply, propertyIds: pdfPropertyIds } = extractPdfTags(reply);

    const messageCount = orderedMessages.length + 1;
    let sentAsVoice = false;

    // Attempt voice reply when ElevenLabs is configured
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenlabsVoiceId = (settings as Record<string, unknown>).elevenlabsVoiceId as string | null | undefined;
    const voiceReplyEnabled = (settings as Record<string, unknown>).voiceReplyEnabled as boolean | null | undefined;
    const voiceReplyMonthlyLimit = (settings as Record<string, unknown>).voiceReplyMonthlyLimit as number | null | undefined;

    if (elevenlabsApiKey && elevenlabsVoiceId && voiceReplyEnabled) {
      const recentOutbound = orderedMessages
        .filter((m) => m.direction === "outbound")
        .map((m) => ({ type: m.type }));

      const isFirstBotReply = recentOutbound.length === 0;
      const currentMonthUsage = await getVoiceUsageThisMonth(conversation.lead.userId);

      const decision = shouldUseVoiceReply({
        replyText: cleanReply,
        inboundText: latestInbound.content,
        isFirstBotReply,
        recentOutboundMessages: recentOutbound,
        voiceEnabled: true,
        monthlyLimit: voiceReplyMonthlyLimit ?? 50,
        currentMonthUsage,
      });

      console.log(
        "[auto-reply] Voice decision:",
        decision.useVoice,
        decision.reason,
        `(usage: ${currentMonthUsage}/${voiceReplyMonthlyLimit ?? 50})`,
      );

      if (decision.useVoice) {
        try {
          const base64Audio = await generateSpeechBase64(cleanReply, elevenlabsVoiceId, elevenlabsApiKey);

          await sendAndSaveAudioPTT(
            getWhatsAppConfig(settings.whatsappPhoneId!),
            conversation.id,
            replyJid,
            cleanReply,
            base64Audio,
            "bot",
          );

          await incrementVoiceUsage(conversation.lead.userId);
          sentAsVoice = true;
        } catch (err) {
          console.error("[auto-reply] Voice generation failed, falling back to text:", err);
        }
      }
    }

    if (!sentAsVoice) {
      await sendAndSaveMessage(
        getWhatsAppConfig(settings.whatsappPhoneId!),
        conversation.id,
        replyJid,
        cleanReply,
        "bot",
      );
    }

    // Send property PDFs mentioned in the AI reply
    if (pdfPropertyIds.length > 0) {
      try {
        const propertiesWithPdf = await prisma.properties.findMany({
          where: {
            id: { in: pdfPropertyIds },
            user_id: conversation.lead.userId,
            pdf_url: { not: null },
          },
          select: { id: true, title: true, pdf_url: true, pdf_filename: true },
        });

        for (const prop of propertiesWithPdf) {
          const signedUrl = await getPropertyPdfUrl(prop.pdf_url!);
          await sendAndSaveMessage(
            getWhatsAppConfig(settings.whatsappPhoneId!),
            conversation.id,
            replyJid,
            `📋 ${prop.title ?? "Detalhes do imóvel"}`,
            "bot",
            {
              type: "document",
              url: signedUrl,
              caption: `📋 ${prop.title ?? "Detalhes do imóvel"}`,
              fileName: prop.pdf_filename ?? "imovel.pdf",
              mimetype: "application/pdf",
            },
          );
        }
      } catch (err) {
        console.error("[auto-reply] Failed to send property PDFs:", err);
      }
    }

    if (messageCount >= 3 && messageCount % 2 === 1) {
      await qualifyLead(conversation.lead.id, aiConfig);
    }

    // ── Scheduling intent detection ─────────────────────────────────────────
    // Runs after the AI reply so it never blocks the main response.
    // Only fires when there is an open "visit" LeadAction for this lead.
    await handleSchedulingIfNeeded({
      userId: conversation.lead.userId,
      leadId: conversation.lead.id,
      leadName: conversation.lead.name,
      conversationId: conversation.id,
      messages: orderedMessages.map((m) => ({
        direction: m.direction,
        content: m.content,
      })),
      replyJid,
      aiConfig,
      settings,
    });

    return;
  }

  if (!input.wasActiveConversation || !settings.greetingMessage) {
    return;
  }

  await sendAndSaveMessage(
    getWhatsAppConfig(settings.whatsappPhoneId),
    conversation.id,
    replyJid,
    settings.greetingMessage,
    "bot",
  );
}
