import { prisma } from "@/lib/db";
import { json, error, requireAuth, handleError } from "@/lib/api";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { status } = await req.json();

    if (!["bot", "human"].includes(status)) {
      return error("Status inválido. Use 'bot' ou 'human'.", 400);
    }

    const conv = await prisma.conversation.findFirst({
      where: { id, lead: { userId: user.id } },
    });
    if (!conv) return error("Conversa não encontrada", 404);

    const updated = await prisma.conversation.update({
      where: { id },
      data: { status },
    });

    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}
