import { prisma } from "./db";
import { logger } from "./logger";
import type { AIConfig } from "./ai";
import { scheduleFollowUp } from "./followup";
import { getDefaultPipelineStageId } from "./pipeline";
import { sendCampaignOutreach } from "./campaign-outreach";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

// Remetentes conhecidos do Canal Pro / ZAP / Viva Real / OLX
const CANAL_PRO_SENDERS = [
  "noreply@comunica.zapimoveis.com.br",
  "noreply@comunica.vivareal.com.br",
  "noreply@olx.com.br",
  "noreply@canalpro.grupozap.com",
  "leads@zapimoveis.com.br",
  "leads@vivareal.com.br",
];

interface GmailMessage {
  id: string;
  threadId: string;
}

interface GmailMessageDetail {
  id: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    parts?: Array<{ mimeType: string; body: { data?: string } }>;
    body?: { data?: string };
  };
  snippet: string;
}

interface ParsedLead {
  name: string;
  phone: string;
  email: string | null;
}

async function refreshGmailToken(userId: string, refreshToken: string): Promise<string | null> {
  const { env } = await import("./env");

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await res.json() as { access_token?: string; expires_in?: number };

    if (!data.access_token) return null;

    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;

    await prisma.userSettings.update({
      where: { userId },
      data: {
        gmailAccessToken: data.access_token,
        gmailTokenExpiresAt: expiresAt,
      },
    });

    return data.access_token;
  } catch (err) {
    logger.error("[gmail] Token refresh failed", { userId, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

async function getValidAccessToken(userId: string): Promise<string | null> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      gmailAccessToken: true,
      gmailRefreshToken: true,
      gmailTokenExpiresAt: true,
    },
  });

  if (!settings?.gmailAccessToken) return null;

  // Token expirado — renova
  const isExpired = settings.gmailTokenExpiresAt
    ? new Date() >= new Date(settings.gmailTokenExpiresAt.getTime() - 60_000)
    : false;

  if (isExpired && settings.gmailRefreshToken) {
    return refreshGmailToken(userId, settings.gmailRefreshToken);
  }

  return settings.gmailAccessToken;
}

async function listUnreadLeadEmails(accessToken: string): Promise<GmailMessage[]> {
  const senderQuery = CANAL_PRO_SENDERS.map((s) => `from:${s}`).join(" OR ");
  const query = `(${senderQuery}) is:unread`;

  const res = await fetch(
    `${GMAIL_API_BASE}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail list failed: ${res.status} ${body}`);
  }

  const data = await res.json() as { messages?: GmailMessage[] };
  return data.messages ?? [];
}

async function getEmailDetail(accessToken: string, messageId: string): Promise<GmailMessageDetail | null> {
  const res = await fetch(
    `${GMAIL_API_BASE}/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) return null;

  return res.json() as Promise<GmailMessageDetail>;
}

async function markAsRead(accessToken: string, messageId: string): Promise<void> {
  await fetch(`${GMAIL_API_BASE}/users/me/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
}

function decodeBase64(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function getEmailBody(msg: GmailMessageDetail): string {
  if (msg.payload.body?.data) {
    return decodeBase64(msg.payload.body.data);
  }

  if (msg.payload.parts) {
    for (const part of msg.payload.parts) {
      if (part.mimeType === "text/plain" && part.body.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of msg.payload.parts) {
      if (part.mimeType === "text/html" && part.body.data) {
        return decodeBase64(part.body.data);
      }
    }
  }

  return msg.snippet ?? "";
}

function extractPhoneFromText(text: string): string | null {
  // Remove HTML tags se houver
  const clean = text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");

  // Padrões de telefone brasileiro
  const patterns = [
    /(?:telefone|celular|whatsapp|fone|tel|contato)[^\d]*(\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4})/gi,
    /\(?\d{2}\)?\s*9\d{4}[-\s]?\d{4}/g,
    /\(?\d{2}\)?\s*\d{4}[-\s]?\d{4}/g,
  ];

  for (const pattern of patterns) {
    const matches = clean.match(pattern);
    if (matches && matches.length > 0) {
      const raw = matches[0].replace(/\D/g, "");
      if (raw.length >= 10) {
        return raw.startsWith("55") ? raw : `55${raw}`;
      }
    }
  }

  return null;
}

function extractNameFromText(text: string): string {
  const clean = text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");

  const patterns = [
    /(?:nome|cliente|interessado|contato)[:\s]+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)+)\s+(?:tem interesse|gostaria|entrou em contato|solicitou)/i,
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match?.[1] && match[1].length > 2) {
      return match[1].trim();
    }
  }

  return "";
}

