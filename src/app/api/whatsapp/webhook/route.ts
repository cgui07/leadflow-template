import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { scheduleFollowUp } from "@/lib/followup";
import { processIncomingMessage } from "@/lib/whatsapp";
import { processScheduledAutoReply } from "@/lib/auto-reply";
import { after, NextRequest, NextResponse } from "next/server";
import { resolveProviderByInstance } from "@/providers/whatsapp/factory";

const MAX_WEBHOOK_BODY_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > MAX_WEBHOOK_BODY_SIZE) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 },
      );
    }

    const body = await req.json();
    const instanceName = body.instance || body.instanceName;
    const token = req.headers.get("x-webhook-token");

    if (!instanceName) {
      return NextResponse.json(
        { error: "Missing instance name" },
        { status: 400 },
      );
    }

    // Rate limit per instance: 100 req/min
    const { allowed: webhookAllowed } = checkRateLimit(
      `webhook:${instanceName}`,
      { windowMs: 60_000, maxRequests: 100 },
    );
    if (!webhookAllowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // Resolve provider + user for this instance
    const resolved = await resolveProviderByInstance(instanceName);
    if (!resolved) {
      return NextResponse.json(
        { error: "Instance not found" },
        { status: 404 },
      );
    }

    const { provider, userId, settings } = resolved;

    if (settings.whatsappWebhookToken && settings.whatsappWebhookToken !== token) {
      return NextResponse.json(
        { error: "Invalid webhook token" },
        { status: 401 },
      );
    }

    // Parse webhook payload via provider → normalized event
    const event = provider.parseWebhook(body);
    if (!event) {
      return NextResponse.json({ ok: true });
    }

    // Handle connection status changes
    if (event.type === "connection_changed") {
      const disconnected = event.state === "disconnected";
      if (disconnected) {
        logger.error("WhatsApp instance disconnected", {
          instance: instanceName,
          state: event.state,
          userId,
        });
      } else {
        logger.info("WhatsApp connection state changed", {
          instance: instanceName,
          state: event.state,
          userId,
        });
      }
      return NextResponse.json({ ok: true, status: event.state });
    }

    // Handle incoming messages
    if (event.type === "incoming_message") {
      // Skip own messages and group messages
      if (event.isFromMe || event.isGroup) {
        return NextResponse.json({ ok: true });
      }

      if (!event.text) {
        return NextResponse.json({ ok: true });
      }

      const result = await processIncomingMessage(userId, {
        from: event.remoteJid,
        id: event.messageId,
        text: event.text,
        type: event.mediaType || "conversation",
        timestamp: event.timestamp,
        pushName: event.pushName,
        metadata: event.mediaMetadata,
      });

      const conv = result.conversation;
      const wasActiveConversation = conv.status === "active";

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
              remoteJid: event.remoteJid,
              remoteJidAlt: event.remoteJidAlt,
              wasActiveConversation,
            });
          } catch (err) {
            logger.error("Auto-reply error", {
              error: err instanceof Error ? err.message : String(err),
            });
          }
        });

        if (settings.followUpEnabled) {
          await scheduleFollowUp(result.lead.id, settings.followUpDelayHours);
        }
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Webhook error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
