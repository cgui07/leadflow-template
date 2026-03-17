import { prisma } from "@/lib/db";
import { scheduleFollowUp } from "@/lib/followup";
import { mapEvolutionState } from "@/lib/evolution";
import { processScheduledAutoReply } from "@/lib/auto-reply";
import { after, NextRequest, NextResponse } from "next/server";
import { processIncomingMessage, rememberMapping } from "@/lib/whatsapp";

const INBOUND_MESSAGE_EVENTS = new Set(["messages.upsert", "MESSAGES_UPSERT"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const instanceName = body.instance || body.instanceName;
    const token =
      req.headers.get("x-webhook-token") ||
      req.nextUrl.searchParams.get("token");

    if (!instanceName) {
      return NextResponse.json({ ok: true });
    }

    const settings = await prisma.userSettings.findFirst({
      where: { whatsappPhoneId: instanceName },
      include: { user: true },
    });

    if (!settings) {
      console.error("No user found for instance:", instanceName);
      return NextResponse.json({ ok: true });
    }

    if (
      settings.whatsappWebhookToken &&
      settings.whatsappWebhookToken !== token
    ) {
      return NextResponse.json(
        { error: "Invalid webhook token" },
        { status: 401 },
      );
    }

    const event = body.event;
    const data = body.data;
    const key = data?.key;
    rememberMapping(data);

    if (event === "CONNECTION_UPDATE") {
      const state = data?.state || data?.instance?.state;
      return NextResponse.json({
        ok: true,
        status: mapEvolutionState(state),
      });
    }

    if (!INBOUND_MESSAGE_EVENTS.has(event)) {
      return NextResponse.json({ ok: true });
    }

    console.log(
      "[webhook] Full payload:",
      JSON.stringify(body).substring(0, 500),
    );

    if (key?.remoteJid?.endsWith("@lid")) {
      console.log(
        "[webhook] LID inbound fields:",
        JSON.stringify({
          remoteJid: key.remoteJid ?? null,
          remoteJidAlt: key.remoteJidAlt ?? data.remoteJidAlt ?? null,
          participant: key.participant ?? null,
          participantAlt: key.participantAlt ?? data.participantAlt ?? null,
          senderPn: key.senderPn ?? data.senderPn ?? null,
          participantPn: key.participantPn ?? data.participantPn ?? null,
        }),
      );
    }

    if (key?.fromMe) {
      return NextResponse.json({ ok: true });
    }

    const userId = settings.userId;
    const messageType = data.messageType || "conversation";
    let textContent = "";
    let mediaType: string | undefined;
    let mediaMetadata: Record<string, unknown> | undefined;

    if (data.message?.conversation) {
      textContent = data.message.conversation;
    } else if (data.message?.extendedTextMessage?.text) {
      textContent = data.message.extendedTextMessage.text;
    } else if (data.message?.audioMessage) {
      mediaType = "audio";
      textContent = "[Áudio recebido]";
      mediaMetadata = {
        mediaUrl: data.message.audioMessage.url,
        mimetype: data.message.audioMessage.mimetype,
        seconds: data.message.audioMessage.seconds,
        fileLength: data.message.audioMessage.fileLength,
        base64: data.message.audioMessage.base64 || data.message.base64,
      };
    } else if (data.message?.imageMessage) {
      mediaType = "image";
      textContent = data.message.imageMessage.caption || "[Imagem recebida]";
      mediaMetadata = {
        mediaUrl: data.message.imageMessage.url,
        mimetype: data.message.imageMessage.mimetype,
        caption: data.message.imageMessage.caption,
        width: data.message.imageMessage.width,
        height: data.message.imageMessage.height,
        base64: data.message.imageMessage.base64 || data.message.base64,
      };
    } else if (data.message?.videoMessage) {
      mediaType = "video";
      textContent = data.message.videoMessage.caption || "[Vídeo recebido]";
      mediaMetadata = {
        mediaUrl: data.message.videoMessage.url,
        mimetype: data.message.videoMessage.mimetype,
        caption: data.message.videoMessage.caption,
        seconds: data.message.videoMessage.seconds,
        base64: data.message.videoMessage.base64 || data.message.base64,
      };
    } else if (data.message?.documentMessage) {
      mediaType = "document";
      const fileName = data.message.documentMessage.fileName || "documento";
      textContent = `[Documento: ${fileName}]`;
      mediaMetadata = {
        mediaUrl: data.message.documentMessage.url,
        mimetype: data.message.documentMessage.mimetype,
        fileName: data.message.documentMessage.fileName,
        fileLength: data.message.documentMessage.fileLength,
        base64: data.message.documentMessage.base64 || data.message.base64,
      };
    } else if (data.message?.stickerMessage) {
      mediaType = "sticker";
      textContent = "[Sticker recebido]";
      mediaMetadata = {
        mediaUrl: data.message.stickerMessage.url,
        mimetype: data.message.stickerMessage.mimetype,
      };
    } else if (data.message?.contactMessage) {
      textContent = "[Contato recebido]";
    } else if (data.message?.locationMessage) {
      textContent = "[Localização recebida]";
      mediaMetadata = {
        latitude: data.message.locationMessage.degreesLatitude,
        longitude: data.message.locationMessage.degreesLongitude,
        name: data.message.locationMessage.name,
        address: data.message.locationMessage.address,
      };
    }

    if (!textContent) {
      return NextResponse.json({ ok: true });
    }

    const remoteJid = key.remoteJid || "";
    const result = await processIncomingMessage(userId, {
      from: remoteJid,
      id: key.id,
      text: textContent,
      type: mediaType || messageType,
      timestamp: String(data.messageTimestamp || Date.now()),
      pushName: data.pushName,
      metadata: mediaMetadata,
    });
    const conv = result.conversation;
    const wasActiveConversation = conv.status === "active";

    console.log(
      "[webhook] conv.status:",
      conv.status,
      "autoReply:",
      settings.autoReplyEnabled,
      "aiKey:",
      !!settings.aiApiKey,
      "delaySeconds:",
      settings.auto_reply_delay_seconds,
    );

    if (settings.autoReplyEnabled && (conv.status === "bot" || wasActiveConversation)) {
      if (wasActiveConversation) {
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { status: "bot" },
        });
      }

      after(async () => {
        try {
          await processScheduledAutoReply({
            conversationId: conv.id,
            triggerMessageId: result.message.id,
            delaySeconds: settings.auto_reply_delay_seconds,
            remoteJid,
            remoteJidAlt: key.remoteJidAlt || data.remoteJidAlt,
            wasActiveConversation,
          });
        } catch (err) {
          console.error("[webhook] Auto-reply error:", err);
        }
      });

      if (settings.followUpEnabled) {
        await scheduleFollowUp(result.lead.id, settings.followUpDelayHours);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