function extractEmailFromText(text: string): string | null {
  const clean = text.replace(/<[^>]+>/g, " ");
  const match = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match?.[0] ?? null;
}

function parseLeadFromEmail(msg: GmailMessageDetail): ParsedLead | null {
  const body = getEmailBody(msg);
  const phone = extractPhoneFromText(body);

  if (!phone) return null;

  const name = extractNameFromText(body);
  const email = extractEmailFromText(body);

  return { name, phone, email };
}

export async function processGmailLeads(userId: string): Promise<number> {
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    logger.warn("[gmail] No valid access token", { userId });
    return 0;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });

  if (!user?.settings) return 0;

  let messages: GmailMessage[];
  try {
    messages = await listUnreadLeadEmails(accessToken);
  } catch (err) {
    logger.error("[gmail] Failed to list emails", { userId, error: err instanceof Error ? err.message : String(err) });
    return 0;
  }

  if (messages.length === 0) return 0;

  logger.info("[gmail] Found unread lead emails", { userId, count: messages.length });

  let processed = 0;

  for (const msg of messages) {
    try {
      const detail = await getEmailDetail(accessToken, msg.id);
      if (!detail) continue;

      const lead = parseLeadFromEmail(detail);

      if (!lead) {
        await markAsRead(accessToken, msg.id);
        continue;
      }

      // Verifica duplicado
      const existing = await prisma.lead.findFirst({
        where: { userId, phone: lead.phone },
      });

      if (existing) {
        await markAsRead(accessToken, msg.id);
        logger.info("[gmail] Lead already exists", { phone: lead.phone });
        continue;
      }

      const defaultPipelineStageId = await getDefaultPipelineStageId(userId);
      const contactName = lead.name || lead.phone;
      const whatsappChatId = `${lead.phone}@s.whatsapp.net`;

      const newLead = await prisma.lead.create({
        data: {
          userId,
          name: contactName,
          phone: lead.phone,
          email: lead.email ?? null,
          source: "canal_pro",
          status: "new",
          pipelineStageId: defaultPipelineStageId,
          conversation: { create: { whatsappChatId } },
        },
        include: { conversation: true },
      });

      await prisma.activity.create({
        data: {
          userId,
          leadId: newLead.id,
          type: "message",
          title: "Novo lead via Canal Pro (email)",
          description: `${contactName} enviou mensagem pelo portal`,
        },
      });

      await markAsRead(accessToken, msg.id);
      processed++;

      logger.info("[gmail] Lead created from email", { leadId: newLead.id, phone: lead.phone });

      // Dispara WhatsApp se configurado
      const settings = user.settings;
      const hasCampaignMessage = !!settings.campaignOutreachMessage?.trim();
      if (settings.canalProAutoOutreach && settings.whatsappPhoneId && (hasCampaignMessage || settings.aiApiKey)) {
        try {
          const aiConfig: AIConfig = {
            provider: settings.aiProvider,
            apiKey: settings.aiApiKey ?? "",
            model: settings.aiModel,
          };

          await sendCampaignOutreach({
            userId,
            conversationId: newLead.conversation!.id,
            whatsappChatId,
            contactName,
            agentName: user.name || "Corretor",
            aiConfig,
            campaignOutreachMessage: settings.campaignOutreachMessage,
            campaignOutreachImageUrl: settings.campaignOutreachImageUrl,
            hasCampaignSecondMessage: !!settings.campaignSecondMessage?.trim(),
            whatsappPhoneId: settings.whatsappPhoneId,
          });

          if (settings.followUpEnabled) {
            await scheduleFollowUp(newLead.id, settings.followUpDelayHours);
          }
        } catch (err) {
          logger.error("[gmail] WhatsApp outreach failed", {
            leadId: newLead.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (err) {
      logger.error("[gmail] Error processing email", {
        messageId: msg.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return processed;
}

export async function processAllGmailLeads(): Promise<{ userId: string; processed: number }[]> {
  const usersWithGmail = await prisma.userSettings.findMany({
    where: {
      canalProAccountType: "company",
      gmailAccessToken: { not: null },
    },
    select: { userId: true },
  });

  const results = [];

  for (const { userId } of usersWithGmail) {
    const processed = await processGmailLeads(userId);
    results.push({ userId, processed });
  }

  return results;
}
