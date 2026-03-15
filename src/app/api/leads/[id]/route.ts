import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { json, error, requireAuth, handleError } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, userId: user.id },
      include: {
        pipelineStage: true,
        conversation: {
          include: { messages: { orderBy: { createdAt: "desc" }, take: 50 } },
        },
        activities: { orderBy: { createdAt: "desc" }, take: 20 },
        tasks: { orderBy: { dueAt: "asc" }, where: { status: "pending" } },
      },
    });

    if (!lead) return error("Lead não encontrado", 404);

    return json(lead);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.lead.findFirst({ where: { id, userId: user.id } });
    if (!existing) return error("Lead não encontrado", 404);

    if (data.status && data.status !== existing.status) {
      await prisma.activity.create({
        data: {
          userId: user.id,
          leadId: id,
          type: "status_change",
          title: `Status alterado para ${data.status}`,
          metadata: { from: existing.status, to: data.status },
        },
      });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        status: data.status,
        score: data.score,
        value: data.value,
        region: data.region,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        propertyType: data.propertyType,
        purpose: data.purpose,
        timeline: data.timeline,
        bedrooms: data.bedrooms,
        notes: data.notes,
        pipelineStageId: data.pipelineStageId,
      },
    });

    return json(lead);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.lead.findFirst({ where: { id, userId: user.id } });
    if (!existing) return error("Lead não encontrado", 404);

    await prisma.lead.delete({ where: { id } });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
