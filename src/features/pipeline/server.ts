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

  return stages.map((stage, index) => ({
    id: stage.id,
    name: stage.name,
    color: stage.color,
    order: stage.order,
    isDefault: index === 0,
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

export async function updatePipelineStage(
  userId: string,
  stageId: string,
  input: Record<string, unknown>,
) {
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, userId },
  });

  if (!stage) {
    throw new Error("PIPELINE_STAGE_NOT_FOUND");
  }

  const defaultStage = await prisma.pipelineStage.findFirst({
    where: { userId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  if (defaultStage?.id === stageId) {
    throw new Error("PIPELINE_STAGE_IS_DEFAULT");
  }

  const data: Record<string, unknown> = {};

  if (typeof input.name === "string" && input.name.trim()) {
    data.name = input.name.trim();
  }

  if (typeof input.color === "string") {
    data.color = normalizePipelineColor(input.color);
  }

  if (Object.keys(data).length === 0) {
    throw new Error("PIPELINE_STAGE_NO_CHANGES");
  }

  return prisma.pipelineStage.update({
    where: { id: stageId },
    data,
  });
}

export async function deletePipelineStage(userId: string, stageId: string) {
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, userId },
  });

  if (!stage) {
    throw new Error("PIPELINE_STAGE_NOT_FOUND");
  }

  const defaultStage = await prisma.pipelineStage.findFirst({
    where: { userId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  if (defaultStage?.id === stageId) {
    throw new Error("PIPELINE_STAGE_IS_DEFAULT");
  }

  await prisma.lead.updateMany({
    where: { pipelineStageId: stageId, userId },
    data: { pipelineStageId: defaultStage!.id },
  });

  await prisma.pipelineStage.delete({ where: { id: stageId } });
}

export async function reorderPipelineStages(
  userId: string,
  stageIds: string[],
) {
  if (!Array.isArray(stageIds) || stageIds.length === 0) {
    throw new Error("PIPELINE_REORDER_INVALID");
  }

  const existingStages = await prisma.pipelineStage.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const existingIds = new Set(existingStages.map((s) => s.id));
  const allPresent = stageIds.every((id) => existingIds.has(id));
  if (!allPresent || stageIds.length !== existingStages.length) {
    throw new Error("PIPELINE_REORDER_INVALID");
  }

  // Use a transaction with temporary negative orders to avoid unique constraint conflicts
  await prisma.$transaction(
    stageIds.map((id, index) =>
      prisma.pipelineStage.update({
        where: { id },
        data: { order: -(index + 1) },
      }),
    ),
  );

  await prisma.$transaction(
    stageIds.map((id, index) =>
      prisma.pipelineStage.update({
        where: { id },
        data: { order: index },
      }),
    ),
  );
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
