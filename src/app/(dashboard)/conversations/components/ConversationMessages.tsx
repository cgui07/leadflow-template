import Image from "next/image";
import type { MessageItem } from "../types";
import { FileAudio, FileImage, FileText, FileVideo } from "lucide-react";

interface ConversationMessagesProps {
  messages: MessageItem[] | null;
}

function formatMessageTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSenderLabel(sender: string) {
  if (sender === "bot") return "Bot";
  if (sender === "agent") return "Você";
  return "Cliente";
}

function MediaFallback({
  type,
  fileName,
}: {
  type: string;
  fileName?: string;
}) {
  if (type === "image") {
    return (
      <div className="flex items-center gap-2">
        <FileImage className="h-4 w-4 shrink-0" />
        <span>{fileName || "Imagem enviada"}</span>
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="flex items-center gap-2">
        <FileVideo className="h-4 w-4 shrink-0" />
        <span>{fileName || "Vídeo enviado"}</span>
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="flex items-center gap-2">
        <FileAudio className="h-4 w-4 shrink-0" />
        <span>{fileName || "Áudio enviado"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4 shrink-0" />
      <span>{fileName || "Documento enviado"}</span>
    </div>
  );
}

export function ConversationMessages({
  messages,
}: ConversationMessagesProps) {
  if (!messages?.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-neutral-muted">
        Nenhuma mensagem ainda.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-3 sm:space-y-3 sm:p-4">
      {messages
        .slice()
        .reverse()
        .map((message) => {
          const mediaUrl = message.metadata?.mediaUrl;
          const caption =
            typeof message.metadata?.caption === "string"
              ? message.metadata.caption
              : null;
          const fallbackLabel = message.content;

          return (
            <div
              key={message.id}
              className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%] sm:px-4 sm:py-2.5 ${
                  message.direction === "outbound"
                    ? message.sender === "bot"
                      ? "bg-secondary text-white"
                      : "bg-primary text-white"
                    : "bg-gray-ghost text-neutral-ink"
                }`}
              >
                <div className="mb-0.5 text-[10px] font-semibold opacity-70">
                  {getSenderLabel(message.sender)}
                </div>

                {message.type === "image" && mediaUrl ? (
                  <div className="mb-1">
                    <Image
                      src={mediaUrl}
                      alt={caption || "Imagem"}
                      width={message.metadata?.width ?? 320}
                      height={message.metadata?.height ?? 320}
                      unoptimized
                      className="h-auto max-w-full cursor-pointer rounded-lg object-cover"
                      onClick={() => window.open(mediaUrl, "_blank")}
                    />
                    {caption && caption !== fallbackLabel && (
                      <div className="mt-1">{caption}</div>
                    )}
                  </div>
                ) : message.type === "video" && mediaUrl ? (
                  <div className="mb-1">
                    <video
                      src={mediaUrl}
                      controls
                      className="max-h-60 max-w-full rounded-lg"
                    />
                    {caption && caption !== fallbackLabel && (
                      <div className="mt-1">{caption}</div>
                    )}
                  </div>
                ) : message.type === "audio" && mediaUrl ? (
                  <div className="mb-1">
                    <audio
                      src={mediaUrl}
                      controls
                      className="max-w-full"
                    />
                  </div>
                ) : message.type === "document" && mediaUrl ? (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-1 underline"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {message.metadata?.fileName || "Documento"}
                    </span>
                  </a>
                ) : message.type !== "text" ? (
                  <div className="space-y-2">
                    <MediaFallback
                      type={message.type}
                      fileName={message.metadata?.fileName}
                    />
                    {caption && caption !== fallbackLabel ? (
                      <div>{caption}</div>
                    ) : (
                      <div>{fallbackLabel}</div>
                    )}
                  </div>
                ) : (
                  <div>{fallbackLabel}</div>
                )}

                <div className="mt-1 text-[10px] opacity-50">
                  {formatMessageTime(message.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
