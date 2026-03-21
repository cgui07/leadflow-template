import { prisma } from "@/lib/db";
import { getDefaultPipelineStageId } from "@/lib/pipeline";
import { resolveReplyJid, resolveSendTarget } from "@/lib/whatsapp-resolve";
import {
  getPhoneIdentity,
  toPhoneDigits,
  toInputJsonValue,
} from "@/lib/whatsapp-jid";
import {
  type WhatsAppConfig,
  sendWhatsAppMessage,
  sendWhatsAppMedia,
  sendWhatsAppAudioPTT,
} from "@/lib/whatsapp-client";

export async function processIncomingMessage(userId: string, message: {
  from: string;
  id: string;
  text?: string;
  type: string;
  timestamp: string;
  pushName?: string;
  metadata?: Record<string, unknown>;
}) {
  const remoteJid = message.from;
  const resolvedReplyJid = resolveReplyJid(remoteJid);
  const phone = resolvedReplyJid
    ? getPhoneIdentity(resolvedReplyJid)
    : toPhoneDigits(remoteJid) || remoteJid;
  const contactName = message.pushName || phone;
  const content = message.text || "";

  let lead = await prisma.lead.findFirst({
    where: { userId, conversation: { whatsappChatId: remoteJid } },
    include: { conversation: true },
  });

  if (!lead && resolvedReplyJid) {
    lead = await prisma.lead.findFirst({
      where: { userId, phone },
      include: { conversation: true },
    });
  }

  if (!lead) {
    const defaultPipelineStageId = await getDefaultPipelineStageId(userId);

    lead = await prisma.lead.create({
      data: {
        userId,
        name: contactName,
        phone,
        source: "whatsapp",
        status: "new",
        pipelineStageId: defaultPipelineStageId,
        conversation: { create: { whatsappChatId: remoteJid } },
      },
      include: { conversation: true },
    });

    await prisma.activity.create({
      data: {
        userId,
        leadId: lead.id,
        type: "message",
        title: "Novo lead via WhatsApp",
        description: `${contactName} enviou a primeira mensagem`,
      },
    });
  }

  const conversation = lead.conversation!;

  if (resolvedReplyJid) {
    const updates: Array<Promise<unknown>> = [];

    if (lead.phone !== phone) {
      updates.push(
        prisma.lead.update({
          where: { id: lead.id },
          data: { phone },
        })
      );
    }

    if (conversation.whatsappChatId !== remoteJid) {
      updates.push(
        prisma.conversation.update({
          where: { id: conversation.id },
          data: { whatsappChatId: remoteJid },
        })
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }

  if (message.id) {
    const existing = await prisma.message.findFirst({
      where: { conversationId: conversation.id, whatsappMsgId: message.id },
    });
    if (existing) {
      return { lead, conversation, message: existing };
    }
  }

  const savedMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      sender: "lead",
      content,
      type: message.type === "conversation" || message.type === "extendedTextMessage" ? "text" : message.type,
      status: "delivered",
      whatsappMsgId: message.id,
      metadata: toInputJsonValue(message.metadata),
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
      status: conversation.status === "closed" ? "active" : conversation.status,
    },
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      lastContactAt: new Date(),
      followUpCount: 0,
    },
  });

  return { lead, conversation, message: savedMessage };
}

export async function sendAndSaveMessage(
  config: WhatsAppConfig,
  conversationId: string,
  recipient: string,
  content: string,
  sender: "bot" | "agent",
  media?: {
    type: "image" | "video" | "audio" | "document";
    url: string;
    caption?: string;
    fileName?: string;
    mimetype?: string;
  }
) {
  let replyJid = resolveReplyJid(recipient);

  if (!replyJid) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        whatsappChatId: true,
        lead: { select: { phone: true } },
      },
    });

    replyJid = resolveSendTarget(
      recipient,
      conversation?.whatsappChatId,
      conversation?.lead?.phone
    );
  }

  if (!replyJid) {
    return null;
  }

  let waResponse;
  if (media) {
    waResponse = await sendWhatsAppMedia(config, replyJid, media.type, media.url, {
      caption: media.caption || content,
      fileName: media.fileName,
      mimetype: media.mimetype,
    });
  } else {
    waResponse = await sendWhatsAppMessage(config, replyJid, content);
  }
  const waMessageId = waResponse.key?.id ?? waResponse.messages?.[0]?.id;

  const msg = await prisma.message.create({
    data: {
      conversationId,
      direction: "outbound",
      sender,
      content: media?.caption || content,
      type: media?.type || "text",
      status: "sent",
      whatsappMsgId: waMessageId,
      metadata: toInputJsonValue(
        media
          ? {
              mediaUrl: media.url,
              mimetype: media.mimetype,
              fileName: media.fileName,
            }
          : undefined,
      ),
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return msg;
}

export async function sendAndSaveAudioPTT(
  config: WhatsAppConfig,
  conversationId: string,
  recipient: string,
  textContent: string,
  base64Audio: string,
  sender: "bot" | "agent",
) {
  let replyJid = resolveReplyJid(recipient);

  if (!replyJid) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        whatsappChatId: true,
        lead: { select: { phone: true } },
      },
    });

    replyJid = resolveSendTarget(
      recipient,
      conversation?.whatsappChatId,
      conversation?.lead?.phone,
    );
  }

  if (!replyJid) {
    return null;
  }

  const waResponse = await sendWhatsAppAudioPTT(config, replyJid, base64Audio);
  const waData = waResponse as Record<string, unknown>;
  const waMessageId =
    (waData.key as Record<string, unknown>)?.id ??
    (waData.messages as Array<Record<string, unknown>>)?.[0]?.id;

  const msg = await prisma.message.create({
    data: {
      conversationId,
      direction: "outbound",
      sender,
      content: textContent,
      type: "audio",
      status: "sent",
      whatsappMsgId: waMessageId as string | undefined,
      metadata: toInputJsonValue({ sentAsVoice: true, voiceProvider: "elevenlabs" }),
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return msg;
}
