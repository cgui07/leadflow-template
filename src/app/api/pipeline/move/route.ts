import { moveLeadToStage } from "@/features/pipeline/server";
import { json, withApiHandler } from "@/lib/api";
import { MoveLeadSchema } from "@/lib/schemas";

export const POST = withApiHandler(MoveLeadSchema, async (user, data) => {
  await moveLeadToStage(user.id, data as Record<string, unknown>);
  return json({ ok: true });
});
