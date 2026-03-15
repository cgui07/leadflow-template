import { prisma } from "./db";

export async function getDefaultPipelineStageId(userId: string) {
  const defaultStage = await prisma.pipelineStage.findFirst({
    where: { userId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  return defaultStage?.id ?? null;
}

export async function assignDefaultPipelineStageToUnassignedLeads(
  userId: string,
) {
  const defaultPipelineStageId = await getDefaultPipelineStageId(userId);

  if (!defaultPipelineStageId) {
    return 0;
  }

  const result = await prisma.lead.updateMany({
    where: {
      userId,
      pipelineStageId: null,
    },
    data: {
      pipelineStageId: defaultPipelineStageId,
    },
  });

  return result.count;
}
