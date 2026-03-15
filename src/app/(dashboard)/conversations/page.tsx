"use client";

import { TextField } from "@/components/forms";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useFetch } from "@/lib/hooks";
import { getScoreBadgeClass } from "@/lib/ui-colors";
import {
  ArrowLeft,
  Bot,
  FileText,
  MessageSquare,
  Search,
  Send,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface ConversationItem {
  id: string;
  status: string;
  unreadCount: number;
  lastMessageAt: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string;
    score: number;
    status: string;
  };
  messages: Array<{
    id: string;
    content: string;
    direction: string;
    sender: string;
    createdAt: string;
  }>;
}

interface MessageItem {
  id: string;
  direction: string;
  sender: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  metadata?: {
    mediaUrl?: string;
    mimetype?: string;
    fileName?: string;
    fileSize?: number;
    caption?: string;
    seconds?: number;
    width?: number;
    height?: number;
  };
}

export default function ConversationsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryParams = search ? `?search=${encodeURIComponent(search)}` : "";
  const {
    data: conversations,
    loading,
    refetch,
  } = useFetch<ConversationItem[]>(`/api/conversations${queryParams}`);
  const { data: messages, refetch: refetchMessages } = useFetch<MessageItem[]>(
    selected ? `/api/conversations/${selected}/messages` : null,
  );

  const selectedConv = conversations?.find((c) => c.id === selected);

  function getMediaType(file: File): string {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "document";
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    } else {
      setMediaPreview(null);
    }
  }

  function clearMedia() {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!message.trim() && !mediaFile) || !selected) return;
    setSending(true);
    try {
      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);
        formData.append("mediaType", getMediaType(mediaFile));
        if (message.trim()) formData.append("caption", message.trim());
        await fetch(`/api/conversations/${selected}/media`, {
          method: "POST",
          body: formData,
        });
        clearMedia();
      } else {
        await fetch(`/api/conversations/${selected}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message }),
        });
      }
      setMessage("");
      refetchMessages();
      refetch();
    } finally {
      setSending(false);
    }
  }

  async function toggleBotMode(convId: string, currentStatus: string) {
    const newStatus = currentStatus === "bot" ? "human" : "bot";
    await fetch(`/api/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    refetch();
  }

  if (loading) return <LoadingState variant="skeleton" />;

  const conversationList = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-neutral-border">
        <TextField
          icon={<Search className="h-4 w-4" />}
          placeholder="Buscar conversa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {!conversations?.length ? (
          <div className="p-6 text-center text-sm text-neutral-muted">
            Nenhuma conversa
          </div>
        ) : (
          conversations.map((conv) => (
            <Button
              key={conv.id}
              onClick={() => setSelected(conv.id)}
              variant="ghost"
              className={`w-full justify-start px-3 py-3 text-left border-b border-gray-ghost h-auto ${
                selected === conv.id ? "bg-blue-pale" : ""
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-neutral-border flex items-center justify-center text-sm font-bold text-neutral-dark shrink-0">
                {conv.lead.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-neutral-ink truncate">
                    {conv.lead.name}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-primary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                <div className="text-xs text-neutral-muted truncate mt-0.5">
                  {conv.messages[0]?.content || "Sem mensagens"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={conv.status === "bot" ? "purple" : "default"}
                    size="sm"
                  >
                    {conv.status === "bot"
                      ? "Bot"
                      : conv.status === "human"
                        ? "Manual"
                        : conv.status}
                  </Badge>
                  <div className="text-[10px] text-neutral-muted">
                    {conv.lastMessageAt &&
                      new Date(conv.lastMessageAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </div>
                </div>
              </div>
            </Button>
          ))
        )}
      </div>
    </div>
  );

  const chatPanel = selectedConv ? (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-3 border-b border-neutral-border gap-2 sm:px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelected(null)}
          icon={<ArrowLeft size={18} />}
          aria-label="Voltar"
          className="md:hidden"
        />
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:gap-3">
          <div className="h-8 w-8 rounded-full bg-neutral-border flex items-center justify-center text-xs font-bold shrink-0 sm:h-9 sm:w-9 sm:text-sm">
            {selectedConv.lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {selectedConv.lead.name}
            </div>
            <div className="text-xs text-neutral-muted truncate hidden sm:block">
              {selectedConv.lead.phone}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
          <div
            className={`hidden rounded-full px-2 py-1 text-xs font-medium sm:inline-flex ${getScoreBadgeClass(selectedConv.lead.score)}`}
          >
            Score: {selectedConv.lead.score}
          </div>
          <Button
            variant={selectedConv.status === "bot" ? "outline" : "secondary"}
            size="sm"
            icon={
              selectedConv.status === "bot" ? (
                <User size={14} />
              ) : (
                <Bot size={14} />
              )
            }
            onClick={() => toggleBotMode(selectedConv.id, selectedConv.status)}
          >
            <div className="hidden sm:inline">
              {selectedConv.status === "bot" ? "Assumir" : "Bot"}
            </div>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 sm:p-4 sm:space-y-3">
        {(messages || [])
          .slice()
          .reverse()
          .map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%] sm:px-4 sm:py-2.5 ${
                  msg.direction === "outbound"
                    ? msg.sender === "bot"
                      ? "bg-secondary text-white"
                      : "bg-primary text-white"
                    : "bg-gray-ghost text-neutral-ink"
                }`}
              >
                <div className="text-[10px] font-semibold opacity-70 mb-0.5">
                  {msg.sender === "bot"
                    ? "Bot"
                    : msg.sender === "agent"
                      ? "Você"
                      : "Cliente"}
                </div>
                {msg.type === "image" && msg.metadata?.mediaUrl ? (
                  <div className="mb-1">
                    <Image
                      src={msg.metadata.mediaUrl}
                      alt={msg.metadata.caption || "Imagem"}
                      width={msg.metadata.width ?? 320}
                      height={msg.metadata.height ?? 320}
                      unoptimized
                      className="h-auto max-w-full rounded-lg max-h-60 object-cover cursor-pointer"
                      onClick={() =>
                        window.open(msg.metadata!.mediaUrl!, "_blank")
                      }
                    />
                    {msg.metadata.caption &&
                      msg.metadata.caption !== msg.content && (
                        <div className="mt-1">{msg.metadata.caption}</div>
                      )}
                  </div>
                ) : msg.type === "video" && msg.metadata?.mediaUrl ? (
                  <div className="mb-1">
                    <video
                      src={msg.metadata.mediaUrl}
                      controls
                      className="max-w-full rounded-lg max-h-60"
                    />
                    {msg.metadata.caption &&
                      msg.metadata.caption !== msg.content && (
                        <div className="mt-1">{msg.metadata.caption}</div>
                      )}
                  </div>
                ) : msg.type === "audio" && msg.metadata?.mediaUrl ? (
                  <div className="mb-1">
                    <audio
                      src={msg.metadata.mediaUrl}
                      controls
                      className="max-w-full"
                    />
                  </div>
                ) : msg.type === "document" && msg.metadata?.mediaUrl ? (
                  <a
                    href={msg.metadata.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-1 underline"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {msg.metadata.fileName || "Documento"}
                    </span>
                  </a>
                ) : (
                  <div>{msg.content}</div>
                )}
                {msg.type !== "text" && !msg.metadata?.mediaUrl && (
                  <div>{msg.content}</div>
                )}
                <div className="text-[10px] opacity-50 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
      </div>
      <form
        onSubmit={handleSend}
        className="border-t border-neutral-border p-2 flex gap-2 sm:p-3"
      >
        <TextField
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite uma mensagem..."
        />
        <Button
          type="submit"
          loading={sending}
          icon={<Send className="h-4 w-4" />}
        >
          <div className="hidden sm:inline">Enviar</div>
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center">
      <EmptyState
        icon={<MessageSquare className="h-12 w-12 text-neutral-line" />}
        title="Selecione uma conversa"
        description="Escolha uma conversa à esquerda para ver as mensagens"
      />
    </div>
  );

  return (
    <PageContainer
      title="Conversas"
      subtitle="Gerencie suas conversas do WhatsApp"
    >
      <div className="hidden h-[calc(100vh-13rem)] rounded-xl border border-neutral-border bg-white overflow-hidden md:flex">
        <div className="w-80 shrink-0 border-r border-neutral-border">
          {conversationList}
        </div>
        <div className="flex-1 flex flex-col">{chatPanel}</div>
      </div>
      <div className="md:hidden">
        {!selected ? (
          <div className="h-[calc(100vh-13rem)] rounded-xl border border-neutral-border bg-white overflow-hidden">
            {conversationList}
          </div>
        ) : (
          <div className="h-[calc(100vh-13rem)] rounded-xl border border-neutral-border bg-white overflow-hidden flex flex-col">
            {chatPanel}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
