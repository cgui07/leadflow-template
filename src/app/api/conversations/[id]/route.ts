import { NextRequest } from "next/server";
import { UpdateConversationStatusSchema } from "@/lib/schemas";
import { error, handleError, json, requireAuth } from "@/lib/api";
import { updateConversationStatus } from "@/features/conversations/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { status } = UpdateConversationStatusSchema.parse(await req.json());
    const updated = await updateConversationStatus(user.id, id, status);

    return json(updated);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "CONVERSATION_STATUS_INVALID") {
        return error("Status inválido. Use 'bot' ou 'human'.", 400);
      }

      if (err.message === "CONVERSATION_NOT_FOUND") {
        return error("Conversa não encontrada", 404);
      }
    }

    if (err instanceof SyntaxError) {
      return error("Payload inválido");
    }

    return handleError(err);
  }
}
