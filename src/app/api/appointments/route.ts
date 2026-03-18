import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import { prisma } from "@/lib/db";
import { createAppointment } from "@/lib/appointments";

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

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = (await req.json()) as Record<string, unknown>;

    const leadId = typeof body.leadId === "string" ? body.leadId : null;
    const title = typeof body.title === "string" ? body.title.trim() : null;
    const scheduledAtRaw =
      typeof body.scheduledAt === "string" ? body.scheduledAt : null;

    if (!leadId || !title || !scheduledAtRaw) {
      return error("leadId, title e scheduledAt são obrigatórios", 400);
    }

    const scheduledAt = new Date(scheduledAtRaw);
    if (isNaN(scheduledAt.getTime())) {
      return error("scheduledAt inválido", 400);
    }

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: user.id },
      select: { id: true },
    });
    if (!lead) return error("Lead não encontrado", 404);

    const result = await createAppointment({
      userId: user.id,
      leadId,
      leadActionId:
        typeof body.leadActionId === "string" ? body.leadActionId : null,
      title,
      scheduledAt,
      durationMinutes:
        typeof body.durationMinutes === "number" ? body.durationMinutes : 60,
      address: typeof body.address === "string" ? body.address : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    });

    return json(result, 201);
  } catch (err) {
    return handleError(err);
  }
}
