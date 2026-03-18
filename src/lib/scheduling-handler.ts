/**
 * scheduling-handler.ts
 *
 * Ties together scheduling intent detection, Google Calendar availability,
 * appointment creation and WhatsApp confirmation messages.
 * Called from auto-reply.ts after the main AI reply is sent.
 */
import { prisma } from "./db";
import type { AIConfig } from "./ai";
import { extractSchedulingIntent } from "./scheduling-intent";
import {
  createAppointment,
  cancelAppointment,
  getPendingAppointmentForLead,
  getOpenVisitActionForLead,
  confirmAppointmentReply,
} from "./appointments";
import { getWhatsAppConfig, sendAndSaveMessage } from "./whatsapp";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserSettingsSnapshot {
  whatsappPhoneId: string | null | undefined;
}

interface HandleSchedulingInput {
  userId: string;
  leadId: string;
  leadName: string;
  conversationId: string;
  messages: Array<{ direction: string; content: string }>;
  replyJid: string;
  aiConfig: AIConfig;
  settings: UserSettingsSnapshot;
}

// ─── Confirmation-reply detector ─────────────────────────────────────────────

const CONFIRM_PATTERN =
  /^(sim|s|yes|confirmo|confirmado|pode ser|ok|tá bom|ta bom|combinado|com certeza|claro)[\s!.]*$/i;

const CANCEL_PATTERN =
  /^(não|nao|n|no|cancelar|cancelado|não vou|nao vou|não posso|nao posso|preciso cancelar|vou cancelar)[\s!.]*$/i;

/**
 * If the latest inbound message is a SIM/NÃO reply to a pending appointment
 * confirmation, handles it and returns true (skips normal AI reply).
 */
export async function handleConfirmationReplyIfNeeded(
  leadId: string,
  userId: string,
  conversationId: string,
  replyJid: string,
  latestMessage: string,
  settings: UserSettingsSnapshot,
): Promise<boolean> {
  const pending = await prisma.appointment.findFirst({
    where: { leadId, status: "pending_confirmation" },
    orderBy: { scheduledAt: "asc" },
  });

  if (!pending) return false;

  const text = latestMessage.trim();
  const isConfirm = CONFIRM_PATTERN.test(text);
  const isCancel = CANCEL_PATTERN.test(text);

  if (!isConfirm && !isCancel) return false;

  await confirmAppointmentReply(leadId, isConfirm ? "confirmed" : "cancelled");

  if (!settings.whatsappPhoneId) return true;

  const config = getWhatsAppConfig(settings.whatsappPhoneId);

  if (isConfirm) {
    const time = pending.scheduledAt.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const date = pending.scheduledAt.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    await sendAndSaveMessage(
      config,
      conversationId,
      replyJid,
      `Ótimo! Visita confirmada para ${date} às ${time}. Até lá! 🏠`,
      "bot",
    );
  } else {
    await cancelAppointment(pending.id, userId);
    await sendAndSaveMessage(
      config,
      conversationId,
      replyJid,
      "Ok, visita cancelada! Se quiser reagendar é só falar 😊",
      "bot",
    );
  }

  return true;
}

// ─── Scheduling intent processor ─────────────────────────────────────────────

/**
 * After the AI reply is sent, checks whether the conversation contains a
 * scheduling proposal. If so, checks calendar availability and either creates
 * the appointment or suggests alternatives — sending a follow-up WhatsApp message.
 *
 * Only runs when there is an open "visit" LeadAction for this lead.
 */
export async function handleSchedulingIfNeeded(
  input: HandleSchedulingInput,
): Promise<void> {
  // Only run when there's a pending/awaiting visit action
  const openAction = await getOpenVisitActionForLead(input.leadId);
  if (!openAction) return;

  // Don't create a second appointment if one is already confirmed/pending
  const existing = await getPendingAppointmentForLead(input.leadId);
  if (existing) return;

  const intent = await extractSchedulingIntent(input.aiConfig, input.messages);

  if (!intent.hasIntent || !intent.proposedDate || !intent.proposedTime) return;
  if (intent.isConfirmation || intent.isCancellation) return; // handled above

  // Parse proposed datetime (treat as local Brazil time for display purposes)
  const scheduledAt = new Date(
    `${intent.proposedDate}T${intent.proposedTime}:00`,
  );
  if (isNaN(scheduledAt.getTime())) return;

  // Refuse past dates
  if (scheduledAt < new Date()) return;

  const result = await createAppointment({
    userId: input.userId,
    leadId: input.leadId,
    leadActionId: openAction.id,
    title: `Visita — ${input.leadName}`,
    scheduledAt,
    address: intent.address ?? null,
  });

  if (!input.settings.whatsappPhoneId) return;

  const config = getWhatsAppConfig(input.settings.whatsappPhoneId);

  if (result.wasAvailable) {
    const time = scheduledAt.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const date = scheduledAt.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const calendarNote = result.calendarCreated
      ? " Adicionado na agenda do corretor. 📅"
      : "";

    await sendAndSaveMessage(
      config,
      input.conversationId,
      input.replyJid,
      `✅ Visita agendada para ${date} às ${time}!${intent.address ? `\n📍 ${intent.address}` : ""}${calendarNote}`,
      "bot",
    );
  } else if (result.alternativeSlots && result.alternativeSlots.length > 0) {
    const slotsText = result.alternativeSlots
      .map((slot) => {
        const t = slot.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        const d = slot.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        return `• ${d} às ${t}`;
      })
      .join("\n");

    await sendAndSaveMessage(
      config,
      input.conversationId,
      input.replyJid,
      `Infelizmente esse horário já está ocupado na minha agenda. Que tal um desses?\n\n${slotsText}`,
      "bot",
    );
  }
}
