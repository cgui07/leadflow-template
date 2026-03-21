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
import { logger } from "./logger";

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

type SchedulingIntent = Awaited<ReturnType<typeof extractSchedulingIntent>>;

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
  logger.info("handleSchedulingIfNeeded called", { leadId: input.leadId });

  const intent = await extractSchedulingIntent(input.aiConfig, input.messages);

  logger.info("Extracted intent", { intent: JSON.stringify(intent) });

  if (!intent.hasIntent) {
    logger.info("No intent detected — skipping");
    return;
  }

  if (intent.isCancellation) {
    await handleCancellationIntent(intent, input);
    return;
  }

  if (intent.isConfirmation) {
    logger.info("Confirmation intent — skipping (handled elsewhere)");
    return;
  }

  if (!intent.proposedDate || !intent.proposedTime) {
    logger.info("Intent but no date/time — skipping");
    return;
  }

  const scheduledAt = new Date(
    `${intent.proposedDate}T${intent.proposedTime}:00-03:00`,
  );
  if (isNaN(scheduledAt.getTime())) {
    logger.info("Invalid date parsed — skipping");
    return;
  }
  if (scheduledAt < new Date()) {
    logger.info("Date is in the past — skipping", { scheduledAt: scheduledAt.toISOString() });
    return;
  }

  if (intent.isReschedulingRequest) {
    const handled = await handleReschedulingIntent(intent, input, scheduledAt);
    if (handled) return;
  }

  await handleNewAppointmentIntent(intent, input, scheduledAt);
}

async function handleCancellationIntent(
  intent: SchedulingIntent,
  input: HandleSchedulingInput,
): Promise<void> {
  let appointment;

  const cancelDateStr = intent.originalDate || intent.proposedDate;
  if (cancelDateStr) {
    const targetDate = new Date(`${cancelDateStr}T00:00:00-03:00`);
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
    appointment = await prisma.appointments.findFirst({
      where: {
        lead_id: input.leadId,
        status: { in: ["confirmed", "pending_confirmation"] },
        scheduled_at: { gte: targetDate, lt: nextDay },
      },
    });
    logger.info("Looking for appointment to cancel", { date: cancelDateStr, found: appointment?.id ?? "none" });
  }

  if (!appointment) {
    appointment = await prisma.appointments.findFirst({
      where: {
        lead_id: input.leadId,
        status: { in: ["confirmed", "pending_confirmation"] },
        scheduled_at: { gte: new Date() },
      },
      orderBy: { scheduled_at: "asc" },
    });
  }

  if (!appointment) {
    logger.info("Cancellation intent but no matching appointment — skipping");
    return;
  }

  logger.info("Cancelling appointment", { appointmentId: appointment.id, scheduledAt: appointment.scheduled_at.toISOString() });
  await cancelAppointment(appointment.id, input.userId);

  if (!input.settings.whatsappPhoneId) return;
  const config = getWhatsAppConfig(input.settings.whatsappPhoneId);

  const cancelledDates: string[] = [];
  cancelledDates.push(
    `${formatDate(appointment.scheduled_at)} às ${formatTime(appointment.scheduled_at)}`,
  );

  for (const extra of intent.additionalDates) {
    const targetDate = new Date(`${extra.date}T00:00:00-03:00`);
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
    const extraAppt = await prisma.appointments.findFirst({
      where: {
        lead_id: input.leadId,
        status: { in: ["confirmed", "pending_confirmation"] },
        scheduled_at: { gte: targetDate, lt: nextDay },
      },
    });
    if (extraAppt) {
      logger.info("Cancelling additional appointment", { appointmentId: extraAppt.id, date: extra.date });
      await cancelAppointment(extraAppt.id, input.userId);
      cancelledDates.push(
        `${formatDate(extraAppt.scheduled_at)} às ${formatTime(extraAppt.scheduled_at)}`,
      );
    } else {
      logger.info("No appointment found to cancel — skipping", { date: extra.date });
    }
  }

  if (cancelledDates.length === 1) {
    await sendAndSaveMessage(
      config,
      input.conversationId,
      input.replyJid,
      `Ok, visita de ${cancelledDates[0]} cancelada! Se quiser reagendar é só me falar 😊`,
      "bot",
    );
  } else {
    const list = cancelledDates.map((d) => `• ${d}`).join("\n");
    await sendAndSaveMessage(
      config,
      input.conversationId,
      input.replyJid,
      `Ok, visitas canceladas!\n\n${list}\n\nSe quiser reagendar é só me falar 😊`,
      "bot",
    );
  }
}

