import { logger } from "./logger";

// Barrel re-exports from split modules
export type { AIConfig, MessageContent } from "./ai-client";
export { callAI, formatContentForOpenAI } from "./ai-client";
export type { PropertyCatalogItem } from "./ai-prompts";
export {
  formatPropertyForPrompt,
  getQualificationPrompt,
  getFollowUpPrompt,
  getFacebookOutreachPrompt,
  getCanalProOutreachPrompt,
  getExtractionPrompt,
  getSummaryPrompt,
  getPropertyExtractionPrompt,
} from "./ai-prompts";
export { qualifyLead } from "@/features/leads/qualify";

import { callAI } from "./ai-client";
import type { PropertyCatalogItem } from "./ai-prompts";
import type { AIConfig, MessageContent } from "./ai-client";
import {
  getQualificationPrompt,
  getFollowUpPrompt,
  getFacebookOutreachPrompt,
  getCanalProOutreachPrompt,
  getExtractionPrompt,
  getSummaryPrompt,
  getPropertyExtractionPrompt,
} from "./ai-prompts";

const AVAILABILITY_VERIFICATION_FALLBACK =
  "Vou verificar certinho e te retorno mais tarde.";

function normalizeForAvailabilityGuard(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAvailabilityDenial(reply: string) {
  const text = normalizeForAvailabilityGuard(reply);

  return [
    /\b(nao tenho|nao temos)\b[^.!?\n]{0,120}\b(disponivel|catalogo|tipo|opcao|opcoes|unidade|imovel|quarto|quartos|bairro|valor|preco)\b/,
    /\b(nao tenho|nao temos)\b[^.!?\n]{0,120}\b(informacao|dados|acesso|como|cpf|email|e-mail|documento|arquivo|comprovante|contato|telefone)\b/,
    /\b(nao encontrei|nao achei|nao localizei)\b[^.!?\n]{0,120}\b(disponivel|catalogo|tipo|opcao|opcoes|unidade|imovel|quarto|quartos|bairro|valor|preco)\b/,
    /\b(nao ha|nao existe)\b[^.!?\n]{0,120}\b(disponivel|disponibilidade|tipo|opcao|opcoes|unidade|imovel)\b/,
    /\bnao tenho acesso\b/,
    /\bnao tenho como\b/,
    /\b(nao consigo|nao posso)\b[^.!?\n]{0,120}\b(enviar|mandar|acessar|buscar|verificar|consultar|informar|confirmar|ajudar|fornecer|cpf|email|e-mail|documento|arquivo)\b/,
    /\bnao sei\b[^.!?\n]{0,120}\b(informar|dizer|confirmar|responder|te passar)\b/,
    /\bnao sou capaz\b/,
    /\bsem\s+(disponibilidade|opcao|opcoes|unidade|imovel|esse tipo|este tipo)\b/,
    /\b(indisponivel|fora do catalogo|nao esta no catalogo)\b/,
  ].some((pattern) => pattern.test(text));
}

function sanitizeAvailabilityDenial(reply: string) {
  return hasAvailabilityDenial(reply)
    ? AVAILABILITY_VERIFICATION_FALLBACK
    : reply;
}

const LEGACY_GENERIC_HELPER_REPLY =
  "Tô por aqui, sim. Me diz o que você precisa que eu vejo pra você.";

function normalizeReplyForComparison(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isLegacyGenericHelperReply(content: MessageContent) {
  return (
    typeof content === "string" &&
    normalizeReplyForComparison(content) ===
      normalizeReplyForComparison(LEGACY_GENERIC_HELPER_REPLY)
  );
}

function prepareAutoReply(reply: string) {
  return sanitizeAvailabilityDenial(reply).trim();
}

export async function generateAutoReply(
  config: AIConfig,
  agentName: string,
  conversationMessages: Array<{
    direction: string;
    content: MessageContent;
    sender: string;
  }>,
  properties?: PropertyCatalogItem[],
  isVoiceReply?: boolean,
  customInstructions?: string | null,
) {
  const messages = conversationMessages
    // Remove the old canned fallback from the model context so conversations
    // already affected by the bug do not keep teaching the model to repeat it.
    .filter(
      (message) =>
        message.direction === "inbound" ||
        !isLegacyGenericHelperReply(message.content),
    )
    .map((message) => ({
      role: message.direction === "inbound" ? "user" : "assistant",
      content: message.content,
    }));

  const recentOutboundReplies = new Set(
    conversationMessages
      .filter(
        (message) =>
          message.direction !== "inbound" &&
          typeof message.content === "string",
      )
      .map((message) =>
        normalizeReplyForComparison(message.content as string),
      )
      .filter(Boolean),
  );
  const systemPrompt = getQualificationPrompt(
    agentName,
    properties,
    isVoiceReply,
    customInstructions,
  );

  const reply = prepareAutoReply(await callAI(config, systemPrompt, messages));
  if (!reply || !recentOutboundReplies.has(normalizeReplyForComparison(reply))) {
    return reply;
  }

  logger.warn("AI generated a repeated auto-reply; retrying", {
    repeatedReply: reply,
  });

  const retryPrompt = `${systemPrompt}\n\nANTI-REPETIÇÃO — CORREÇÃO OBRIGATÓRIA:
- Sua resposta anterior repetiu uma mensagem já enviada nesta conversa.
- Responda especificamente à ÚLTIMA mensagem do cliente, usando os dados e pedidos que ela contém.
- Não reutilize esta resposta: "${reply.replace(/"/g, "'")}"
- Se o cliente pediu oportunidades de um imóvel ou empreendimento, trate desse pedido diretamente e faça no máximo uma pergunta específica para avançar.`;
  const retryReply = prepareAutoReply(
    await callAI(config, retryPrompt, messages),
  );

  if (
    retryReply &&
    !recentOutboundReplies.has(normalizeReplyForComparison(retryReply))
  ) {
    return retryReply;
  }

  logger.error("AI repeated the auto-reply after retry; suppressing send", {
    firstReply: reply,
    retryReply,
  });
  return "";
}

export async function generateFacebookOutreachMessage(
  config: AIConfig,
  agentName: string,
  leadName: string,
) {
  return callAI(config, getFacebookOutreachPrompt(agentName, leadName), [
    { role: "user", content: "inicie a conversa" },
  ]);
}

/**
 * Resolve a mensagem de outreach de campanha.
 * Se o corretor configurou uma mensagem customizada, usa ela substituindo [NOME].
 * Senão, gera via IA.
 */
export async function resolveOutreachMessage(
  config: AIConfig,
  agentName: string,
  leadName: string,
  campaignOutreachMessage: string | null | undefined,
): Promise<string | null> {
  if (campaignOutreachMessage?.trim()) {
    return campaignOutreachMessage.replace(/\[NOME\]/gi, leadName || "");
  }
  return generateFacebookOutreachMessage(config, agentName, leadName);
}

export async function generateCanalProOutreachMessage(
  config: AIConfig,
  agentName: string,
  leadName: string,
  leadOrigin: string,
  message: string | null,
) {
  return callAI(
    config,
    getCanalProOutreachPrompt(agentName, leadName, leadOrigin, message),
    [{ role: "user", content: "inicie a conversa" }],
  );
}

export async function generateFollowUpMessage(
  config: AIConfig,
  agentName: string,
  conversationMessages: Array<{
    direction: string;
    content: string;
    sender: string;
  }>,
  customInstructions?: string | null,
) {
  const messages = conversationMessages.map((message) => ({
    role: message.direction === "inbound" ? "user" : "assistant",
    content: message.content,
  }));

  return callAI(
    config,
    getFollowUpPrompt(agentName, customInstructions),
    messages,
  );
}

export async function extractLeadProfile(
  config: AIConfig,
  conversationMessages: Array<{ direction: string; content: string }>,
) {
  const conversationText = conversationMessages
    .map((message) => {
      return `${message.direction === "inbound" ? "Cliente" : "Assistente"}: ${message.content}`;
    })
    .join("\n");

  const result = await callAI(config, getExtractionPrompt(), [
    { role: "user", content: conversationText },
  ]);

  try {
    const cleaned = result
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    logger.error("Failed to parse AI extraction", { result });
    return null;
  }
}

export async function generateConversationSummary(
  config: AIConfig,
  conversationMessages: Array<{
    direction: string;
    content: string;
    sender: string;
  }>,
) {
  const conversationText = conversationMessages
    .map((message) => {
      const role =
        message.direction === "inbound"
          ? "Cliente"
          : message.sender === "bot"
            ? "Bot"
            : "Corretor";
      return `${role}: ${message.content}`;
    })
    .join("\n");

  const result = await callAI(config, getSummaryPrompt(), [
    { role: "user", content: conversationText },
  ]);

  try {
    const cleaned = result
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    logger.error("Failed to parse AI summary", { result });
    return null;
  }
}

export interface ExtractedProperty {
  title: string | null;
  type: string | null;
  purpose: string | null;
  price: number | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  amenities: string[];
  description: string | null;
}

export async function extractPropertyData(
  config: AIConfig,
  rawText: string,
): Promise<ExtractedProperty | null> {
  try {
    const result = await callAI(config, getPropertyExtractionPrompt(), [
      { role: "user", content: rawText },
    ]);
    if (!result) return null;
    const parsed = JSON.parse(result);
    return {
      title: parsed.title ?? null,
      type: parsed.type ?? null,
      purpose: parsed.purpose ?? null,
      price: typeof parsed.price === "number" ? parsed.price : null,
      area: typeof parsed.area === "number" ? parsed.area : null,
      bedrooms: typeof parsed.bedrooms === "number" ? parsed.bedrooms : null,
      bathrooms: typeof parsed.bathrooms === "number" ? parsed.bathrooms : null,
      parkingSpots:
        typeof parsed.parkingSpots === "number" ? parsed.parkingSpots : null,
      address: parsed.address ?? null,
      neighborhood: parsed.neighborhood ?? null,
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      amenities: Array.isArray(parsed.amenities) ? parsed.amenities : [],
      description: parsed.description ?? null,
    };
  } catch (err) {
    logger.error("extractPropertyData failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
