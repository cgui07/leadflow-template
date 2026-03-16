import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import {
  createPipelineStage,
  listPipelineStages,
} from "@/features/pipeline/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const stages = await listPipelineStages(user.id);

    return json(stages);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const stage = await createPipelineStage(
      user.id,
      (await req.json()) as Record<string, unknown>,
    );

    return json(stage, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "PIPELINE_STAGE_NAME_REQUIRED") {
      return error("Nome do estagio e obrigatorio");
    }

    if (err instanceof SyntaxError) {
      return error("Payload inválido");
    }

    return handleError(err);
  }
}
