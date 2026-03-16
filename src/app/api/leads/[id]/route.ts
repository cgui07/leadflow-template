import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { isLeadStatus } from "@/lib/lead-status";
import { json, error, requireAuth, handleError } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
        leadActions: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
      },
    });

    if (!lead) return error("Lead não encontrado", 404);

    return json(lead);
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
    const data = await req.json();

    const existing = await prisma.lead.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return error("Lead não encontrado", 404);

    if (
      data.status &&
      (typeof data.status !== "string" || !isLeadStatus(data.status))
    ) {
      return error("Status de lead inválido", 400);
    }

    if (data.pipelineStageId !== undefined && data.pipelineStageId !== null) {
      if (
        typeof data.pipelineStageId !== "string" ||
        !data.pipelineStageId.trim()
      ) {
        return error("Estágio inválido", 400);
      }

      const stage = await prisma.pipelineStage.findFirst({
        where: { id: data.pipelineStageId, userId: user.id },
        select: { id: true },
      });

      if (!stage) {
        return error("Estágio não encontrado", 404);
      }
    }

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
        ...(typeof data.name === "string" && { name: data.name.trim() }),
        ...(typeof data.phone === "string" && { phone: data.phone.trim() }),
        ...(data.email !== undefined && {
          email:
            typeof data.email === "string" && data.email.trim()
              ? data.email.trim()
              : null,
        }),
        status: data.status,
        score: data.score,
        value: data.value,
        ...(data.region !== undefined && {
          region:
            typeof data.region === "string" && data.region.trim()
              ? data.region.trim()
              : null,
        }),
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        ...(data.propertyType !== undefined && {
          propertyType:
            typeof data.propertyType === "string" && data.propertyType.trim()
              ? data.propertyType.trim()
              : null,
        }),
        ...(data.purpose !== undefined && {
          purpose:
            typeof data.purpose === "string" && data.purpose.trim()
              ? data.purpose.trim()
              : null,
        }),
        ...(data.timeline !== undefined && {
          timeline:
            typeof data.timeline === "string" && data.timeline.trim()
              ? data.timeline.trim()
              : null,
        }),
        bedrooms: data.bedrooms,
        ...(data.notes !== undefined && {
          notes:
            typeof data.notes === "string" && data.notes.trim()
              ? data.notes.trim()
              : null,
        }),
        pipelineStageId: data.pipelineStageId,
      },
    });

    return json(lead);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.lead.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return error("Lead não encontrado", 404);

    await prisma.lead.delete({ where: { id } });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
