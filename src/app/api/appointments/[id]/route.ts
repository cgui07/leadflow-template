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

    const appointment = await prisma.appointments.findFirst({
      where: { id, user_id: user.id },
      include: {
        leads: { select: { id: true, name: true, phone: true } },
        lead_actions: { select: { id: true, type: true, status: true } },
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

    const appointment = await prisma.appointments.findFirst({
      where: { id, user_id: user.id },
      select: { id: true },
    });
    if (!appointment) return error("Agendamento não encontrado", 404);

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

    const updated = await prisma.appointments.update({
      where: { id },
      data: { ...allowedUpdates, updated_at: new Date() },
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
