import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { generateConversationSummary } from "@/lib/ai";
import { json, error, requireAuth, handleError } from "@/lib/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const conv = await prisma.conversation.findFirst({
      where: { id, lead: { userId: user.id } },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 50 },
        lead: { include: { user: { include: { settings: true } } } },
      },
    });

    if (!conv) return error("Conversa não encontrada", 404);
    if (!conv.messages.length) return error("Conversa sem mensagens", 400);

    const settings = conv.lead.user.settings;
    if (!settings?.aiProvider || !settings?.aiApiKey) {
      return error("Configuração de IA não encontrada", 400);
    }

    const config = {
      provider: settings.aiProvider,
      apiKey: settings.aiApiKey,
      model: settings.aiModel || "",
    };

    const summary = await generateConversationSummary(config, conv.messages);
    if (!summary) return error("Não foi possível gerar o resumo", 500);

    return json(summary);
  } catch (err) {
    return handleError(err);
  }
}
