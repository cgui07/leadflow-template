import { logger } from "./logger";
import {
  DEFAULT_AI_MODEL_BY_PROVIDER,
  isSupportedAIProvider,
} from "./ai-models";

export interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  transcriptionApiKey?: string;
}

type AnthropicContentPart =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    }
  | {
      type: "document";
      source: { type: "base64"; media_type: string; data: string };
    };

export type MessageContent = string | AnthropicContentPart[];

export function formatContentForOpenAI(
  content: MessageContent,
): string | Array<Record<string, unknown>> {
  if (typeof content === "string") return content;

  return content.map((part) => {
    if (part.type === "text") return part;
    if (part.type === "image") {
      return {
        type: "image_url",
        image_url: {
          url: `data:${part.source.media_type};base64,${part.source.data}`,
          detail: "low",
        },
      };
    }
    if (part.type === "document") {
      return {
        type: "text",
        text: "[Documento recebido - conteúdo não suportado neste provedor]",
      };
    }
    return { type: "text", text: "" };
  });
}

export async function callAI(
  config: AIConfig,
  systemPrompt: string,
  messages: Array<{ role: string; content: MessageContent }>,
) {
  const provider = isSupportedAIProvider(config.provider)
    ? config.provider
    : "openai";
  const model = config.model || DEFAULT_AI_MODEL_BY_PROVIDER[provider];
  const hasMultimodal = messages.some((m) => Array.isArray(m.content));
  const maxTokens = hasMultimodal ? 1024 : 300;

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        })),
      }),
    });
    const data = await res.json();
    logger.info("Anthropic response", {
      status: res.status,
      model,
      data: JSON.stringify(data).substring(0, 300),
    });
    if (!res.ok) {
      logger.error("Anthropic API error", { data: JSON.stringify(data) });
      return "";
    }
    return data.content?.[0]?.text || "";
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: formatContentForOpenAI(m.content),
        })),
      ],
    }),
  });
  const data = await res.json();
  logger.info("OpenAI response", {
    status: res.status,
    data: JSON.stringify(data).substring(0, 300),
  });
  return data.choices?.[0]?.message?.content || "";
}
