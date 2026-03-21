import { MoveLeadSchema } from "@/lib/schemas";
import { json, withApiHandler } from "@/lib/api";
import { moveLeadToStage } from "@/features/pipeline/server";

export const POST = withApiHandler(MoveLeadSchema, async (user, data) => {
  await moveLeadToStage(user.id, data as Record<string, unknown>);
  return json({ ok: true });
});
