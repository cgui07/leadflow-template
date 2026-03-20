import { prisma } from "./db";
import type { AIConfig } from "./ai";
import { extractSchedulingIntent } from "./scheduling-intent";
import { getWhatsAppConfig, sendAndSaveMessage } from "./whatsapp";
import {
  createAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getPendingAppointmentForLead,
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
  const intent = await extractSchedulingIntent(input.aiConfig, input.messages);

  if (!intent.hasIntent || !intent.proposedDate || !intent.proposedTime) return;
  if (intent.isConfirmation || intent.isCancellation) return;

  // Parse in Brasília timezone (UTC-3) to avoid treating local times as UTC
  const scheduledAt = new Date(
    `${intent.proposedDate}T${intent.proposedTime}:00-03:00`,
  );
  if (isNaN(scheduledAt.getTime())) return;
  if (scheduledAt < new Date()) return;

  if (intent.isReschedulingRequest) {
    const active = await getActiveAppointmentForLead(input.leadId);
    if (!active) return;

    const result = await rescheduleAppointment(
      active.id,
      input.userId,
      scheduledAt,
      intent.address,
    );

    if (!result || !input.settings.whatsappPhoneId) return;

    const config = getWhatsAppConfig(input.settings.whatsappPhoneId);

    if (result.wasAvailable) {
      await sendAndSaveMessage(
        config,
        input.conversationId,
        input.replyJid,
        `✅ Visita remarcada para ${formatDate(scheduledAt)} às ${formatTime(scheduledAt)}!${intent.address ? `\n📍 ${intent.address}` : ""}${result.calendarCreated ? " Agenda atualizada. 📅" : ""}`,
        "bot",
      );
    } else if (result.alternativeSlots && result.alternativeSlots.length > 0) {
      await sendAndSaveMessage(
        config,
        input.conversationId,
        input.replyJid,
        `Esse novo horário também está ocupado. Que tal um desses?\n\n${formatSlots(result.alternativeSlots)}`,
        "bot",
      );
    }
    return;
  }

  const existing = await getPendingAppointmentForLead(input.leadId);
  if (existing) return;

  const openAction = await ensureVisitAction(input.userId, input.leadId);

  const oldConflict = await getActiveAppointmentForLead(input.leadId);
  if (oldConflict && oldConflict.status === "conflict") {
    await cancelAppointment(oldConflict.id, input.userId);
  }

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
    await sendAndSaveMessage(
      config,
      input.conversationId,
      input.replyJid,
      `✅ Visita agendada para ${formatDate(scheduledAt)} às ${formatTime(scheduledAt)}!${intent.address ? `\n📍 ${intent.address}` : ""}${result.calendarCreated ? " Adicionado na agenda do corretor. 📅" : ""}`,
      "bot",
    );
  } else if (result.alternativeSlots && result.alternativeSlots.length > 0) {
    await sendAndSaveMessage(
      config,
      input.conversationId,
      input.replyJid,
      `Infelizmente esse horário já está ocupado na minha agenda. Que tal um desses?\n\n${formatSlots(result.alternativeSlots)}`,
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
