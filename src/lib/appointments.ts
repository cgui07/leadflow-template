import { prisma } from "./db";
import {
  checkCalendarAvailability,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  suggestAlternativeSlots,
} from "./google-calendar";

export interface CreateAppointmentInput {
  userId: string;
  leadId: string;
  leadActionId?: string | null;
  title: string;
  scheduledAt: Date;
  durationMinutes?: number;
  address?: string | null;
  notes?: string | null;
}

export interface AppointmentResult {
  appointment: {
    id: string;
    title: string;
    scheduledAt: Date;
    status: string;
    googleEventId: string | null;
  };
  calendarCreated: boolean;
  wasAvailable: boolean;
  alternativeSlots?: Date[];
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<AppointmentResult> {
  const duration = input.durationMinutes ?? 60;
  const endTime = new Date(input.scheduledAt.getTime() + duration * 60 * 1000);

  const availability = await checkCalendarAvailability(
    input.userId,
    input.scheduledAt,
    endTime,
  );

  if (!availability.isAvailable) {
    const alternatives = await suggestAlternativeSlots(
      input.userId,
      input.scheduledAt,
      duration,
    );

    const appointment = await prisma.appointments.create({
      data: {
        user_id: input.userId,
        lead_id: input.leadId,
        lead_action_id: input.leadActionId ?? null,
        title: input.title,
        scheduled_at: input.scheduledAt,
        duration_minutes: duration,
        address: input.address ?? null,
        notes: input.notes ?? null,
        status: "conflict",
      },
    });

    return {
      appointment: {
        id: appointment.id,
        title: appointment.title,
        scheduledAt: appointment.scheduled_at,
        status: appointment.status,
        googleEventId: null,
      },
      calendarCreated: false,
      wasAvailable: false,
      alternativeSlots: alternatives,
    };
  }

  let googleEventId: string | null = null;
  let googleCalendarId: string | null = null;

  const created = await createCalendarEvent(input.userId, {
    summary: input.title,
    description: input.notes ?? undefined,
    location: input.address ?? undefined,
    startTime: input.scheduledAt,
    endTime,
  });

  if (created) {
    googleEventId = created.eventId;
    googleCalendarId = created.calendarId;
  }

  const appointment = await prisma.appointments.create({
    data: {
      user_id: input.userId,
      lead_id: input.leadId,
      lead_action_id: input.leadActionId ?? null,
      title: input.title,
      scheduled_at: input.scheduledAt,
      duration_minutes: duration,
      address: input.address ?? null,
      notes: input.notes ?? null,
      status: "confirmed",
      google_event_id: googleEventId,
      google_calendar_id: googleCalendarId,
    },
  });

  if (input.leadActionId) {
    await prisma.leadAction.update({
      where: { id: input.leadActionId },
      data: { status: "scheduled", scheduledAt: input.scheduledAt },
    });
  }

  await prisma.activity.create({
    data: {
      userId: input.userId,
      leadId: input.leadId,
      type: "appointment_created",
      title: "Visita agendada",
      description: `${input.title} para ${input.scheduledAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}${input.address ? ` — ${input.address}` : ""}`,
      metadata: {
        appointmentId: appointment.id,
        googleEventId,
        scheduledAt: input.scheduledAt.toISOString(),
      },
    },
  });

  return {
    appointment: {
      id: appointment.id,
      title: appointment.title,
      scheduledAt: appointment.scheduled_at,
      status: appointment.status,
      googleEventId,
    },
    calendarCreated: Boolean(googleEventId),
    wasAvailable: true,
  };
}

export async function cancelAppointment(
  appointmentId: string,
  userId: string,
): Promise<boolean> {
  const appointment = await prisma.appointments.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment || appointment.user_id !== userId) return false;

  if (appointment.google_event_id && appointment.google_calendar_id) {
    await deleteCalendarEvent(
      userId,
      appointment.google_event_id,
      appointment.google_calendar_id,
    );
  }

  await prisma.appointments.update({
    where: { id: appointmentId },
    data: { status: "cancelled", updated_at: new Date() },
  });

  if (appointment.lead_action_id) {
    await prisma.leadAction.update({
      where: { id: appointment.lead_action_id },
      data: { status: "cancelled" },
    });
  }

