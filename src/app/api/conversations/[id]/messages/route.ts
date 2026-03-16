import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import {
  listConversationMessages,
  sendConversationMessage,
} from "@/features/conversations/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);
    const messages = await listConversationMessages(user.id, id, {
      cursor,
      limit,
    });

    return json(messages);
  } catch (err) {
    if (err instanceof Error && err.message === "CONVERSATION_NOT_FOUND") {
      return error("Conversa não encontrada", 404);
    }

    return handleError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const message = await sendConversationMessage(
      user.id,
      id,
      (await req.json()) as Record<string, unknown>,
    );

    return json(message, 201);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "CONVERSATION_MESSAGE_REQUIRED") {
        return error("Mensagem obrigatoria", 400);
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
