import { logger } from "./logger";
import { callAI } from "./ai-client";
import type { AIConfig, MessageContent } from "./ai-client";

export interface CustomAudioCandidate {
  id: string;
  context: string;
  audioBase64: string;
  mimeType: string;
}

export async function findMatchingCustomAudio(
  config: AIConfig,
  latestMessage: MessageContent,
  conversationHistory: Array<{ direction: string; content: MessageContent }>,
  candidates: CustomAudioCandidate[],
): Promise<CustomAudioCandidate | null> {
  if (candidates.length === 0) return null;

  const messageText =
    typeof latestMessage === "string"
      ? latestMessage
      : latestMessage
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(" ");

  if (!messageText.trim()) return null;

  const recentHistory = conversationHistory.slice(-6);
  const historyText = recentHistory
    .map((m) => {
      const text =
        typeof m.content === "string"
          ? m.content
          : (m.content as Array<{ type: string; text?: string }>)
              .filter((p) => p.type === "text")
              .map((p) => p.text ?? "")
              .join(" ");
      return `${m.direction === "inbound" ? "Lead" : "Assistente"}: ${text}`;
    })
    .join("\n");

  const contextList = candidates
    .map((c, i) => `${i + 1}. ${c.context}`)
    .join("\n");

  const systemPrompt = `Você é um classificador. Analise a última mensagem do lead (e o histórico recente) e determine se algum dos contextos listados se aplica à situação atual.

Responda APENAS com o número do contexto que se aplica (ex: "2"), ou "0" se nenhum se aplica.
Seja conservador: só escolha um contexto se houver correspondência clara.`;

  const userMessage = `Histórico recente:\n${historyText}\n\nÚltima mensagem do lead: "${messageText}"\n\nContextos disponíveis:\n${contextList}\n\nQual contexto se aplica? Responda apenas com o número (0 se nenhum).`;

  try {
    const result = await callAI(config, systemPrompt, [
      { role: "user", content: userMessage },
    ]);

    if (!result) return null;

    const match = result.trim().match(/^(\d+)/);
    if (!match) return null;

    const idx = parseInt(match[1], 10);
    if (idx === 0 || idx > candidates.length) return null;

    const matched = candidates[idx - 1];
    logger.info("[custom-audio] context matched", { context: matched.context });
    return matched;
  } catch (err) {
    logger.warn("[custom-audio] matcher failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