  await prisma.activity.create({
    data: {
      userId,
      leadId: appointment.lead_id,
      type: "appointment_cancelled",
      title: "Visita cancelada",
      description: `Agendamento cancelado: ${appointment.title}`,
    },
  });

  return true;
}

export async function rescheduleAppointment(
  appointmentId: string,
  userId: string,
  newScheduledAt: Date,
  address?: string | null,
): Promise<AppointmentResult | null> {
  const appointment = await prisma.appointments.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment || appointment.user_id !== userId) return null;

  const duration = appointment.duration_minutes;
  const endTime = new Date(newScheduledAt.getTime() + duration * 60 * 1000);
  const availability = await checkCalendarAvailability(
    userId,
    newScheduledAt,
    endTime,
  );

  if (!availability.isAvailable) {
    const alternatives = await suggestAlternativeSlots(
      userId,
      newScheduledAt,
      duration,
    );
    return {
      appointment: {
        id: appointment.id,
        title: appointment.title,
        scheduledAt: appointment.scheduled_at,
        status: appointment.status,
        googleEventId: appointment.google_event_id,
      },
      calendarCreated: false,
      wasAvailable: false,
      alternativeSlots: alternatives,
    };
  }

  if (appointment.google_event_id && appointment.google_calendar_id) {
    await updateCalendarEvent(
      userId,
      appointment.google_event_id,
      appointment.google_calendar_id,
      {
        startTime: newScheduledAt,
        endTime,
        location: address ?? appointment.address ?? undefined,
      },
    );
  }

  const updated = await prisma.appointments.update({
    where: { id: appointmentId },
    data: {
      scheduled_at: newScheduledAt,
      address: address ?? appointment.address,
      status: "confirmed",
      updated_at: new Date(),
    },
  });

  if (appointment.lead_action_id) {
    await prisma.leadAction.update({
      where: { id: appointment.lead_action_id },
      data: { scheduledAt: newScheduledAt },
    });
  }

  await prisma.activity.create({
    data: {
      userId,
      leadId: appointment.lead_id,
      type: "appointment_rescheduled",
      title: "Visita remarcada",
      description: `Remarcada para ${newScheduledAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    },
  });

  return {
    appointment: {
      id: updated.id,
      title: updated.title,
      scheduledAt: updated.scheduled_at,
      status: updated.status,
      googleEventId: updated.google_event_id,
    },
    calendarCreated: Boolean(updated.google_event_id),
    wasAvailable: true,
  };
}

export async function confirmAppointmentReply(
  leadId: string,
  reply: "confirmed" | "cancelled",
): Promise<boolean> {
  const appointment = await prisma.appointments.findFirst({
    where: { lead_id: leadId, status: "pending_confirmation" },
    orderBy: { scheduled_at: "asc" },
  });

  if (!appointment) return false;

  if (reply === "confirmed") {
    await prisma.appointments.update({
      where: { id: appointment.id },
      data: {
        status: "confirmed",
        confirmation_reply: "confirmed",
        updated_at: new Date(),
      },
    });
  } else {
    await cancelAppointment(appointment.id, appointment.user_id);
    await prisma.appointments
      .update({
        where: { id: appointment.id },
        data: { confirmation_reply: "cancelled" },
      })
      .catch(() => undefined);
  }

  return true;
}

export async function getPendingAppointmentForLead(leadId: string) {
  return prisma.appointments.findFirst({
    where: {
      lead_id: leadId,
      status: { in: ["confirmed", "pending_confirmation"] },
    },
    orderBy: { scheduled_at: "asc" },
  });
}

export async function getActiveAppointmentForLead(leadId: string) {
  return prisma.appointments.findFirst({
    where: {
      lead_id: leadId,
      status: { in: ["confirmed", "pending_confirmation", "conflict"] },
    },
    orderBy: { scheduled_at: "desc" },
  });
}

export async function getOpenVisitActionForLead(leadId: string) {
  return prisma.leadAction.findFirst({
    where: {
      leadId,
      type: "visit",
      status: { in: ["pending", "awaiting_schedule"] },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function ensureVisitAction(userId: string, leadId: string) {
  const existing = await getOpenVisitActionForLead(leadId);
  if (existing) return existing;

  return prisma.leadAction.create({
    data: {
      userId,
      leadId,
      type: "visit",
      status: "pending",
      title: "Visita solicitada",
      origin: "ai",
    },
  });
}
