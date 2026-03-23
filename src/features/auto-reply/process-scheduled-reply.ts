import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { AIConfig, MessageContent } from "@/lib/ai";
import { generateAutoReply, qualifyLead } from "@/lib/ai";
import { enrichMessageWithMedia } from "./enrich-messages";
import { normalizeAutoReplyDelaySeconds } from "@/lib/auto-reply-delay";
import {
  detectIntentSignals,
  getVoiceUsageThisMonth,
} from "@/lib/voice-reply";
import {
  handleConfirmationReplyIfNeeded,
  handleSchedulingIfNeeded,
} from "@/lib/scheduling-handler";
import {
  extractPdfTags,
  wait,
  sendVoiceReply,
  sendTextReply,
  sendPropertyPdfs,
} from "./reply-sender";
import {
  getWhatsAppConfig,
  resolveSendTarget,
  sendAndSaveMessage,
  sendPresenceUpdate,
} from "@/lib/whatsapp";

export interface ProcessScheduledAutoReplyInput {
  conversationId: string;
  triggerMessageId: string;
  delaySeconds: number;
  remoteJid: string;
  remoteJidAlt?: string | null;
  wasActiveConversation: boolean;
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
    logger.warn("Skipping reply because the target JID could not be resolved", {
      remoteJid: input.remoteJid,
    });
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
      logger.info("Properties found", {
        count: userProperties.length,
        userId: conversation.lead.userId,
      });
      propertiesCatalog = userProperties.map((p) => ({
        ...p,
        id: p.id,
        price: p.price?.toString() ?? null,
        area: p.area?.toString() ?? null,
        hasPdf: Boolean(p.pdf_url) || (Array.isArray(p.pdfs) && (p.pdfs as unknown[]).length > 0),
      }));
    } catch (err) {
      logger.error("Failed to fetch properties", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // ── Determine voice decision BEFORE generating AI reply ─────────────
    const elevenlabsApiKey = env.ELEVENLABS_API_KEY;
    const elevenlabsVoiceId = (settings as Record<string, unknown>)
      .elevenlabsVoiceId as string | null | undefined;
    const voiceReplyEnabled = (settings as Record<string, unknown>)
      .voiceReplyEnabled as boolean | null | undefined;
    const voiceReplyMonthlyLimit = (settings as Record<string, unknown>)
      .voiceReplyMonthlyLimit as number | null | undefined;

    let willUseVoice = false;

    if (elevenlabsApiKey && elevenlabsVoiceId && voiceReplyEnabled) {
      const recentOutbound = orderedMessages
        .filter((m) => m.direction === "outbound")
        .map((m) => ({ type: m.type }));

      const isFirstBotReply = recentOutbound.length === 0;
      const currentMonthUsage = await getVoiceUsageThisMonth(
        conversation.lead.userId,
      );
      const withinLimit = currentMonthUsage < (voiceReplyMonthlyLimit ?? 50);
      const noRecentAudio = recentOutbound
        .slice(0, 3)
        .every((m) => m.type !== "audio");

      if (withinLimit && noRecentAudio) {
        if (isFirstBotReply) {
          willUseVoice = true;
        } else {
          const { hasHighIntent } = detectIntentSignals(latestInbound.content);
          willUseVoice = hasHighIntent;
        }
      }
    }

    const whatsappConfig = getWhatsAppConfig(settings.whatsappPhoneId!);
    await sendPresenceUpdate(
      whatsappConfig,
      replyJid,
      willUseVoice ? "recording" : "composing",
    );

    const reply = await generateAutoReply(
      aiConfig,
      conversation.lead.user.name,
      enrichedMessages,
      propertiesCatalog.length > 0 ? propertiesCatalog : undefined,
      willUseVoice,
    );

    if (!reply) {
      return;
    }

    logger.info("AI raw reply", { reply });

    const { cleanReply, propertyIds: pdfPropertyIds } = extractPdfTags(reply);

    logger.info("PDF extraction result", { pdfPropertyIds, cleanReply });

    const messageCount = orderedMessages.length + 1;
    let sentAsVoice = false;

    if (willUseVoice && elevenlabsApiKey && elevenlabsVoiceId) {
      sentAsVoice = await sendVoiceReply(
        {
          elevenlabsApiKey,
          elevenlabsVoiceId,
          voiceReplyMonthlyLimit: voiceReplyMonthlyLimit ?? 50,
        },
        settings.whatsappPhoneId!,
        conversation.id,
        replyJid,
        cleanReply,
        latestInbound.content,
        orderedMessages.map((m) => ({ direction: m.direction, type: m.type })),
        conversation.lead.userId,
      );
    }

    if (!sentAsVoice) {
      await sendTextReply(
        settings.whatsappPhoneId!,
        conversation.id,
        replyJid,
        cleanReply,
      );
    }

    await sendPropertyPdfs(
      pdfPropertyIds,
      conversation.lead.userId,
      settings.whatsappPhoneId!,
      conversation.id,
      replyJid,
    );

    if (messageCount >= 3 && messageCount % 2 === 1) {
      await qualifyLead(conversation.lead.id, aiConfig);
    }

    const schedulingMessages = enrichedMessages.map((m) => ({
      direction: m.direction,
      content:
        typeof m.content === "string"
          ? m.content
          : m.content
              .filter(
                (p): p is { type: "text"; text: string } => p.type === "text",
              )
              .map((p) => p.text)
              .join(" ") || m.content.toString(),
    }));
    schedulingMessages.push({
      direction: "outbound",
      content: cleanReply,
    });

    await handleSchedulingIfNeeded({
      userId: conversation.lead.userId,
      leadId: conversation.lead.id,
      leadName: conversation.lead.name,
      conversationId: conversation.id,
      messages: schedulingMessages,
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
