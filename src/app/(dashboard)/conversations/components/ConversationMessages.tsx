"use client";

import { Fragment, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MessageItem } from "../types";
import {
  Check,
  CheckCheck,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
} from "lucide-react";

interface ConversationMessagesProps {
  messages: MessageItem[] | null;
}

function formatMessageTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Hoje";
  if (date.toDateString() === yesterdayDate.toDateString()) return "Ontem";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function StatusChecks({ sender }: { sender: string }) {
  if (sender === "bot") {
    return <CheckCheck size={14} className="text-blue-sky" />;
  }
  return <Check size={14} className="opacity-60" />;
}

function MediaFallback({
  type,
  fileName,
}: {
  type: string;
  fileName?: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    image: <FileImage className="h-4 w-4 shrink-0" />,
    video: <FileVideo className="h-4 w-4 shrink-0" />,
    audio: <FileAudio className="h-4 w-4 shrink-0" />,
  };
  const labels: Record<string, string> = {
    image: "Imagem enviada",
    video: "Vídeo enviado",
    audio: "Áudio enviado",
  };

  return (
    <div className="flex items-center gap-2">
      {icons[type] ?? <FileText className="h-4 w-4 shrink-0" />}
      <span>{fileName || labels[type] || "Documento enviado"}</span>
    </div>
  );
}

export function ConversationMessages({ messages }: ConversationMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const count = messages?.length ?? 0;
    if (count === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      120;
    const isNewConversation = prevCountRef.current === 0;

    if (isNewConversation || isNearBottom) {
      bottomRef.current?.scrollIntoView({
        behavior: isNewConversation ? "instant" : "smooth",
      });
    }

    prevCountRef.current = count;
  }, [messages?.length]);

  if (!messages?.length) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-surface p-4 text-sm text-neutral-muted">
        Nenhuma mensagem ainda.
      </div>
    );
  }

  const ordered = messages.slice().reverse();
  let lastDateStr = "";

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-neutral-surface px-3 py-2 sm:px-12 sm:py-4"
    >
      {ordered.map((message) => {
        const msgDateStr = new Date(message.createdAt).toDateString();
        const showDateSep = msgDateStr !== lastDateStr;
        lastDateStr = msgDateStr;

        const isOutbound = message.direction === "outbound";
        const isBot = message.sender === "bot";
        const mediaUrl = message.metadata?.mediaUrl;
        const caption =
          typeof message.metadata?.caption === "string"
            ? message.metadata.caption
            : null;

        return (
          <Fragment key={message.id}>
            {showDateSep && (
              <div className="my-3 flex justify-center">
                <div className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-neutral shadow-card">
                  {formatDateSeparator(message.createdAt)}
                </div>
              </div>
            )}

            <div
              className={cn(
                "mb-1.5 flex",
                isOutbound ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "relative max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm shadow-sm sm:max-w-[65%]",
                  isOutbound
                    ? isBot
                      ? "rounded-tr-none bg-green-pale text-neutral-ink"
                      : "rounded-tr-none bg-green-sage text-neutral-ink"
                    : "rounded-tl-none bg-white text-neutral-ink",
                )}
              >
                {isBot && isOutbound && (
                  <div className="mb-0.5 text-[10px] font-semibold text-teal-dark">
                    Bot
                  </div>
                )}
                {!isOutbound && (
                  <div className="mb-0.5 text-[10px] font-semibold text-primary">
                    {message.sender === "agent" ? "Você" : "Cliente"}
                  </div>
                )}
                {isOutbound && !isBot && (
                  <div className="mb-0.5 text-[10px] font-semibold text-teal-dark">
                    Você
                  </div>
                )}

                {message.type === "image" && mediaUrl ? (
                  <div className="mb-1">
                    <Image
                      src={mediaUrl}
                      alt={caption || "Imagem"}
                      width={message.metadata?.width ?? 280}
                      height={message.metadata?.height ?? 280}
                      unoptimized
                      className="h-auto max-w-full cursor-pointer rounded-md object-cover"
                      onClick={() => window.open(mediaUrl, "_blank")}
                    />
                    {caption && <div className="mt-1">{caption}</div>}
                  </div>
                ) : message.type === "video" && mediaUrl ? (
                  <div className="mb-1">
                    <video
                      src={mediaUrl}
                      controls
                      playsInline
                      className="max-h-60 max-w-full rounded-md"
                    />
                    {caption && <div className="mt-1">{caption}</div>}
                  </div>
                ) : message.type === "audio" && mediaUrl ? (
                  <div className="mb-1">
                    <audio
                      src={mediaUrl}
                      controls
                      playsInline
                      className="max-w-full"
                    />
                  </div>
                ) : message.type === "document" && mediaUrl ? (
                  <Link
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md bg-neutral-surface/50 px-2 py-2"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-neutral" />
                    <span className="truncate text-sm underline">
                      {message.metadata?.fileName || "Documento"}
                    </span>
                  </Link>
                ) : message.type !== "text" ? (
                  <div className="space-y-1">
                    <MediaFallback
                      type={message.type}
                      fileName={message.metadata?.fileName}
                    />
                    {caption ? (
                      <div>{caption}</div>
                    ) : (
                      <div>{message.content}</div>
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                )}

                <div
                  className={cn(
                    "mt-0.5 flex items-center justify-end gap-1 text-[10px] text-neutral-muted",
                  )}
                >
                  <span>{formatMessageTime(message.createdAt)}</span>
                  {isOutbound && <StatusChecks sender={message.sender} />}
                </div>
              </div>
            </div>
          </Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
