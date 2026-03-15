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

function formatConversationTime(lastMessageAt: string) {
  return new Date(lastMessageAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationSidebar({
  search,
  selectedId,
  conversations,
  onSearchChange,
  onSelect,
}: ConversationSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-border p-3">
        <TextField
          icon={<Search className="h-4 w-4" />}
          placeholder="Buscar conversa..."
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
            <Button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              variant="ghost"
              className={`h-auto w-full justify-start border-b border-gray-ghost px-3 py-3 text-left ${
                selectedId === conversation.id ? "bg-blue-pale" : ""
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-border text-sm font-bold text-neutral-dark">
                {conversation.lead.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="truncate text-sm font-semibold text-neutral-ink">
                    {conversation.lead.name}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>

                <div className="mt-0.5 truncate text-xs text-neutral-muted">
                  {conversation.messages[0]?.content || "Sem mensagens"}
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <ConversationStatusBadge status={conversation.status} />
                  <div className="text-[10px] text-neutral-muted">
                    {conversation.lastMessageAt &&
                      formatConversationTime(conversation.lastMessageAt)}
                  </div>
                </div>
              </div>
            </Button>
          ))
        )}
      </div>
    </div>
  );
}
