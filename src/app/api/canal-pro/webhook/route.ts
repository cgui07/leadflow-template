import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { AIConfig } from "@/lib/ai";
import { scheduleFollowUp } from "@/lib/followup";
import { getDefaultPipelineStageId } from "@/lib/pipeline";
import { generateCanalProOutreachMessage } from "@/lib/ai";
import { after, NextRequest, NextResponse } from "next/server";
import { getWhatsAppConfig, sendAndSaveMessage } from "@/lib/whatsapp";
import {
  findUserByCanalProToken,
  parseCanalProPayload,
  CANAL_PRO_ORIGIN_LABELS,
  type CanalProLead,
} from "@/lib/canal-pro";

const MAX_WEBHOOK_BODY_SIZE = 1024 * 1024;

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_WEBHOOK_BODY_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    logger.warn("[canal-pro] Invalid JSON in webhook body");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  after(async () => {
    try {
      await processWebhook(token, body);
    } catch (err) {
      logger.error("[canal-pro] Webhook processing error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return NextResponse.json({ ok: true });
}

async function processWebhook(token: string, body: unknown) {
  const result = await findUserByCanalProToken(token);

  if (!result) {
    logger.warn("[canal-pro] No user found for webhook token");
    return;
  }

  const { user, settings } = result;
  const leadData = parseCanalProPayload(body);

  if (!leadData) {
    logger.warn("[canal-pro] Could not parse lead data from payload");
    return;
  }

  // Duplicate check
  const existingLead = await prisma.lead.findFirst({
    where: { userId: user.id, phone: leadData.phone },
    include: { conversation: true },
  });

  if (existingLead) {
    logger.info("[canal-pro] Lead already exists", { phone: leadData.phone });

    await prisma.activity.create({
      data: {
        userId: user.id,
        leadId: existingLead.id,
        type: "message",
        title: "Novo lead duplicado via Canal Pro",
        description: `Lead já existente demonstrou interesse novamente (${originLabel(leadData)})`,
      },
    });

    return;
  }

  const defaultPipelineStageId = await getDefaultPipelineStageId(user.id);
  const contactName = leadData.name || leadData.phone;
  const whatsappChatId = `${leadData.phone}@s.whatsapp.net`;

  const lead = await prisma.lead.create({
    data: {
      userId: user.id,
      name: contactName,
      phone: leadData.phone,
      email: leadData.email,
      source: "canal_pro",
      status: "new",
      pipelineStageId: defaultPipelineStageId,
      conversation: { create: { whatsappChatId } },
    },
    include: { conversation: true },
  });

  await prisma.activity.create({
    data: {
      userId: user.id,
      leadId: lead.id,
      type: "message",
      title: "Novo lead via Canal Pro",
      description: `${contactName} demonstrou interesse via ${originLabel(leadData)}`,
    },
  });

  logger.info("[canal-pro] Lead created", {
    leadId: lead.id,
    phone: leadData.phone,
  });

  if (!settings.canalProAutoOutreach || !settings.whatsappPhoneId) {
    return;
  }

  if (!settings.aiApiKey) {
    logger.warn("[canal-pro] No AI API key configured, skipping outreach", {
      userId: user.id,
    });
    return;
  }

  const conversation = lead.conversation!;
  const agentName = user.name || "Corretor";

  try {
    const config = getWhatsAppConfig(settings.whatsappPhoneId);
    const aiConfig: AIConfig = {
      provider: settings.aiProvider,
      apiKey: settings.aiApiKey,
      model: settings.aiModel,
    };

    const outreachMessage = await generateCanalProOutreachMessage(
      aiConfig,
      agentName,
      contactName,
      leadData.leadOrigin,
      leadData.message,
    );

    if (!outreachMessage) {
      logger.warn("[canal-pro] AI returned empty outreach message", {
        leadId: lead.id,
      });
      return;
    }

    await sendAndSaveMessage(
      config,
      conversation.id,
      whatsappChatId,
      outreachMessage,
      "bot",
    );

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "bot" },
    });

    if (settings.followUpEnabled) {
      await scheduleFollowUp(lead.id, settings.followUpDelayHours);
    }

    logger.info("[canal-pro] Outreach sent", { phone: leadData.phone });
  } catch (err) {
    logger.error("[canal-pro] WhatsApp outreach failed", {
      error: err instanceof Error ? err.message : String(err),
    });

    await prisma.activity.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        type: "message",
        title: "Falha no envio WhatsApp",
        description: `Não foi possível enviar saudação via WhatsApp para ${leadData.phone}`,
      },
    });
  }
}

function originLabel(lead: CanalProLead): string {
  return (
    CANAL_PRO_ORIGIN_LABELS[lead.leadOrigin] ||
    lead.leadOrigin ||
    "portal imobiliário"
  );
}
