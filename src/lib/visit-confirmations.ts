/**
 * visit-confirmations.ts
 *
 * Cron-driven logic that:
 * 1. Sends a WhatsApp confirmation message 1 day before each confirmed visit.
 * 2. Marks appointments as "no_show" when no reply is received after they pass.
 */
import { prisma } from "./db";
import { getWhatsAppConfig, sendAndSaveMessage } from "./whatsapp";

export interface VisitConfirmationResult {
  appointmentId: string;
  action: "confirmation_sent" | "marked_no_show" | "error";
  error?: string;
}

export async function processVisitConfirmations(): Promise<
  VisitConfirmationResult[]
> {
  const results: VisitConfirmationResult[] = [];

  // ── 1. Send confirmation messages for appointments scheduled tomorrow ──────
  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const upcoming = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: tomorrowStart, lte: tomorrowEnd },
      status: "confirmed",
      confirmationSentAt: null,
    },
    include: {
      lead: {
        include: {
          conversation: true,
          user: { include: { settings: true } },
        },
      },
    },
  });

  for (const appt of upcoming) {
    try {
      const settings = appt.lead.user.settings;
      const conversation = appt.lead.conversation;

      if (!settings?.whatsappPhoneId || !conversation?.whatsappChatId) {
        continue;
      }

      const time = appt.scheduledAt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });

      const lines = [
        `Olá! Confirmando nossa visita amanhã às ${time}. Tudo certo? 😊`,
      ];
      if (appt.address) lines.push(`📍 ${appt.address}`);
      lines.push(`\nResponda *SIM* para confirmar ou *NÃO* para cancelar.`);

      await sendAndSaveMessage(
        getWhatsAppConfig(settings.whatsappPhoneId),
        conversation.id,
        conversation.whatsappChatId,
        lines.join("\n"),
        "bot",
      );

      await prisma.appointment.update({
        where: { id: appt.id },
        data: {
          status: "pending_confirmation",
          confirmationSentAt: new Date(),
          updatedAt: new Date(),
        },
      });

      results.push({ appointmentId: appt.id, action: "confirmation_sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[visit-confirmations] Failed for appointment ${appt.id}:`,
        message,
      );
      results.push({ appointmentId: appt.id, action: "error", error: message });
    }
  }

  // ── 2. Mark passed appointments with no reply as "no_show" ────────────────
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const expired = await prisma.appointment.findMany({
    where: {
      status: "pending_confirmation",
      confirmationSentAt: { lt: twoDaysAgo },
      confirmationReply: null,
      scheduledAt: { lt: now },
    },
    select: { id: true },
  });

  if (expired.length > 0) {
    await prisma.appointment.updateMany({
      where: { id: { in: expired.map((e) => e.id) } },
      data: { status: "no_show", updatedAt: new Date() },
    });

    for (const e of expired) {
      results.push({ appointmentId: e.id, action: "marked_no_show" });
    }
  }

  return results;
}
