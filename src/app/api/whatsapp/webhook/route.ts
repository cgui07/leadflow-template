import { prisma } from "@/lib/db";
import { processIncomingMessage, sendAndSaveMessage } from "@/lib/whatsapp";
import { generateAutoReply, qualifyLead } from "@/lib/ai";
import { scheduleFollowUp } from "@/lib/followup";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    const settings = await prisma.userSettings.findFirst({
      where: { whatsappWebhookToken: token },
    });

    if (settings) {
      return new NextResponse(challenge, { status: 200 });
    }
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.length) {
      return NextResponse.json({ ok: true });
    }

    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) {
      return NextResponse.json({ ok: true });
    }

    const settings = await prisma.userSettings.findFirst({
      where: { whatsappPhoneId: phoneNumberId },
      include: { user: true },
    });

    if (!settings) {
      console.error("No user found for phone number ID:", phoneNumberId);
      return NextResponse.json({ ok: true });
    }

    const userId = settings.userId;

    for (const msg of value.messages) {
      const result = await processIncomingMessage(userId, {
        from: msg.from,
        id: msg.id,
        text: msg.text,
        type: msg.type,
        timestamp: msg.timestamp,
        contacts: value.contacts,
      });

      const conv = result.conversation;
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

          const reply = await generateAutoReply(
            aiConfig,
            settings.user.name,
            messages.map((m) => ({ direction: m.direction, content: m.content, sender: m.sender }))
          );

          if (reply) {
            await sendAndSaveMessage(
              { phoneId: settings.whatsappPhoneId!, token: settings.whatsappToken! },
              conv.id,
              msg.from,
              reply,
              "bot"
            );
          }

          const messageCount = messages.length + 1;
          if (messageCount >= 3 && messageCount % 2 === 1) {
            await qualifyLead(result.lead.id, aiConfig);
          }
        } else if (settings.greetingMessage && conv.status === "active") {
          await sendAndSaveMessage(
            { phoneId: settings.whatsappPhoneId!, token: settings.whatsappToken! },
            conv.id,
            msg.from,
            settings.greetingMessage,
            "bot"
          );
        }

        if (settings.followUpEnabled) {
          await scheduleFollowUp(result.lead.id, settings.followUpDelayHours);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
