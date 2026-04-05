import { NextRequest } from "next/server";
import { SendMessageSchema } from "@/lib/schemas";
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
    const limit = Math.min(
      Math.max(1, Number.parseInt(req.nextUrl.searchParams.get("limit") || "50", 10) || 50),
      200,
    );
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
    const data = SendMessageSchema.parse(await req.json());
    const message = await sendConversationMessage(
      user.id,
      id,
      data as Record<string, unknown>,
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

    return handleError(err);
  }
}
