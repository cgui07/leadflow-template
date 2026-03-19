import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import { reorderPipelineStages } from "@/features/pipeline/server";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = (await req.json()) as { stageIds?: string[] };

    if (!Array.isArray(body.stageIds)) {
      return error("Lista de estágios inválida.", 400);
    }

    await reorderPipelineStages(user.id, body.stageIds);
    return json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "PIPELINE_REORDER_INVALID") {
      return error("Ordem inválida — todos os estágios devem estar presentes.", 400);
    }

    return handleError(err);
  }
}
