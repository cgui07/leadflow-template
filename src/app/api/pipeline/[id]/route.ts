import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import {
  updatePipelineStage,
  deletePipelineStage,
} from "@/features/pipeline/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const stage = await updatePipelineStage(user.id, id, body);
    return json(stage);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "PIPELINE_STAGE_NOT_FOUND") {
        return error("Estágio não encontrado.", 404);
      }
      if (err.message === "PIPELINE_STAGE_IS_DEFAULT") {
        return error("A primeira coluna não pode ser editada.", 403);
      }
      if (err.message === "PIPELINE_STAGE_NO_CHANGES") {
        return error("Nenhuma alteração informada.", 400);
      }
    }

    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await deletePipelineStage(user.id, id);
    return json({ ok: true });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "PIPELINE_STAGE_NOT_FOUND") {
        return error("Estágio não encontrado.", 404);
      }
      if (err.message === "PIPELINE_STAGE_IS_DEFAULT") {
        return error("A primeira coluna não pode ser removida.", 403);
      }
    }

    return handleError(err);
  }
}
