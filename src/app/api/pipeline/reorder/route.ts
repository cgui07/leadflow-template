import { json, withApiHandler } from "@/lib/api";
import { ReorderStagesSchema } from "@/lib/schemas";
import { reorderPipelineStages } from "@/features/pipeline/server";

export const POST = withApiHandler(ReorderStagesSchema, async (user, data) => {
  await reorderPipelineStages(user.id, data.stageIds);
  return json({ ok: true });
});
