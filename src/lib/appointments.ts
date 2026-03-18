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

    const appointment = await prisma.appointment.create({
      data: {
        userId: input.userId,
        leadId: input.leadId,
        leadActionId: input.leadActionId ?? null,
        title: input.title,
        scheduledAt: input.scheduledAt,
        durationMinutes: duration,
        address: input.address ?? null,
        notes: input.notes ?? null,
        status: "conflict",
      },
    });

    return {
      appointment: {
        id: appointment.id,
        title: appointment.title,
        scheduledAt: appointment.scheduledAt,
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

  const appointment = await prisma.appointment.create({
    data: {
      userId: input.userId,
      leadId: input.leadId,
      leadActionId: input.leadActionId ?? null,
      title: input.title,
      scheduledAt: input.scheduledAt,
      durationMinutes: duration,
      address: input.address ?? null,
      notes: input.notes ?? null,
      status: "confirmed",
      googleEventId,
      googleCalendarId,
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
      scheduledAt: appointment.scheduledAt,
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
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment || appointment.userId !== userId) return false;

  if (appointment.googleEventId && appointment.googleCalendarId) {
    await deleteCalendarEvent(
      userId,
      appointment.googleEventId,
      appointment.googleCalendarId,
    );
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "cancelled", updatedAt: new Date() },
  });

  if (appointment.leadActionId) {
    await prisma.leadAction.update({
      where: { id: appointment.leadActionId },
      data: { status: "cancelled" },
    });
  }

  await prisma.activity.create({
    data: {
      userId,
      leadId: appointment.leadId,
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
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment || appointment.userId !== userId) return null;

  const duration = appointment.durationMinutes;
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
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
        googleEventId: appointment.googleEventId,
      },
      calendarCreated: false,
      wasAvailable: false,
      alternativeSlots: alternatives,
    };
  }

  if (appointment.googleEventId && appointment.googleCalendarId) {
    await updateCalendarEvent(
      userId,
      appointment.googleEventId,
      appointment.googleCalendarId,
      {
        startTime: newScheduledAt,
        endTime,
        location: address ?? appointment.address ?? undefined,
      },
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      scheduledAt: newScheduledAt,
      address: address ?? appointment.address,
      status: "confirmed",
      updatedAt: new Date(),
    },
  });

  if (appointment.leadActionId) {
    await prisma.leadAction.update({
      where: { id: appointment.leadActionId },
      data: { scheduledAt: newScheduledAt },
    });
  }

  await prisma.activity.create({
    data: {
      userId,
      leadId: appointment.leadId,
      type: "appointment_rescheduled",
      title: "Visita remarcada",
      description: `Remarcada para ${newScheduledAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    },
  });

  return {
    appointment: {
      id: updated.id,
      title: updated.title,
      scheduledAt: updated.scheduledAt,
      status: updated.status,
      googleEventId: updated.googleEventId,
    },
    calendarCreated: Boolean(updated.googleEventId),
    wasAvailable: true,
  };
}

export async function confirmAppointmentReply(
  leadId: string,
  reply: "confirmed" | "cancelled",
): Promise<boolean> {
  const appointment = await prisma.appointment.findFirst({
    where: { leadId, status: "pending_confirmation" },
    orderBy: { scheduledAt: "asc" },
  });

  if (!appointment) return false;

  if (reply === "confirmed") {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: "confirmed",
        confirmationReply: "confirmed",
        updatedAt: new Date(),
      },
    });
  } else {
    await cancelAppointment(appointment.id, appointment.userId);
    // Update confirmationReply even after cancel (best effort)
    await prisma.appointment
      .update({
        where: { id: appointment.id },
        data: { confirmationReply: "cancelled" },
      })
      .catch(() => undefined);
  }

  return true;
}

export async function getPendingAppointmentForLead(leadId: string) {
  return prisma.appointment.findFirst({
    where: {
      leadId,
      status: { in: ["confirmed", "pending_confirmation"] },
    },
    orderBy: { scheduledAt: "asc" },
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
