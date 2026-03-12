import { prisma } from "./db";

interface WhatsAppConfig {
  phoneId: string;
  token: string;
}

export async function sendWhatsAppMessage(config: WhatsAppConfig, to: string, text: string) {
  const url = `https://graph.facebook.com/v21.0/${config.phoneId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("WhatsApp send error:", data);
    throw new Error(data.error?.message || "Failed to send WhatsApp message");
  }

  return data;
}

export async function markAsRead(config: WhatsAppConfig, messageId: string) {
  const url = `https://graph.facebook.com/v21.0/${config.phoneId}/messages`;

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

export async function processIncomingMessage(userId: string, message: {
  from: string;
  id: string;
  text?: { body: string };
  type: string;
  timestamp: string;
  contacts?: Array<{ profile: { name: string } }>;
}) {
  const phone = message.from;
  const contactName = message.contacts?.[0]?.profile?.name || phone;
  const content = message.text?.body || "";

  let lead = await prisma.lead.findFirst({
    where: { userId, phone },
    include: { conversation: true },
  });

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        userId,
        name: contactName,
        phone,
        source: "whatsapp",
        status: "new",
        conversation: { create: { whatsappChatId: phone } },
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

  const savedMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      sender: "lead",
      content,
      type: message.type === "text" ? "text" : message.type,
      status: "delivered",
      whatsappMsgId: message.id,
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
    data: { lastContactAt: new Date() },
  });

  return { lead, conversation, message: savedMessage };
}

export async function sendAndSaveMessage(
  config: WhatsAppConfig,
  conversationId: string,
  leadPhone: string,
  content: string,
  sender: "bot" | "agent"
) {
  const waResponse = await sendWhatsAppMessage(config, leadPhone, content);
  const waMessageId = waResponse.messages?.[0]?.id;

  const message = await prisma.message.create({
    data: {
      conversationId,
      direction: "outbound",
      sender,
      content,
      type: "text",
      status: "sent",
      whatsappMsgId: waMessageId,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return message;
}
