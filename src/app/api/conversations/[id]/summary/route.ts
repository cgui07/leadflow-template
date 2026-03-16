import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import { generateSummary } from "@/features/conversations/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const summary = await generateSummary(user.id, id);

    return json(summary);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "CONVERSATION_NOT_FOUND") {
        return error("Conversa não encontrada", 404);
      }

      if (err.message === "CONVERSATION_EMPTY") {
        return error("Conversa sem mensagens", 400);
      }

      if (err.message === "CONVERSATION_AI_NOT_CONFIGURED") {
        return error("Configuração de IA não encontrada", 400);
      }

      if (err.message === "CONVERSATION_SUMMARY_FAILED") {
        return error("Não foi possível gerar o resumo", 500);
      }
    }

    return handleError(err);
  }
}
