"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { TextField } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import type { ConversationItem } from "../types";
import { ConversationStatusBadge } from "./ConversationStatusBadge";

interface ConversationSidebarProps {
  search: string;
  selectedId: string | null;
  conversations: ConversationItem[] | null;
  onSearchChange: (value: string) => void;
  onSelect: (conversationId: string) => void;
}

function formatSidebarTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  if (date.toDateString() === todayStr) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (date.toDateString() === yesterdayDate.toDateString()) {
    return "Ontem";
  }
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString("pt-BR", { weekday: "short" });
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

interface ConversationRowProps {
  conversation: ConversationItem;
  isSelected: boolean;
  onSelect: (conversationId: string) => void;
}

const ConversationRow = memo(function ConversationRow({
  conversation,
  isSelected,
  onSelect,
}: ConversationRowProps) {
  const hasUnread = conversation.unreadCount > 0;
  const lastMsg = conversation.messages[0];
  const preview = lastMsg
    ? lastMsg.direction === "outbound"
      ? `Você: ${lastMsg.content}`
      : lastMsg.content
    : "Sem mensagens";

  return (
    <Button
      onClick={() => onSelect(conversation.id)}
      variant="ghost"
      className={cn(
        "h-auto w-full justify-start border-b border-neutral-border px-3 py-3 text-left",
        isSelected ? "bg-neutral-surface" : "hover:bg-neutral-pale",
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-mist text-sm font-bold text-teal-dark">
        {conversation.lead.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-base font-medium text-neutral-ink">
            {conversation.lead.name}
          </div>
          <div
            className={cn(
              "shrink-0 text-xs",
              hasUnread
                ? "font-medium text-whatsapp"
                : "text-neutral-muted",
            )}
          >
            {conversation.lastMessageAt &&
              formatSidebarTime(conversation.lastMessageAt)}
          </div>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <ConversationStatusBadge status={conversation.status} />
            <div
              className={cn(
                "truncate text-sm",
                hasUnread
                  ? "font-medium text-neutral-dark"
                  : "text-neutral-muted",
              )}
            >
              {preview}
            </div>
          </div>
          {hasUnread && (
            <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-whatsapp px-1 text-[11px] font-bold text-white">
              {conversation.unreadCount}
            </div>
          )}
        </div>
      </div>
    </Button>
  );
});

export const ConversationSidebar = memo(function ConversationSidebar({
  search,
  selectedId,
  conversations,
  onSearchChange,
  onSelect,
}: ConversationSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-teal-dark px-4 py-3">
        <div className="text-base font-bold text-white">WhatsApp</div>
      </div>

      <div className="border-b border-neutral-border bg-neutral-surface px-3 py-2">
        <TextField
          icon={<Search className="h-4 w-4 text-neutral-muted" />}
          placeholder="Pesquisar ou começar uma nova conversa"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {!conversations?.length ? (
          <div className="p-6 text-center text-sm text-neutral-muted">
            Nenhuma conversa
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
});
