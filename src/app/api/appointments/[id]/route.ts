import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  cancelAppointment,
  rescheduleAppointment,
} from "@/lib/appointments";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, userId: user.id },
      include: {
        lead: { select: { id: true, name: true, phone: true } },
        leadAction: { select: { id: true, type: true, status: true } },
      },
    });

    if (!appointment) return error("Agendamento não encontrado", 404);
    return json(appointment);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const appointment = await prisma.appointment.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!appointment) return error("Agendamento não encontrado", 404);

    // Rescheduling
    if (typeof body.scheduledAt === "string") {
      const newDate = new Date(body.scheduledAt);
      if (isNaN(newDate.getTime())) return error("scheduledAt inválido", 400);

      const result = await rescheduleAppointment(
        id,
        user.id,
        newDate,
        typeof body.address === "string" ? body.address : null,
      );
      if (!result) return error("Erro ao remarcar agendamento", 500);
      return json(result);
    }

    // Simple field updates (notes, address, title)
    const allowedUpdates: Record<string, unknown> = {};
    if (typeof body.notes === "string" || body.notes === null) {
      allowedUpdates.notes = body.notes;
    }
    if (typeof body.address === "string" || body.address === null) {
      allowedUpdates.address = body.address;
    }
    if (typeof body.title === "string" && body.title.trim()) {
      allowedUpdates.title = body.title.trim();
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return error("Nenhum campo válido para atualizar", 400);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { ...allowedUpdates, updatedAt: new Date() },
    });

    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const ok = await cancelAppointment(id, user.id);
    if (!ok) return error("Agendamento não encontrado", 404);
    return json({ cancelled: true });
  } catch (err) {
    return handleError(err);
  }
}