// Returns true if rescheduling was handled, false if a new appointment should be created instead.
async function handleReschedulingIntent(
  intent: SchedulingIntent,
  input: HandleSchedulingInput,
  scheduledAt: Date,
): Promise<boolean> {
  let active;

  if (intent.originalDate) {
    const targetDate = new Date(`${intent.originalDate}T00:00:00-03:00`);
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
    active = await prisma.appointments.findFirst({
      where: {
        lead_id: input.leadId,
        status: { in: ["confirmed", "pending_confirmation"] },
        scheduled_at: { gte: targetDate, lt: nextDay },
      },
    });
    logger.info("Looking for appointment to reschedule", { date: intent.originalDate, found: active?.id ?? "none" });
  }

  if (!active) {
    active = await getActiveAppointmentForLead(input.leadId);
  }

  if (!active) {
    logger.info("Reschedule intent but no active appointment — creating new");
    return false;
  }

  logger.info("Rescheduling appointment", { appointmentId: active.id, newScheduledAt: scheduledAt.toISOString() });
  const result = await rescheduleAppointment(
    active.id,
    input.userId,
    scheduledAt,
    intent.address,
  );

  if (!result || !input.settings.whatsappPhoneId) return true;
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
  return true;
}

async function handleNewAppointmentIntent(
  intent: SchedulingIntent,
  input: HandleSchedulingInput,
  scheduledAt: Date,
): Promise<void> {
  const openAction = await ensureVisitAction(input.userId, input.leadId);

  const result = await createAppointment({
    userId: input.userId,
    leadId: input.leadId,
    leadActionId: openAction.id,
    title: `Visita — ${input.leadName}`,
    scheduledAt,
    address: intent.address ?? null,
  });

  logger.info("Appointment created", { appointmentId: result.appointment.id, calendarCreated: result.calendarCreated });

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

  // ── Additional dates from the same message ──────────────────────────────
  for (const extra of intent.additionalDates) {
    const extraAt = new Date(`${extra.date}T${extra.time}:00-03:00`);
    if (isNaN(extraAt.getTime()) || extraAt < new Date()) {
      logger.info("Skipping additional date (invalid or past)", { date: extra.date, time: extra.time });
      continue;
    }

    const extraAction = await ensureVisitAction(input.userId, input.leadId);
    const extraResult = await createAppointment({
      userId: input.userId,
      leadId: input.leadId,
      leadActionId: extraAction.id,
      title: `Visita — ${input.leadName}`,
      scheduledAt: extraAt,
      address: intent.address ?? null,
    });

    logger.info("Additional appointment created", { appointmentId: extraResult.appointment.id, calendarCreated: extraResult.calendarCreated });

    if (extraResult.wasAvailable) {
      const calendarNote = extraResult.calendarCreated ? "\nJá coloquei na agenda 📅" : "";
      await sendAndSaveMessage(
        config,
        input.conversationId,
        input.replyJid,
        `✅ Visita agendada para ${formatDate(extraAt)} às ${formatTime(extraAt)}!${intent.address ? `\n📍 ${intent.address}` : ""}${calendarNote}`,
        "bot",
      );
    } else if (extraResult.alternativeSlots && extraResult.alternativeSlots.length > 0) {
      await sendAndSaveMessage(
        config,
        input.conversationId,
        input.replyJid,
        `O horário de ${formatDate(extraAt)} às ${formatTime(extraAt)} já está ocupado. Que tal um desses?\n\n${formatSlots(extraResult.alternativeSlots)}`,
        "bot",
      );
    }
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
