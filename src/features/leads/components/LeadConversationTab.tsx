"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Form, TextField } from "@/components/forms";
import { SectionContainer } from "@/components/layout/SectionContainer";

interface Message {
  id: string;
  direction: string;
  sender: string;
  content: string;
  createdAt: string;
}

interface LeadConversationTabProps {
  conversationId: string | undefined;
  messages: Message[];
  onRefetch: () => Promise<void>;
  onError: (error: string) => void;
}

export function LeadConversationTab({
  conversationId,
  messages,
  onRefetch,
  onError,
}: LeadConversationTabProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim() || !conversationId) return;

    setSending(true);

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        onError(payload?.error || "Não foi possível enviar a mensagem.");
        return;
      }

      setMessage("");
      await onRefetch();
    } finally {
      setSending(false);
    }
  }

  return (
    <SectionContainer title="Conversa">
      <div className="mb-4 h-96 space-y-3 overflow-y-auto">
        {!messages.length ? (
          <div className="py-12 text-center text-sm text-neutral-muted">
            Nenhuma mensagem ainda
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.direction === "outbound"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.direction === "outbound"
                    ? "bg-primary text-white"
                    : "bg-gray-ghost text-neutral-ink"
                }`}
              >
                <div className="mb-0.5 text-[10px] font-semibold opacity-70">
                  {msg.sender === "bot"
                    ? "Bot"
                    : msg.sender === "agent"
                      ? "Você"
                      : "Cliente"}
                </div>
                <div>{msg.content}</div>
                <div className="mt-1 text-[10px] opacity-50">
                  {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Form onSubmit={sendMessage} className="flex gap-2">
        <TextField
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Digite uma mensagem..."
        />
        <Button
          type="submit"
          loading={sending}
          icon={<Send className="h-4 w-4" />}
        >
          Enviar
        </Button>
      </Form>
    </SectionContainer>
  );
}
