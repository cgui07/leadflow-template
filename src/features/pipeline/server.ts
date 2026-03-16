import { prisma } from "@/lib/db";
import { normalizePipelineColor } from "@/lib/ui-colors";
import { assignDefaultPipelineStageToUnassignedLeads } from "@/lib/pipeline";

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function listPipelineStages(userId: string) {
  await assignDefaultPipelineStageToUnassignedLeads(userId);

  const stages = await prisma.pipelineStage.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    include: {
      leads: {
        select: {
          id: true,
          name: true,
          phone: true,
          score: true,
          value: true,
          status: true,
          lastContactAt: true,
          createdAt: true,
        },
        orderBy: { score: "desc" },
      },
    },
  });

  return stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    color: stage.color,
    order: stage.order,
    leads: stage.leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      score: lead.score,
      value: lead.value ? toNumber(lead.value) : null,
      status: lead.status,
      lastContactAt: lead.lastContactAt?.toISOString() ?? null,
      createdAt: lead.createdAt.toISOString(),
    })),
  }));
}

export async function createPipelineStage(
  userId: string,
  input: Record<string, unknown>,
) {
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (!name) {
    throw new Error("PIPELINE_STAGE_NAME_REQUIRED");
  }

  const maxOrder = await prisma.pipelineStage.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
  });

  return prisma.pipelineStage.create({
    data: {
      userId,
      name,
      color: normalizePipelineColor(
        typeof input.color === "string" ? input.color : undefined,
      ),
      order: (maxOrder?.order ?? -1) + 1,
    },
  });
}

export async function moveLeadToStage(
  userId: string,
  input: Record<string, unknown>,
) {
  const leadId = typeof input.leadId === "string" ? input.leadId : "";
  const stageId = typeof input.stageId === "string" ? input.stageId : "";

  if (!leadId || !stageId) {
    throw new Error("PIPELINE_MOVE_INVALID");
  }

  const [lead, stage] = await Promise.all([
    prisma.lead.findFirst({ where: { id: leadId, userId } }),
    prisma.pipelineStage.findFirst({ where: { id: stageId, userId } }),
  ]);

  if (!lead) {
    throw new Error("PIPELINE_LEAD_NOT_FOUND");
  }

  if (!stage) {
    throw new Error("PIPELINE_STAGE_NOT_FOUND");
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { pipelineStageId: stageId },
  });

  await prisma.activity.create({
    data: {
      userId,
      leadId,
      type: "status_change",
      title: `Movido para ${stage.name}`,
      metadata: { stageId, stageName: stage.name },
    },
  });
}
