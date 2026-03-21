import { logger } from "@/lib/logger";
import { resolveMediaContent } from "@/lib/media";
import type { AIConfig, MessageContent } from "@/lib/ai";

const MEDIA_TYPES = new Set(["image", "audio", "document"]);

export async function enrichMessageWithMedia(
  message: {
    content: string;
    type: string;
    metadata: unknown;
    whatsappMsgId: string | null;
    direction: string;
  },
  instanceName: string,
  aiConfig: AIConfig,
): Promise<MessageContent> {
  if (message.direction !== "inbound" || !MEDIA_TYPES.has(message.type)) {
    return message.content;
  }

  const meta = (message.metadata || {}) as Record<string, unknown>;

  try {
    const media = await resolveMediaContent({
      mediaType: message.type,
      base64Data: (meta.base64 as string) || null,
      mimeType: (meta.mimetype as string) || "application/octet-stream",
      fileName: (meta.fileName as string) || undefined,
      seconds: (meta.seconds as number) || undefined,
      instanceName,
      messageId: message.whatsappMsgId || "",
      aiConfig,
    });

    if (!media) return message.content;

    if (media.type === "audio" && media.transcription) {
      return `[Transcrição do áudio]: ${media.transcription}`;
    }

    if (media.type === "image") {
      const parts: MessageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: media.mimeType,
            data: media.base64,
          },
        },
      ];
      if (message.content && message.content !== "[Imagem recebida]") {
        parts.push({ type: "text", text: message.content });
      } else {
        parts.push({ type: "text", text: "O cliente enviou esta imagem." });
      }
      return parts;
    }

    if (media.type === "document") {
      const parts: MessageContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: media.mimeType,
            data: media.base64,
          },
        },
        {
          type: "text",
          text: media.fileName
            ? `O cliente enviou o documento: ${media.fileName}`
            : "O cliente enviou um documento.",
        },
      ];
      return parts;
    }
  } catch (err) {
    logger.error("Media enrichment failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return message.content;
}
