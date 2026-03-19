import { cn } from "@/lib/utils";
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
    <div className="flex items-center justify-between gap-2 bg-teal-dark px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          icon={<ArrowLeft size={18} className="text-white" />}
          aria-label="Voltar"
          className="md:hidden"
        />
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-mist text-sm font-bold text-teal-dark">
          {conversation.lead.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {conversation.lead.name}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <ConversationStatusBadge status={conversation.status} />
            <div className="hidden truncate text-xs text-teal-mist sm:block">
              {conversation.lead.phone}
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          className={cn(
            "hidden rounded-full px-2 py-1 text-xs font-medium sm:inline-flex",
            getScoreBadgeClass(conversation.lead.score),
          )}
        >
          Score: {conversation.lead.score}
        </div>

        {isBot ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<User size={14} className="text-white" />}
            onClick={onToggleMode}
            loading={switching}
            className="border border-white/30 text-white hover:bg-white/10"
          >
            <span className="hidden sm:inline">Assumir conversa</span>
            <span className="sm:hidden">Assumir</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon={<Bot size={14} className="text-white" />}
            onClick={onToggleMode}
            loading={switching}
            className="border border-white/30 text-white hover:bg-white/10"
          >
            <span className="hidden sm:inline">Devolver ao bot</span>
            <span className="sm:hidden">Bot</span>
          </Button>
        )}

        {showSummary && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Sparkles size={14} className="text-white" />}
            onClick={onGenerateSummary}
            loading={summaryLoading}
            className="border border-white/30 text-white hover:bg-white/10"
          >
            <span className="hidden sm:inline">Resumo</span>
          </Button>
        )}
      </div>
    </div>
  );
}
