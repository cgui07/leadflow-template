import { Button } from "@/components/ui/Button";
import type { ConversationItem } from "../types";
import { getScoreBadgeClass } from "@/lib/ui-colors";
import { ArrowLeft, Bot, Sparkles, User } from "lucide-react";
import { ConversationStatusBadge } from "./ConversationStatusBadge";

interface ConversationHeaderProps {
  conversation: ConversationItem;
  switching: boolean;
  summaryLoading: boolean;
  showSummary: boolean;
  onBack: () => void;
  onToggleMode: () => void;
  onGenerateSummary: () => void;
}

export function ConversationHeader({
  conversation,
  switching,
  summaryLoading,
  showSummary,
  onBack,
  onToggleMode,
  onGenerateSummary,
}: ConversationHeaderProps) {
  const isBot = conversation.status === "bot";

  return (
    <div className="flex items-center justify-between gap-2 border-b border-neutral-border px-3 py-3 sm:px-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        icon={<ArrowLeft size={18} />}
        aria-label="Voltar"
        className="md:hidden"
      />

      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-border text-xs font-bold sm:h-9 sm:w-9 sm:text-sm">
          {conversation.lead.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {conversation.lead.name}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <ConversationStatusBadge status={conversation.status} />
            <div className="hidden truncate text-xs text-neutral-muted sm:block">
              {conversation.lead.phone}
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          className={`hidden rounded-full px-2 py-1 text-xs font-medium sm:inline-flex ${getScoreBadgeClass(conversation.lead.score)}`}
        >
          Score: {conversation.lead.score}
        </div>

        {isBot ? (
          <Button
            variant="primary"
            size="sm"
            icon={<User size={14} />}
            onClick={onToggleMode}
            loading={switching}
          >
            <span className="hidden sm:inline">Assumir conversa</span>
            <span className="sm:hidden">Assumir</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            icon={<Bot size={14} />}
            onClick={onToggleMode}
            loading={switching}
          >
            <span className="hidden sm:inline">Devolver ao bot</span>
            <span className="sm:hidden">Bot</span>
          </Button>
        )}

        {showSummary && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles size={14} />}
            onClick={onGenerateSummary}
            loading={summaryLoading}
          >
            <span className="hidden sm:inline">Gerar resumo</span>
          </Button>
        )}
      </div>
    </div>
  );
}
