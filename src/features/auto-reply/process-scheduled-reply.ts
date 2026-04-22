import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { AIConfig, MessageContent } from "@/lib/ai";
import { generateAutoReply, qualifyLead } from "@/lib/ai";
import { enrichMessageWithMedia } from "./enrich-messages";
import { handleCampaignReply } from "@/lib/campaign-reply";
import { executeBotFlow, parseBotFlow } from "@/lib/bot-flow";
import { findMatchingCustomAudio } from "@/lib/custom-audio-matcher";
import { normalizeAutoReplyDelaySeconds } from "@/lib/auto-reply-delay";
import { detectIntentSignals, getVoiceUsageThisMonth } from "@/lib/voice-reply";
import { sendAndSaveAudioPTT } from "@/features/conversations/incoming-message";
import {
  getWhatsAppConfig,
  resolveSendTarget,
  sendPresenceUpdate,
} from "@/lib/whatsapp";
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
  logger.info("[auto-reply] start", {
    conversationId: input.conversationId,
    triggerMessageId: input.triggerMessageId,
    delaySeconds: input.delaySeconds,
  });

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
    logger.warn("[auto-reply] abort: conversation not found", {
      conversationId: input.conversationId,
    });
    return;
  }

  const settings = conversation.lead.user.settings;

  if (!settings?.whatsappPhoneId || !settings.autoReplyEnabled) {
    logger.warn("[auto-reply] abort: settings missing phoneId or disabled", {
      hasPhoneId: Boolean(settings?.whatsappPhoneId),
      autoReplyEnabled: settings?.autoReplyEnabled,
    });
    return;
  }

  if (conversation.status !== "bot" && conversation.status !== "active") {
    logger.warn("[auto-reply] abort: conversation status not bot/active", {
      status: conversation.status,
    });
    return;
  }

  const latestInbound = conversation.messages.find(
    (m) => m.direction === "inbound",
  );

  if (!latestInbound || latestInbound.id !== input.triggerMessageId) {
    logger.warn("[auto-reply] abort: trigger is not latest inbound", {
      latestInboundId: latestInbound?.id,
      triggerMessageId: input.triggerMessageId,
    });
    return;
  }

  const previousLastRepliedMessageId = conversation.lastRepliedMessageId;

  const claimed = await prisma.conversation.updateMany({
    where: {
      id: input.conversationId,
      OR: [
        { lastRepliedMessageId: null },
        { lastRepliedMessageId: { not: input.triggerMessageId } },
      ],
    },
    data: { lastRepliedMessageId: input.triggerMessageId },
  });
  if (claimed.count === 0) {
    logger.warn("[auto-reply] abort: claim failed (already replied)", {
      triggerMessageId: input.triggerMessageId,
    });
    return;
  }

  logger.info("[auto-reply] claim ok, proceeding", {
    hasAiKey: Boolean(settings.aiApiKey),
    aiProvider: settings.aiProvider,
    aiModel: settings.aiModel,
  });

  async function releaseClaim(reason: string) {
    const released = await prisma.conversation.updateMany({
      where: {
        id: input.conversationId,
        lastRepliedMessageId: input.triggerMessageId,
      },
      data: {
        lastRepliedMessageId: previousLastRepliedMessageId ?? null,
      },
    });

    logger.warn("[auto-reply] claim released", {
      conversationId: input.conversationId,
      triggerMessageId: input.triggerMessageId,
      reason,
      released: released.count > 0,
      previousLastRepliedMessageId,
    });
  }

  let replySent = false;

  try {
    // ── Bot flow gate ─────────────────────────────────────────────────────────
    if (settings.botFlowEnabled && settings.botFlow) {
      const flow = parseBotFlow(settings.botFlow);
      if (flow) {
        const replyJidBot = resolveSendTarget(
          input.remoteJidAlt,
          input.remoteJid,
          conversation.whatsappChatId,
          conversation.lead.phone,
        );
        if (replyJidBot) {
          const handled = await executeBotFlow({
            flow,
            conversationId: conversation.id,
            botCurrentNodeId: conversation.botCurrentNodeId ?? null,
            inboundText: typeof latestInbound.content === "string" ? latestInbound.content : "",
            whatsappPhoneId: settings.whatsappPhoneId!,
            replyJid: replyJidBot,
          });
          if (handled) return;
        } else {
          return;
        }
      }
    }

    if (conversation.awaitingCampaignResponse) {
      const messageText =
        typeof latestInbound.content === "string" ? latestInbound.content : "";
      const handled = await handleCampaignReply(
        conversation.id,
        messageText,
        conversation.lead.user.id,
        conversation.lead.id,
        conversation.whatsappChatId ??
          `${conversation.lead.phone}@s.whatsapp.net`,
      );
      if (handled) return;
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
    await releaseClaim("reply target could not be resolved");
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

    // ── Custom audio check — uses enriched content so audio transcriptions are included
    const customAudios = await prisma.customAudio.findMany({
      where: { userId: conversation.lead.userId },
      select: { id: true, context: true, audioBase64: true, mimeType: true },
    });

    logger.info("[custom-audio] check", { count: customAudios.length, userId: conversation.lead.userId });

    if (customAudios.length > 0) {
      const enrichedTrigger = enrichedMessages.find(
        (m) => m.direction === "inbound",
      );
      const triggerContent = enrichedTrigger?.content ?? latestInbound.content;

      logger.info("[custom-audio] evaluating", { triggerContent: typeof triggerContent === "string" ? triggerContent.slice(0, 100) : "[multipart]" });

      const matched = await findMatchingCustomAudio(
        aiConfig,
        triggerContent,
        enrichedMessages.map((m) => ({ direction: m.direction, content: m.content })),
        customAudios,
      );

      if (matched) {
        logger.info("[auto-reply] sending custom audio", { audioId: matched.id });
        const whatsappCfg = getWhatsAppConfig(settings.whatsappPhoneId!);
        await sendPresenceUpdate(whatsappCfg, replyJid, "recording");
        await sendAndSaveAudioPTT(
          whatsappCfg,
          conversation.id,
          replyJid,
          "",
          matched.audioBase64,
          "bot",
        );
        replySent = true;
        return;
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
      pdfCategories?: string[];
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
      propertiesCatalog = userProperties.map((p) => {
        const pdfsArr = Array.isArray(p.pdfs)
          ? (p.pdfs as Array<{ category?: string }>)
          : [];
        const pdfCategories = pdfsArr
          .map((pdf) => pdf.category)
          .filter((c): c is string => Boolean(c));
        return {
          ...p,
          id: p.id,
          price: p.price?.toString() ?? null,
          area: p.area?.toString() ?? null,
          hasPdf: Boolean(p.pdf_url) || pdfsArr.length > 0,
          pdfCategories: pdfCategories.length > 0 ? pdfCategories : undefined,
        };
      });
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

    logger.info("[auto-reply] calling generateAutoReply", {
      messageCount: enrichedMessages.length,
      propertiesCount: propertiesCatalog.length,
      willUseVoice,
    });

    const reply = await generateAutoReply(
      aiConfig,
      conversation.lead.user.name,
      enrichedMessages,
      propertiesCatalog.length > 0 ? propertiesCatalog : undefined,
      willUseVoice,
    );

    if (!reply) {
      logger.warn("[auto-reply] abort: generateAutoReply returned null/empty");
      await releaseClaim("generateAutoReply returned null/empty");
      return;
    }

    logger.info("[auto-reply] AI reply generated", { length: reply.length });

    logger.info("AI raw reply", { reply });
    logger.error("[DEBUG] AI reply + catalog", {
      reply,
      propertiesCount: propertiesCatalog.length,
      properties: propertiesCatalog.map((p) => ({
        id: p.id,
        title: p.title,
        pdfCategories: p.pdfCategories,
      })),
    });

    const { cleanReply, pdfRequests } = extractPdfTags(reply);

    logger.error("[DEBUG] PDF extraction", { pdfRequests, cleanReply });
    logger.info("PDF extraction result", { pdfRequests, cleanReply });

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
      logger.info("[auto-reply] sending text reply", {
        phoneId: settings.whatsappPhoneId,
        replyJid,
        length: cleanReply.length,
      });
      await sendTextReply(
        settings.whatsappPhoneId!,
        conversation.id,
        replyJid,
        cleanReply,
      );
      logger.info("[auto-reply] text reply sent OK");
    }
    replySent = true;

    await sendPropertyPdfs(
      pdfRequests,
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

    logger.warn("[auto-reply] abort: no aiApiKey configured");
    await releaseClaim("no aiApiKey configured");
  } catch (err) {
    if (!replySent) {
      await releaseClaim(
        err instanceof Error ? err.message : "auto-reply failed before send",
      );
    }
    throw err;
  }
}
