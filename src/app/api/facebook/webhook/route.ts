// =============================================================================
// INTEGRAÇÃO DIRETA COM META (requer app verificado + empresa verificada)
// Quando tiver a verificação da empresa na Meta, ativar este webhook
// e desativar o /api/facebook/make-webhook.
// Para ativar: basta apontar o webhook do Facebook para esta rota.
// =============================================================================

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { AIConfig } from "@/lib/ai";
import { scheduleFollowUp } from "@/lib/followup";
import { getDefaultPipelineStageId } from "@/lib/pipeline";
import { sendCampaignOutreach } from "@/lib/campaign-outreach";
import { after, NextRequest, NextResponse } from "next/server";
import {
  fetchLeadData,
  getFacebookVerifyToken,
  verifyFacebookSignature,
} from "@/lib/facebook";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === getFacebookVerifyToken()) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

const MAX_WEBHOOK_BODY_SIZE = 1024 * 1024; // 1 MB

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_WEBHOOK_BODY_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyFacebookSignature(rawBody, signature)) {
    logger.warn("[facebook] Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    logger.warn("[facebook] Invalid JSON in webhook body");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  after(async () => {
    try {
      await processEntries(body);
    } catch (err) {
      logger.error("[facebook] Webhook processing error", { error: err instanceof Error ? err.message : String(err) });
    }
  });

  return NextResponse.json({ ok: true });
}

async function processEntries(body: Record<string, unknown>) {
  const entries = Array.isArray(body.entry) ? body.entry : [];

  for (const entry of entries) {
    const pageId = String(entry.id ?? "");
    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      if (change.field !== "leadgen") {
        continue;
      }

      const leadgenId = String(change.value?.leadgen_id ?? "");

      if (!leadgenId) {
        continue;
      }

      await processLeadgen(pageId, leadgenId);
    }
  }
}

async function processLeadgen(pageId: string, leadgenId: string) {
  const mapping = await prisma.facebookPageMapping.findUnique({
    where: { pageId },
    include: {
      user: {
        include: {
          settings: true,
        },
      },
    },
  });

  if (!mapping) {
    logger.warn("[facebook] No mapping found for page", { pageId });
    return;
  }

  const { user } = mapping;
  const settings = user.settings;
  const pageAccessToken = settings?.facebookPageAccessToken;

  if (!pageAccessToken) {
    logger.warn("[facebook] No page access token for user", { userId: user.id });
    return;
  }

  const leadData = await fetchLeadData(leadgenId, pageAccessToken);

  if (!leadData || !leadData.phone) {
    logger.warn("[facebook] Could not fetch lead data or missing phone", { leadgenId });
    return;
  }

  const existingLead = await prisma.lead.findFirst({
    where: { userId: user.id, phone: leadData.phone },
    include: { conversation: true },
  });

  if (existingLead) {
    logger.info("[facebook] Lead already exists", { phone: leadData.phone });

    await prisma.activity.create({
      data: {
        userId: user.id,
        leadId: existingLead.id,
        type: "message",
        title: "Novo lead duplicado via Facebook Ads",
        description: `Lead já existente preencheu formulário novamente (leadgen: ${leadgenId})`,
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
      source: "facebook",
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
      title: "Novo lead via Facebook Ads",
      description: `${contactName} preencheu formulário de campanha`,
    },
  });

  logger.info("[facebook] Lead created", { leadId: lead.id, phone: leadData.phone });

  if (!settings?.facebookAutoOutreach || !settings.whatsappPhoneId) {
    return;
  }

  const hasCampaignMessage = !!settings.campaignOutreachMessage?.trim();

  if (!hasCampaignMessage && !settings.aiApiKey) {
    logger.warn("[facebook] No AI API key configured, skipping outreach", { userId: user.id });
    return;
  }

  const conversation = lead.conversation!;
  const agentName = user.name || "Corretor";

  try {
    const aiConfig: AIConfig = {
      provider: settings.aiProvider,
      apiKey: settings.aiApiKey ?? "",
      model: settings.aiModel,
    };

    await sendCampaignOutreach({
      userId: user.id,
      conversationId: conversation.id,
      whatsappChatId,
      contactName,
      agentName,
      aiConfig,
      campaignOutreachMessage: settings.campaignOutreachMessage,
      campaignOutreachImageUrl: settings.campaignOutreachImageUrl,
      hasCampaignSecondMessage: !!settings.campaignSecondMessage?.trim(),
      whatsappPhoneId: settings.whatsappPhoneId,
    });

    if (settings.followUpEnabled) {
      await scheduleFollowUp(lead.id, settings.followUpDelayHours);
    }

    logger.info("[facebook] Outreach sent", { phone: leadData.phone });
  } catch (err) {
    logger.error("[facebook] WhatsApp outreach failed", { error: err instanceof Error ? err.message : String(err) });

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
