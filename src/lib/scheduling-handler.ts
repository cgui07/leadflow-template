import { prisma } from "./db";
import type { AIConfig } from "./ai";
import { extractSchedulingIntent } from "./scheduling-intent";
import { getWhatsAppConfig, sendAndSaveMessage } from "./whatsapp";
import {
  createAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getActiveAppointmentForLead,
  ensureVisitAction,
  confirmAppointmentReply,
} from "./appointments";

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

const CONFIRM_PATTERN =
  /^(sim|s|yes|confirmo|confirmado|pode ser|ok|tá bom|ta bom|combinado|com certeza|claro)[\s!.]*$/i;

const CANCEL_PATTERN =
  /^(não|nao|n|no|cancelar|cancelado|não vou|nao vou|não posso|nao posso|preciso cancelar|vou cancelar)[\s!.]*$/i;

export async function handleConfirmationReplyIfNeeded(
  leadId: string,
  userId: string,
  conversationId: string,
  replyJid: string,
  latestMessage: string,
  settings: UserSettingsSnapshot,
): Promise<boolean> {
  const pending = await prisma.appointments.findFirst({
    where: { lead_id: leadId, status: "pending_confirmation" },
    orderBy: { scheduled_at: "asc" },
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
    const time = pending.scheduled_at.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const date = pending.scheduled_at.toLocaleDateString("pt-BR", {
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

export async function handleSchedulingIfNeeded(
  input: HandleSchedulingInput,
): Promise<void> {
  console.log("[scheduling] handleSchedulingIfNeeded called for lead:", input.leadId);

  const intent = await extractSchedulingIntent(input.aiConfig, input.messages);

  console.log("[scheduling] Extracted intent:", JSON.stringify(intent));

  if (!intent.hasIntent) {
    console.log("[scheduling] No intent detected — skipping");
    return;
  }

  // ── Cancelamento ──────────────────────────────────────────────────────────
  if (intent.isCancellation) {
    const active = await getActiveAppointmentForLead(input.leadId);
    if (!active) {
      console.log("[scheduling] Cancellation intent but no active appointment — skipping");
      return;
    }

    console.log("[scheduling] Cancelling appointment:", active.id);
    await cancelAppointment(active.id, input.userId);

    if (!input.settings.whatsappPhoneId) return;
    const config = getWhatsAppConfig(input.settings.whatsappPhoneId);
    await sendAndSaveMessage(
      config,
      input.conversationId,
      input.replyJid,
      "Ok, visita cancelada! Se quiser reagendar é só me falar 😊",
      "bot",
    );
    return;
  }

  // ── Confirmação simples (sem data nova) ───────────────────────────────────
  if (intent.isConfirmation) {
    console.log("[scheduling] Confirmation intent — skipping (handled elsewhere)");
    return;
  }

  // ── Agendamento ou reagendamento com data ─────────────────────────────────
  if (!intent.proposedDate || !intent.proposedTime) {
    console.log("[scheduling] Intent but no date/time — skipping");
    return;
  }

  const scheduledAt = new Date(
    `${intent.proposedDate}T${intent.proposedTime}:00-03:00`,
  );
  if (isNaN(scheduledAt.getTime())) {
    console.log("[scheduling] Invalid date parsed — skipping");
    return;
  }
  if (scheduledAt < new Date()) {
    console.log("[scheduling] Date is in the past:", scheduledAt.toISOString(), "— skipping");
    return;
  }

  // ── Reagendamento explícito ───────────────────────────────────────────────
  if (intent.isReschedulingRequest) {
    const active = await getActiveAppointmentForLead(input.leadId);
    if (!active) {
      console.log("[scheduling] Reschedule intent but no active appointment — creating new");
    } else {
      console.log("[scheduling] Rescheduling appointment:", active.id, "to", scheduledAt.toISOString());
      const result = await rescheduleAppointment(
        active.id,
        input.userId,
        scheduledAt,
        intent.address,
      );

      if (!result || !input.settings.whatsappPhoneId) return;
      const config = getWhatsAppConfig(input.settings.whatsappPhoneId);

      if (result.wasAvailable) {
        const calendarNote = result.calendarCreated ? "\nJá atualizei na agenda 📅" : "";
        await sendAndSaveMessage(
          config,
          input.conversationId,
          input.replyJid,
          `✅ Visita remarcada para ${formatDate(scheduledAt)} às ${formatTime(scheduledAt)}!${intent.address ? `\n📍 ${intent.address}` : ""}${calendarNote}`,
          "bot",
        );
      } else if (result.alternativeSlots && result.alternativeSlots.length > 0) {
        await sendAndSaveMessage(
          config,
          input.conversationId,
          input.replyJid,
          `Esse horário já está ocupado. Que tal um desses?\n\n${formatSlots(result.alternativeSlots)}`,
          "bot",
        );
      }
      return;
    }
  }

  // ── Novo agendamento (permite múltiplas visitas por lead) ─────────────────
  const openAction = await ensureVisitAction(input.userId, input.leadId);

  const result = await createAppointment({
    userId: input.userId,
    leadId: input.leadId,
    leadActionId: openAction.id,
    title: `Visita — ${input.leadName}`,
    scheduledAt,
    address: intent.address ?? null,
  });

  console.log("[scheduling] Appointment created:", result.appointment.id, "calendar:", result.calendarCreated);

  if (!input.settings.whatsappPhoneId) return;
  const config = getWhatsAppConfig(input.settings.whatsappPhoneId);

  if (result.wasAvailable) {
    const calendarNote = result.calendarCreated ? "\nJá coloquei na agenda 📅" : "";
    await sendAndSaveMessage(
      config,
      input.conversationId,
      input.replyJid,
      `✅ Visita agendada para ${formatDate(scheduledAt)} às ${formatTime(scheduledAt)}!${intent.address ? `\n📍 ${intent.address}` : ""}${calendarNote}`,
      "bot",
    );
  } else if (result.alternativeSlots && result.alternativeSlots.length > 0) {
    await sendAndSaveMessage(
      config,
      input.conversationId,
      input.replyJid,
      `Esse horário já está ocupado na minha agenda. Que tal um desses?\n\n${formatSlots(result.alternativeSlots)}`,
      "bot",
    );
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function formatSlots(slots: Date[]): string {
  return slots
    .map((slot) => {
      const d = slot.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      return `• ${d} às ${formatTime(slot)}`;
    })
    .join("\n");
}
