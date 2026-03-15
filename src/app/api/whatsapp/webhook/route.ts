import { prisma } from "@/lib/db";
import {
  processIncomingMessage,
  rememberMapping,
  resolveSendTarget,
  sendAndSaveMessage,
} from "@/lib/whatsapp";
import { generateAutoReply, qualifyLead } from "@/lib/ai";
import { scheduleFollowUp } from "@/lib/followup";
import { NextRequest, NextResponse } from "next/server";

const INBOUND_MESSAGE_EVENTS = new Set(["messages.upsert", "MESSAGES_UPSERT"]);

// Evolution API sends webhooks as POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Evolution API webhook format
    const event = body.event;
    const data = body.data;
    const key = data?.key;
    rememberMapping(data);

    // Only process incoming messages
    if (!INBOUND_MESSAGE_EVENTS.has(event)) {
      return NextResponse.json({ ok: true });
    }

    console.log("[webhook] Full payload:", JSON.stringify(body).substring(0, 500));

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
        })
      );
    }

    // Ignore outgoing messages (fromMe = true)
    if (key?.fromMe) {
      return NextResponse.json({ ok: true });
    }

    // Instance name = whatsappPhoneId in our settings
    const instanceName = body.instance || body.instanceName;
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

    const userId = settings.userId;

    // Extract message content from Evolution API format
    const messageType = data.messageType || "conversation";
    let textContent = "";

    if (data.message?.conversation) {
      textContent = data.message.conversation;
    } else if (data.message?.extendedTextMessage?.text) {
      textContent = data.message.extendedTextMessage.text;
    }

    // Skip non-text messages for now
    if (!textContent) {
      return NextResponse.json({ ok: true });
    }

    const remoteJid = key.remoteJid || "";

    const result = await processIncomingMessage(userId, {
      from: remoteJid,
      id: key.id,
      text: textContent,
      type: messageType,
      timestamp: String(data.messageTimestamp || Date.now()),
      pushName: data.pushName,
    });

    const conv = result.conversation;
    console.log("[webhook] conv.status:", conv.status, "autoReply:", settings.autoReplyEnabled, "aiKey:", !!settings.aiApiKey);
    if (settings.autoReplyEnabled && (conv.status === "bot" || conv.status === "active")) {
      if (conv.status === "active") {
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { status: "bot" },
        });
      }

      if (settings.aiApiKey) {
        const messages = await prisma.message.findMany({
          where: { conversationId: conv.id },
          orderBy: { createdAt: "asc" },
          take: 20,
        });

        const aiConfig = {
          provider: settings.aiProvider,
          apiKey: settings.aiApiKey,
          model: settings.aiModel,
        };

        console.log("[webhook] Calling AI with", messages.length, "messages, provider:", aiConfig.provider);
        const reply = await generateAutoReply(
          aiConfig,
          settings.user.name,
          messages.map((m) => ({ direction: m.direction, content: m.content, sender: m.sender }))
        );
        console.log("[webhook] AI reply:", reply ? reply.substring(0, 100) : "EMPTY");

        if (reply) {
          const replyJid = resolveSendTarget(
            key.remoteJidAlt,
            data.remoteJidAlt,
            remoteJid,
            result.conversation.whatsappChatId,
            result.lead.phone
          );
          if (!replyJid) {
            console.warn("[webhook] Skipping auto-reply because LID JID could not be resolved:", remoteJid);
          } else {
            console.log("[webhook] Sending reply to", replyJid);
            await sendAndSaveMessage(
              { phoneId: settings.whatsappPhoneId!, token: settings.whatsappToken! },
              conv.id,
              replyJid,
              reply,
              "bot"
            );
            console.log("[webhook] Reply sent successfully");
          }
        }

        const messageCount = messages.length + 1;
        if (messageCount >= 3 && messageCount % 2 === 1) {
          await qualifyLead(result.lead.id, aiConfig);
        }
      } else if (settings.greetingMessage && conv.status === "active") {
        const replyJid = resolveSendTarget(
          key.remoteJidAlt,
          data.remoteJidAlt,
          remoteJid,
          result.conversation.whatsappChatId,
          result.lead.phone
        );
        if (!replyJid) {
          console.warn("[webhook] Skipping greeting because LID JID could not be resolved:", remoteJid);
        } else {
          await sendAndSaveMessage(
            { phoneId: settings.whatsappPhoneId!, token: settings.whatsappToken! },
            conv.id,
            replyJid,
            settings.greetingMessage,
            "bot"
          );
        }
      }

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
