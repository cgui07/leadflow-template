import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { createAppointment } from "@/lib/appointments";
import { CreateAppointmentSchema } from "@/lib/schemas";
import { error, handleError, json, requireAuth, withApiHandler } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const status = searchParams.get("status");

    const appointments = await prisma.appointments.findMany({
      where: {
        user_id: user.id,
        ...(leadId ? { lead_id: leadId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        leads: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { scheduled_at: "asc" },
      take: 50,
    });

    return json(appointments);
  } catch (err) {
    return handleError(err);
  }
}

export const POST = withApiHandler(CreateAppointmentSchema, async (user, data) => {
  const scheduledAt = new Date(data.scheduledAt);
  if (isNaN(scheduledAt.getTime())) {
    return error("scheduledAt inválido", 400);
  }

  const lead = await prisma.lead.findFirst({
    where: { id: data.leadId, userId: user.id },
    select: { id: true },
  });
  if (!lead) return error("Lead não encontrado", 404);

  const result = await createAppointment({
    userId: user.id,
    leadId: data.leadId,
    leadActionId: data.leadActionId ?? null,
    title: data.title,
    scheduledAt,
    durationMinutes: data.durationMinutes ?? 60,
    address: data.address ?? null,
    notes: data.notes ?? null,
  });

  return json(result, 201);
});
