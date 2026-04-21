import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateConversationSummary } from "@/lib/ai";
import { processScheduledAutoReply } from "@/lib/auto-reply";
import { getWhatsAppConfig, resolveSendTarget } from "@/lib/whatsapp";
import type {
  ConversationItem,
  ConversationSummary,
  MessageItem,
  MessageMetadata,
} from "./contracts";

function mapMessageMetadata(value: unknown): MessageMetadata | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const output: MessageMetadata = {};

  if (typeof input.mediaUrl === "string") output.mediaUrl = input.mediaUrl;
  if (typeof input.mimetype === "string") output.mimetype = input.mimetype;
  if (typeof input.fileName === "string") output.fileName = input.fileName;
  if (typeof input.fileSize === "number") output.fileSize = input.fileSize;
  if (typeof input.caption === "string") output.caption = input.caption;
  if (typeof input.seconds === "number") output.seconds = input.seconds;
  if (typeof input.width === "number") output.width = input.width;
  if (typeof input.height === "number") output.height = input.height;

  return Object.keys(output).length ? output : null;
}

function mapMessage(message: {
  id: string;
  direction: string;
  sender: string;
  content: string;
  type: string;
  status: string;
  createdAt: Date;
  metadata: unknown;
}): MessageItem {
  return {
    id: message.id,
    direction: message.direction,
    sender: message.sender,
    content: message.content,
    type: message.type,
    status: message.status,
    createdAt: message.createdAt.toISOString(),
    metadata: mapMessageMetadata(message.metadata),
  };
}

export async function listConversations(userId: string, search?: string | null) {
  const where: Record<string, unknown> = { lead: { userId } };

  if (search?.trim()) {
    where.lead = {
      userId,
      OR: [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { phone: { contains: search.trim() } },
      ],
    };
  }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatarUrl: true,
          score: true,
          status: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          direction: true,
          sender: true,
          createdAt: true,
        },
      },
    },
  });

  return conversations.map<ConversationItem>((conversation) => ({
    id: conversation.id,
    status: conversation.status,
    unreadCount: conversation.unreadCount,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    lead: {
      id: conversation.lead.id,
      name: conversation.lead.name,
      phone: conversation.lead.phone,
      avatarUrl: conversation.lead.avatarUrl,
      score: conversation.lead.score,
      status: conversation.lead.status,
    },
    messages: conversation.messages.map((message) => ({
      id: message.id,
      content: message.content,
      direction: message.direction,
      sender: message.sender,
      createdAt: message.createdAt.toISOString(),
    })),
  }));
}

export async function listConversationMessages(
  userId: string,
  conversationId: string,
  options?: { cursor?: string | null; limit?: number },
) {
  const limit = options?.limit
    ? Math.min(Math.max(options.limit, 1), 100)
    : 50;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, lead: { userId } },
  });

  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  if (conversation.unreadCount > 0) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
  }

  return messages.map(mapMessage);
}

export async function updateConversationStatus(
  userId: string,
  conversationId: string,
  status: unknown,
) {
  if (status !== "bot" && status !== "human") {
    throw new Error("CONVERSATION_STATUS_INVALID");
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, lead: { userId } },
  });

  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { status },
  });

  if (
    status === "bot" &&
    conversation.status !== "bot" &&
    conversation.whatsappChatId
  ) {
    const latestInbound = await prisma.message.findFirst({
      where: { conversationId, direction: "inbound" },
      orderBy: { createdAt: "desc" },
    });

    if (
      latestInbound &&
      latestInbound.id !== updated.lastRepliedMessageId
    ) {
      const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { auto_reply_delay_seconds: true },
      });

      logger.info("[auto-reply] catch-up on bot re-activation", {
        conversationId,
        triggerMessageId: latestInbound.id,
      });

      processScheduledAutoReply({
        conversationId,
        triggerMessageId: latestInbound.id,
        delaySeconds: settings?.auto_reply_delay_seconds ?? 0,
        remoteJid: updated.whatsappChatId!,
        remoteJidAlt: null,
        wasActiveConversation: false,
      }).catch((err) => {
        logger.error("[auto-reply] catch-up failed", {
          conversationId,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  }

  return updated;
}

export async function sendConversationMessage(
  userId: string,
  conversationId: string,
  input: Record<string, unknown>,
) {
  const content =
    typeof input.content === "string" ? input.content.trim() : "";

  if (!content) {
    throw new Error("CONVERSATION_MESSAGE_REQUIRED");
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, lead: { userId } },
    include: { lead: { include: { user: { include: { settings: true } } } } },
  });

  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  if (conversation.status === "bot") {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "human" },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      direction: "outbound",
      sender: "agent",
      content,
      type: "text",
      status: "sent",
    },
  });

  await Promise.all([
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
    prisma.lead.update({
      where: { id: conversation.leadId },
      data: { lastContactAt: new Date() },
    }),
  ]);

  const settings = conversation.lead.user.settings;
  if (settings?.whatsappPhoneId) {
    try {
      const { sendWhatsAppMessage } = await import("@/lib/whatsapp");
      const replyJid = resolveSendTarget(
        conversation.whatsappChatId,
        conversation.lead.phone,
      );

      if (!replyJid) {
        throw new Error(
          `Cannot resolve WhatsApp recipient JID for conversation ${conversation.id}`,
        );
      }

      const waResponse = await sendWhatsAppMessage(
        getWhatsAppConfig(settings.whatsappPhoneId),
        replyJid,
        content,
      );

      await prisma.message.update({
        where: { id: message.id },
        data: {
          whatsappMsgId: waResponse.key?.id ?? waResponse.messages?.[0]?.id,
        },
      });
    } catch (error) {
      logger.error("WhatsApp send failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      await prisma.message.update({
        where: { id: message.id },
        data: { status: "failed" },
      });
    }
  }

  return mapMessage({
    ...message,
    metadata: message.metadata,
  });
}

export async function generateSummary(
  userId: string,
  conversationId: string,
): Promise<ConversationSummary> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, lead: { userId } },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
      lead: { include: { user: { include: { settings: true } } } },
    },
  });

  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  if (!conversation.messages.length) {
    throw new Error("CONVERSATION_EMPTY");
  }

  const settings = conversation.lead.user.settings;
  if (!settings?.aiProvider || !settings.aiApiKey) {
    throw new Error("CONVERSATION_AI_NOT_CONFIGURED");
  }

  const summary = await generateConversationSummary(
    {
      provider: settings.aiProvider,
      apiKey: settings.aiApiKey,
      model: settings.aiModel || "",
    },
    conversation.messages,
  );

  if (!summary) {
    throw new Error("CONVERSATION_SUMMARY_FAILED");
  }

  return summary;
}
