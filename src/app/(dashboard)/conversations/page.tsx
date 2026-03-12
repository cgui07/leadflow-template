"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useFetch } from "@/lib/hooks";
import { getScoreBadgeClass } from "@/lib/ui-colors";
import { Bot, MessageSquare, Search, Send, User } from "lucide-react";
import { useState } from "react";

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
}

export default function ConversationsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !selected) return;
    setSending(true);
    try {
      await fetch(`/api/conversations/${selected}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
      setMessage("");
      refetchMessages();
      refetch();
    } finally {
      setSending(false);
    }
  }

  async function toggleBotMode(convId: string, currentStatus: string) {
    const newStatus = currentStatus === "bot" ? "human" : "bot";
    await fetch(`/api/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `[Sistema: modo alterado para ${newStatus === "bot" ? "automático" : "manual"}]`,
      }),
    });
    refetch();
  }

  if (loading) return <LoadingState variant="skeleton" />;

  return (
    <PageContainer
      title="Conversas"
      subtitle="Gerencie suas conversas do WhatsApp"
    >
      <div className="flex h-[calc(100vh-13rem)] rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="w-80 shrink-0 border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!conversations?.length ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Nenhuma conversa
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv.id)}
                  className={`w-full flex items-start gap-3 p-3 text-left border-b border-slate-50 transition hover:bg-slate-50 ${
                    selected === conv.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                    {conv.lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {conv.lead.name}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {conv.messages[0]?.content || "Sem mensagens"}
                    </p>
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
                      <span className="text-[10px] text-slate-400">
                        {conv.lastMessageAt &&
                          new Date(conv.lastMessageAt).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!selected || !selectedConv ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<MessageSquare className="h-12 w-12 text-slate-300" />}
                title="Selecione uma conversa"
                description="Escolha uma conversa à esquerda para ver as mensagens"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold">
                    {selectedConv.lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {selectedConv.lead.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {selectedConv.lead.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${getScoreBadgeClass(selectedConv.lead.score)}`}
                  >
                    Score: {selectedConv.lead.score}
                  </span>
                  <Button
                    variant={
                      selectedConv.status === "bot" ? "outline" : "secondary"
                    }
                    size="sm"
                    icon={
                      selectedConv.status === "bot" ? (
                        <User size={14} />
                      ) : (
                        <Bot size={14} />
                      )
                    }
                    onClick={() =>
                      toggleBotMode(selectedConv.id, selectedConv.status)
                    }
                  >
                    {selectedConv.status === "bot" ? "Assumir" : "Bot"}
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages || [])
                  .slice()
                  .reverse()
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.direction === "outbound"
                            ? msg.sender === "bot"
                              ? "bg-purple-600 text-white"
                              : "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                          {msg.sender === "bot"
                            ? "Bot"
                            : msg.sender === "agent"
                              ? "Você"
                              : "Cliente"}
                        </p>
                        <p>{msg.content}</p>
                        <p className="text-[10px] opacity-50 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              <form
                onSubmit={handleSend}
                className="border-t border-slate-200 p-3 flex gap-2"
              >
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <Button
                  type="submit"
                  loading={sending}
                  icon={<Send className="h-4 w-4" />}
                >
                  Enviar
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
