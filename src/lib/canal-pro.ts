import { env } from "./env";
import { prisma } from "./db";
import { logger } from "./logger";
import { randomBytes } from "crypto";

export interface CanalProLead {
  leadOrigin: string;
  originLeadId: string;
  originListingId: string | null;
  clientListingId: string | null;
  name: string;
  email: string | null;
  phone: string;
  message: string | null;
}

export interface CanalProStatus {
  connected: boolean;
  webhookUrl: string | null;
}

export function generateCanalProToken(): string {
  return randomBytes(32).toString("hex");
}

export function getCanalProWebhookUrl(token: string): string {
  const base = env.APP_URL || env.NEXT_PUBLIC_APP_URL;
  return `${base}/api/canal-pro/webhook?token=${token}`;
}

export async function activateCanalPro(
  userId: string,
): Promise<{ token: string; webhookUrl: string }> {
  const token = generateCanalProToken();

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, canalProWebhookToken: token },
    update: { canalProWebhookToken: token },
  });

  return { token, webhookUrl: getCanalProWebhookUrl(token) };
}

export async function getCanalProConnectionStatus(
  userId: string,
): Promise<CanalProStatus> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { canalProWebhookToken: true },
  });

  const token = settings?.canalProWebhookToken ?? null;

  return {
    connected: !!token,
    webhookUrl: token ? getCanalProWebhookUrl(token) : null,
  };
}

export async function disconnectCanalPro(userId: string): Promise<void> {
  await prisma.userSettings.update({
    where: { userId },
    data: { canalProWebhookToken: null },
  });
}

export async function findUserByCanalProToken(token: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { canalProWebhookToken: token },
    include: {
      user: true,
    },
  });

  if (!settings) return null;

  return {
    user: settings.user,
    settings,
  };
}

export function parseCanalProPayload(body: unknown): CanalProLead | null {
  if (!body || typeof body !== "object") return null;

  const data = body as Record<string, unknown>;

  const ddd = stripNonDigits(String(data.ddd ?? ""));
  const phone = stripNonDigits(String(data.phone ?? ""));
  const fullPhone = ddd + phone;

  if (!fullPhone) {
    logger.warn("[canal-pro] Lead sem telefone, ignorando");
    return null;
  }

  return {
    leadOrigin: String(data.leadOrigin ?? ""),
    originLeadId: String(data.originLeadId ?? ""),
    originListingId: data.originListingId ? String(data.originListingId) : null,
    clientListingId: data.clientListingId ? String(data.clientListingId) : null,
    name: String(data.name ?? ""),
    email: data.email ? String(data.email) : null,
    phone: fullPhone,
    message: data.message ? String(data.message) : null,
  };
}

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export const CANAL_PRO_ORIGIN_LABELS: Record<string, string> = {
  CONTACT_FORM: "formulário de contato",
  CLICK_WHATSAPP: "clique no WhatsApp",
  CONTACT_CHAT: "chat do portal",
  CLICK_SCHEDULE: "agendamento de visita",
  PHONE_VIEW: "visualização de telefone",
  VISIT_REQUEST: "solicitação de visita",
};
