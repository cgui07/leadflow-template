import { prisma } from "@/lib/db";
import { after, NextRequest, NextResponse } from "next/server";
import { getDefaultPipelineStageId } from "@/lib/pipeline";
import { scheduleFollowUp } from "@/lib/followup";
import {
  fetchLeadData,
  getFacebookVerifyToken,
  verifyFacebookSignature,
} from "@/lib/facebook";
import {
  getWhatsAppConfig,
  sendAndSaveMessage,
} from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === getFacebookVerifyToken()) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyFacebookSignature(rawBody, signature)) {
    console.warn("[facebook] Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const body = JSON.parse(rawBody);

  after(async () => {
    try {
      await processEntries(body);
    } catch (err) {
      console.error("[facebook] Webhook processing error:", err);
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
    console.warn("[facebook] No mapping found for page:", pageId);
    return;
  }

  const { user } = mapping;
  const settings = user.settings;
  const pageAccessToken = settings?.facebookPageAccessToken;

  if (!pageAccessToken) {
    console.warn("[facebook] No page access token for user:", user.id);
    return;
  }

  const leadData = await fetchLeadData(leadgenId, pageAccessToken);

  if (!leadData || !leadData.phone) {
    console.warn("[facebook] Could not fetch lead data or missing phone:", leadgenId);
    return;
  }

  const existingLead = await prisma.lead.findFirst({
    where: { userId: user.id, phone: leadData.phone },
    include: { conversation: true },
  });

  if (existingLead) {
    console.log("[facebook] Lead already exists for phone:", leadData.phone);

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

  console.log("[facebook] Lead created:", lead.id, leadData.phone);

  if (!settings?.facebookAutoOutreach || !settings.whatsappPhoneId) {
    return;
  }

  const conversation = lead.conversation!;
  const greetingMessage = settings.greetingMessage;

  if (!greetingMessage) {
    return;
  }

  try {
    const config = getWhatsAppConfig(settings.whatsappPhoneId);

    await sendAndSaveMessage(
      config,
      conversation.id,
      whatsappChatId,
      greetingMessage,
      "bot",
    );

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "bot" },
    });

    if (settings.followUpEnabled) {
      await scheduleFollowUp(lead.id, settings.followUpDelayHours);
    }

    console.log("[facebook] Outreach sent to:", leadData.phone);
  } catch (err) {
    console.error("[facebook] WhatsApp outreach failed:", err);

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
