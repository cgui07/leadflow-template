import { prisma } from "./db";
import { generateAutoReply, qualifyLead } from "./ai";
import type { AIConfig, MessageContent } from "./ai";
import { normalizeAutoReplyDelaySeconds } from "./auto-reply-delay";
import { resolveMediaContent } from "./media";
import {
  getWhatsAppConfig,
  resolveSendTarget,
  sendAndSaveMessage,
} from "./whatsapp";

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
  message: { content: string; type: string; metadata: unknown; whatsappMsgId: string | null; direction: string },
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
          source: { type: "base64", media_type: media.mimeType, data: media.base64 },
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
          source: { type: "base64", media_type: media.mimeType, data: media.base64 },
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

  const latestMessage = conversation.messages[0];

  if (
    !latestMessage ||
    latestMessage.id !== input.triggerMessageId ||
    latestMessage.direction !== "inbound"
  ) {
    return;
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
    };

    const enrichedMessages: Array<{ direction: string; content: MessageContent; sender: string }> = [];
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

    const reply = await generateAutoReply(
      aiConfig,
      conversation.lead.user.name,
      enrichedMessages,
    );

    if (!reply) {
      return;
    }

    await sendAndSaveMessage(
      getWhatsAppConfig(settings.whatsappPhoneId),
      conversation.id,
      replyJid,
      reply,
      "bot",
    );

    const messageCount = orderedMessages.length + 1;

    if (messageCount >= 3 && messageCount % 2 === 1) {
      await qualifyLead(conversation.lead.id, aiConfig);
    }

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
