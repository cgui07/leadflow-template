import Image from "next/image";
import { FileText } from "lucide-react";
import type { MessageItem } from "../types";

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
  if (sender === "agent") return "Voce";
  return "Cliente";
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
        .map((message) => (
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

              {message.type === "image" && message.metadata?.mediaUrl ? (
                <div className="mb-1">
                  <Image
                    src={message.metadata.mediaUrl}
                    alt={message.metadata.caption || "Imagem"}
                    width={message.metadata.width ?? 320}
                    height={message.metadata.height ?? 320}
                    unoptimized
                    className="h-auto max-w-full cursor-pointer rounded-lg object-cover"
                    onClick={() => window.open(message.metadata?.mediaUrl, "_blank")}
                  />
                  {message.metadata.caption &&
                    message.metadata.caption !== message.content && (
                      <div className="mt-1">{message.metadata.caption}</div>
                    )}
                </div>
              ) : message.type === "video" && message.metadata?.mediaUrl ? (
                <div className="mb-1">
                  <video
                    src={message.metadata.mediaUrl}
                    controls
                    className="max-h-60 max-w-full rounded-lg"
                  />
                  {message.metadata.caption &&
                    message.metadata.caption !== message.content && (
                      <div className="mt-1">{message.metadata.caption}</div>
                    )}
                </div>
              ) : message.type === "audio" && message.metadata?.mediaUrl ? (
                <div className="mb-1">
                  <audio
                    src={message.metadata.mediaUrl}
                    controls
                    className="max-w-full"
                  />
                </div>
              ) : message.type === "document" && message.metadata?.mediaUrl ? (
                <a
                  href={message.metadata.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-1 underline"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {message.metadata.fileName || "Documento"}
                  </span>
                </a>
              ) : (
                <div>{message.content}</div>
              )}

              {message.type !== "text" && !message.metadata?.mediaUrl && (
                <div>{message.content}</div>
              )}

              <div className="mt-1 text-[10px] opacity-50">
                {formatMessageTime(message.createdAt)}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
