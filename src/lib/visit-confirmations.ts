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

  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const upcoming = await prisma.appointments.findMany({
    where: {
      scheduled_at: { gte: tomorrowStart, lte: tomorrowEnd },
      status: "confirmed",
      confirmation_sent_at: null,
    },
    include: {
      leads: {
        include: {
          conversation: true,
          user: { include: { settings: true } },
        },
      },
    },
  });

  for (const appt of upcoming) {
    try {
      const settings = appt.leads.user.settings;
      const conversation = appt.leads.conversation;

      if (!settings?.whatsappPhoneId || !conversation?.whatsappChatId) {
        continue;
      }

      const time = appt.scheduled_at.toLocaleTimeString("pt-BR", {
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

      await prisma.appointments.update({
        where: { id: appt.id },
        data: {
          status: "pending_confirmation",
          confirmation_sent_at: new Date(),
          updated_at: new Date(),
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

  // Mark passed appointments with no reply as "no_show"
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const expired = await prisma.appointments.findMany({
    where: {
      status: "pending_confirmation",
      confirmation_sent_at: { lt: twoDaysAgo },
      confirmation_reply: null,
      scheduled_at: { lt: now },
    },
    select: { id: true },
  });

  if (expired.length > 0) {
    await prisma.appointments.updateMany({
      where: { id: { in: expired.map((e) => e.id) } },
      data: { status: "no_show", updated_at: new Date() },
    });

    for (const e of expired) {
      results.push({ appointmentId: e.id, action: "marked_no_show" });
    }
  }

  return results;
}
