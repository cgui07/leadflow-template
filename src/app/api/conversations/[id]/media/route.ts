import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { json, error, requireAuth, handleError } from "@/lib/api";
import { resolveSendTarget, sendWhatsAppMedia } from "@/lib/whatsapp";

const ALLOWED_TYPES = new Set(["image", "video", "audio", "document"]);
const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mediaType = formData.get("mediaType") as string | null;
    const caption = formData.get("caption") as string | null;

    if (!file) return error("Arquivo não enviado", 400);
    if (!mediaType || !ALLOWED_TYPES.has(mediaType)) {
      return error("Tipo de mídia inválido. Use: image, video, audio, document", 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return error("Arquivo muito grande. Máximo: 16MB", 400);
    }

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

    const settings = conv.lead.user.settings;
    if (!settings?.whatsappPhoneId || !settings?.whatsappToken) {
      return error("WhatsApp não configurado", 400);
    }

    const replyJid = resolveSendTarget(conv.whatsappChatId, conv.lead.phone);
    if (!replyJid) {
      return error("Não foi possível resolver o destinatário", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const waResponse = await sendWhatsAppMedia(
      { phoneId: settings.whatsappPhoneId, token: settings.whatsappToken },
      replyJid,
      mediaType as "image" | "video" | "audio" | "document",
      dataUrl,
      { caption: caption || undefined, fileName: file.name, mimetype: file.type }
    );

    const waMessageId = waResponse.key?.id ?? waResponse.messages?.[0]?.id;

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        direction: "outbound",
        sender: "agent",
        content: caption || `[${mediaType === "image" ? "Imagem" : mediaType === "video" ? "Vídeo" : mediaType === "audio" ? "Áudio" : "Documento"} enviado]`,
        type: mediaType,
        status: "sent",
        whatsappMsgId: waMessageId,
        metadata: {
          mediaUrl: dataUrl,
          mimetype: file.type,
          fileName: file.name,
          fileSize: file.size,
        },
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

    return json(message, 201);
  } catch (err) {
    return handleError(err);
  }
}
