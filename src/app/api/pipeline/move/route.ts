import { prisma } from "@/lib/db";
import { json, error, requireAuth, handleError } from "@/lib/api";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { leadId, stageId } = await req.json();

    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: user.id } });
    if (!lead) return error("Lead não encontrado", 404);

    const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, userId: user.id } });
    if (!stage) return error("Estágio não encontrado", 404);

    await prisma.lead.update({
      where: { id: leadId },
      data: { pipelineStageId: stageId },
    });

    await prisma.activity.create({
      data: {
        userId: user.id,
        leadId,
        type: "status_change",
        title: `Movido para ${stage.name}`,
        metadata: { stageId, stageName: stage.name },
      },
    });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
