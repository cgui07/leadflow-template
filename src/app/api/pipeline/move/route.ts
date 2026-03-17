import { NextRequest } from "next/server";
import { moveLeadToStage } from "@/features/pipeline/server";
import { error, handleError, json, requireAuth } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    await moveLeadToStage(
      user.id,
      (await req.json()) as Record<string, unknown>,
    );

    return json({ ok: true });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "PIPELINE_MOVE_INVALID") {
        return error("Lead e estágio são obrigatórios");
      }

      if (err.message === "PIPELINE_LEAD_NOT_FOUND") {
        return error("Lead não encontrado", 404);
      }

      if (err.message === "PIPELINE_STAGE_NOT_FOUND") {
        return error("Estágio não encontrado", 404);
      }
    }

    if (err instanceof SyntaxError) {
      return error("Payload inválido");
    }

    return handleError(err);
  }
}
