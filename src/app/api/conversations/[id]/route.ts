import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import { updateConversationStatus } from "@/features/conversations/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const updated = await updateConversationStatus(user.id, id, body.status);

    return json(updated);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "CONVERSATION_STATUS_INVALID") {
        return error("Status invalido. Use 'bot' ou 'human'.", 400);
      }

      if (err.message === "CONVERSATION_NOT_FOUND") {
        return error("Conversa nao encontrada", 404);
      }
    }

    if (err instanceof SyntaxError) {
      return error("Payload invalido");
    }

    return handleError(err);
  }
}
