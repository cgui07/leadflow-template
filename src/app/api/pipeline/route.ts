import { handleError, json, requireAuth, withApiHandler } from "@/lib/api";
import {
  createPipelineStage,
  listPipelineStages,
} from "@/features/pipeline/server";
import { CreateStageSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const user = await requireAuth();
    const stages = await listPipelineStages(user.id);

    return json(stages);
  } catch (err) {
    return handleError(err);
  }
}

export const POST = withApiHandler(CreateStageSchema, async (user, data) => {
  const stage = await createPipelineStage(
    user.id,
    data as Record<string, unknown>,
  );
  return json(stage, 201);
});
