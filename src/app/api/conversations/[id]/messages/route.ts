import { prisma } from "@/lib/db";
import { json, error, requireAuth, handleError } from "@/lib/api";
import { NextRequest } from "next/server";
import { resolveSendTarget } from "@/lib/whatsapp";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const url = req.nextUrl;
    const cursor = url.searchParams.get("cursor");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const conv = await prisma.conversation.findFirst({
      where: { id, lead: { userId: user.id } },
    });
    if (!conv) return error("Conversa não encontrada", 404);

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (conv.unreadCount > 0) {
      await prisma.conversation.update({
        where: { id },
        data: { unreadCount: 0 },
      });
    }

    return json(messages);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { content } = await req.json();

    const conv = await prisma.conversation.findFirst({
      where: { id, lead: { userId: user.id } },
      include: { lead: { include: { user: { include: { settings: true } } } } },
    });
    if (!conv) return error("Conversa não encontrada", 404);

    if (conv.status === "bot") {
      await prisma.conversation.update({
        where: { id },
        data: { status: "human" },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        direction: "outbound",
        sender: "agent",
        content,
        type: "text",
        status: "sent",
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    await prisma.lead.update({
      where: { id: conv.leadId },
      data: { lastContactAt: new Date() },
    });

    const settings = conv.lead.user.settings;
    if (settings?.whatsappPhoneId && settings?.whatsappToken) {
      try {
        const { sendWhatsAppMessage } = await import("@/lib/whatsapp");
        const replyJid = resolveSendTarget(conv.whatsappChatId, conv.lead.phone);
        if (!replyJid) {
          throw new Error(`Cannot resolve WhatsApp recipient JID for conversation ${conv.id}`);
        }

        const wa = await sendWhatsAppMessage(
          { phoneId: settings.whatsappPhoneId, token: settings.whatsappToken },
          replyJid,
          content
        );
        await prisma.message.update({
          where: { id: message.id },
          data: { whatsappMsgId: wa.key?.id ?? wa.messages?.[0]?.id },
        });
      } catch (e) {
        console.error("WhatsApp send failed:", e);
        await prisma.message.update({
          where: { id: message.id },
          data: { status: "failed" },
        });
      }
    }

    return json(message, 201);
  } catch (err) {
    return handleError(err);
  }
}
