// =============================================================================
// INTEGRAÇÃO VIA MAKE.COM (temporária — não requer app verificado na Meta)
// O Make.com usa o app próprio dele para capturar leads do Facebook Lead Ads.
// O corretor configura um cenário no Make: Facebook Lead Ads → HTTP Request.
// O HTTP Request aponta para esta rota.
//
// Quando tiver a verificação da empresa na Meta, migrar para /api/facebook/webhook
// (integração direta) e desativar esta rota.
// =============================================================================

import { z } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { json, error } from "@/lib/api";
import type { AIConfig } from "@/lib/ai";
import { after, NextRequest } from "next/server";
import { scheduleFollowUp } from "@/lib/followup";
import { getDefaultPipelineStageId } from "@/lib/pipeline";
import { sendCampaignOutreach } from "@/lib/campaign-outreach";

const payloadSchema = z.object({
  // Identificação do corretor no CRM
  userId: z.string().uuid(),
  // Dados do lead vindos do formulário do Facebook (via Make.com)
  name: z.string().optional().default(""),
  phone: z.string().min(1),
  email: z.string().optional().default(""),
  // Campos opcionais de contexto
  campaignName: z.string().optional().default(""),
  adName: z.string().optional().default(""),
  formName: z.string().optional().default(""),
  // Autenticação
  secret: z.string(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof payloadSchema>;

  try {
    body = payloadSchema.parse(await req.json());
  } catch (err) {
    logger.warn("[make-webhook] Invalid payload", {
      error: err instanceof Error ? err.message : String(err),
    });
    return error("Payload inválido", 400);
  }

  if (body.secret !== env.CRON_SECRET) {
    return error("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: body.userId },
    include: { settings: true },
  });

  if (!user) {
    return error("Usuário não encontrado", 404);
  }

  const phone = body.phone.replace(/\D/g, "");

  if (phone.length < 10) {
    return error("Telefone inválido", 400);
  }

  // Verifica se lead já existe
  const existingLead = await prisma.lead.findFirst({
    where: { userId: user.id, phone },
    include: { conversation: true },
  });

  if (existingLead) {
    logger.info("[make-webhook] Lead already exists", { phone });

    await prisma.activity.create({
      data: {
        userId: user.id,
        leadId: existingLead.id,
        type: "message",
        title: "Lead duplicado via Facebook Ads (Make)",
        description: `Lead já existente preencheu formulário novamente${body.campaignName ? ` (campanha: ${body.campaignName})` : ""}`,
      },
    });

    return json({ created: false, duplicate: true, leadId: existingLead.id });
  }

  // Cria lead + conversa
  const defaultPipelineStageId = await getDefaultPipelineStageId(user.id);
  const contactName = body.name || phone;
  const whatsappChatId = `${phone}@s.whatsapp.net`;

  const lead = await prisma.lead.create({
    data: {
      userId: user.id,
      name: contactName,
      phone,
      email: body.email || null,
      source: "facebook",
      status: "new",
      pipelineStageId: defaultPipelineStageId,
      conversation: { create: { whatsappChatId } },
    },
    include: { conversation: true },
  });

  const campaignInfo = body.campaignName || body.adName || body.formName;

  await prisma.activity.create({
    data: {
      userId: user.id,
      leadId: lead.id,
      type: "message",
      title: "Novo lead via Facebook Ads (Make)",
      description: `${contactName} preencheu formulário${campaignInfo ? ` da campanha "${campaignInfo}"` : ""}`,
    },
  });

  logger.info("[make-webhook] Lead created", { leadId: lead.id, phone });

  // Envia WhatsApp em background (com delay configurável no futuro)
  const settings = user.settings;

  const hasCampaignMessage = !!settings?.campaignOutreachMessage?.trim();

  if (settings?.facebookAutoOutreach && settings.whatsappPhoneId && (hasCampaignMessage || settings.aiApiKey)) {
    after(async () => {
      try {
        const aiConfig: AIConfig = {
          provider: settings.aiProvider,
          apiKey: settings.aiApiKey ?? "",
          model: settings.aiModel,
        };

        await sendCampaignOutreach({
          userId: user.id,
          conversationId: lead.conversation!.id,
          whatsappChatId,
          contactName,
          agentName: user.name || "Corretor",
          aiConfig,
          campaignOutreachMessage: settings.campaignOutreachMessage,
          campaignOutreachImageUrl: settings.campaignOutreachImageUrl,
          hasCampaignSecondMessage: !!settings.campaignSecondMessage?.trim(),
          whatsappPhoneId: settings.whatsappPhoneId!,
        });

        if (settings.followUpEnabled) {
          await scheduleFollowUp(lead.id, settings.followUpDelayHours);
        }

        logger.info("[make-webhook] Outreach sent", { phone });
      } catch (err) {
        logger.error("[make-webhook] WhatsApp outreach failed", {
          error: err instanceof Error ? err.message : String(err),
        });

        await prisma.activity.create({
          data: {
            userId: user.id,
            leadId: lead.id,
            type: "message",
            title: "Falha no envio WhatsApp",
            description: `Não foi possível enviar saudação via WhatsApp para ${phone}`,
          },
        });
      }
    });
  }

  return json({
    created: true,
    duplicate: false,
    leadId: lead.id,
    conversationId: lead.conversation!.id,
  });
}
