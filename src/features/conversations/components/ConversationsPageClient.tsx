"use client";

import { cn } from "@/lib/utils";
import { useFetch } from "@/lib/hooks";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/layout/PageContainer";
import { MessageInput } from "@/components/domain/chat/MessageInput";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  ConversationItem,
  ConversationSummary,
  MessageItem,
} from "../contracts";
import { ConversationHeader } from "@/app/(dashboard)/conversations/components/ConversationHeader";
import { ConversationSidebar } from "@/app/(dashboard)/conversations/components/ConversationSidebar";
import { ConversationMessages } from "@/app/(dashboard)/conversations/components/ConversationMessages";
import { ConversationSummaryPanel } from "@/app/(dashboard)/conversations/components/ConversationSummaryPanel";

interface ConversationsPageClientProps {
  initialConversations: ConversationItem[];
  initialMessages: MessageItem[] | null;
  initialSearch: string;
  initialSelectedConversationId: string | null;
  showSummary: boolean;
  subtitle: string;
}

export function ConversationsPageClient({
  initialConversations,
  initialMessages,
  initialSearch,
  initialSelectedConversationId,
  showSummary,
  subtitle,
}: ConversationsPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const deferredSearch = useDeferredValue(search);
  const [selected, setSelected] = useState<string | null>(initialSelectedConversationId);
  const [sending, setSending] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const summaryAbortRef = useRef<AbortController | null>(null);
  const summaryRequestIdRef = useRef(0);

  const queryParams = deferredSearch
    ? `?search=${encodeURIComponent(deferredSearch)}`
    : "";
  const {
    data: conversations,
    error: conversationsError,
    refetch,
  } = useFetch<ConversationItem[]>(`/api/conversations${queryParams}`, {
    initialData: initialConversations,
    revalidateOnMount: false,
  });
  const { data: messages, error: messagesError, refetch: refetchMessages } =
    useFetch<MessageItem[]>(
      selected ? `/api/conversations/${selected}/messages` : null,
      {
        initialData:
          initialSelectedConversationId && initialSelectedConversationId === selected
            ? initialMessages
            : null,
        revalidateOnMount: false,
      },
    );
  const selectedConversationIdFromUrl = searchParams.get("conversationId");
  const selectedConversation = conversations?.find((conversation) => {
    return conversation.id === selected;
  });

  useEffect(() => {
    if (!selectedConversationIdFromUrl) {
      if (selected === null) {
        return;
      }

      resetSummaryState();
      setConversationError(null);
      setSelected(null);
      return;
    }

    if (!conversations?.length) {
      return;
    }

    const hasConversationInList = conversations.some((conversation) => {
      return conversation.id === selectedConversationIdFromUrl;
    });

    if (!hasConversationInList || selected === selectedConversationIdFromUrl) {
      return;
    }

    resetSummaryState();
    setConversationError(null);
    setSelected(selectedConversationIdFromUrl);
  }, [conversations, selected, selectedConversationIdFromUrl]);

  useEffect(() => {
    return () => {
      summaryAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (showSummary) {
      return;
    }

    resetSummaryState();
  }, [showSummary]);

  function resetSummaryState() {
    summaryAbortRef.current?.abort();
    summaryAbortRef.current = null;
    summaryRequestIdRef.current += 1;
    setSummary(null);
    setSummaryError(null);
    setSummaryLoading(false);
    setSummaryVisible(false);
  }

  async function readErrorMessage(response: Response, fallback: string) {
    const data = await response.json().catch(() => null);
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
    return fallback;
  }

  function syncConversationQuery(conversationId: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (conversationId) {
      params.set("conversationId", conversationId);
    } else {
      params.delete("conversationId");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSelectConversation(conversationId: string) {
    resetSummaryState();
    setConversationError(null);
    setSelected(conversationId);
    syncConversationQuery(conversationId);
  }

  function handleBack() {
    resetSummaryState();
    setConversationError(null);
    setSelected(null);
    syncConversationQuery(null);
  }

  async function handleSendMessage(content: string) {
    if (!selected) {
      return;
    }

    setSending(true);
    setConversationError(null);

    try {
      const response = await fetch(`/api/conversations/${selected}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Não foi possível enviar a mensagem."),
        );
      }

      await Promise.all([refetchMessages(), refetch()]);
    } catch (error) {
      setConversationError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a mensagem.",
      );
      throw error;
    } finally {
      setSending(false);
    }
  }

  async function toggleBotMode(conversationId: string, currentStatus: string) {
    const nextStatus = currentStatus === "bot" ? "human" : "bot";

    setSwitching(true);
    setConversationError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        setConversationError(
          await readErrorMessage(
            response,
            "Não foi possível atualizar o modo da conversa.",
          ),
        );
        return;
      }

      await refetch();
    } finally {
      setSwitching(false);
    }
  }

  async function handleGenerateSummary() {
    if (!selected || !showSummary) {
      return;
    }

    summaryAbortRef.current?.abort();

    const controller = new AbortController();
    const requestId = summaryRequestIdRef.current + 1;

    summaryAbortRef.current = controller;
    summaryRequestIdRef.current = requestId;
    setSummaryLoading(true);
    setSummaryVisible(true);
    setSummary(null);
    setSummaryError(null);

    try {
      const response = await fetch(`/api/conversations/${selected}/summary`, {
        method: "POST",
        signal: controller.signal,
      });

      if (summaryRequestIdRef.current !== requestId) {
        return;
      }

      if (!response.ok) {
        setSummaryError(
          await readErrorMessage(
            response,
            "Não foi possível gerar o resumo desta conversa.",
          ),
        );
        return;
      }

      const data = (await response.json()) as ConversationSummary;

      if (summaryRequestIdRef.current !== requestId) {
        return;
      }

      setSummary(data);
    } catch (error) {
      if (controller.signal.aborted || summaryRequestIdRef.current !== requestId) {
        return;
      }

      setSummaryError(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o resumo desta conversa.",
      );
    } finally {
      if (controller.signal.aborted || summaryRequestIdRef.current !== requestId) {
        return;
      }

      setSummaryLoading(false);
      summaryAbortRef.current = null;
    }
  }

  const combinedError = conversationError || conversationsError || messagesError;
  const conversationList = (
    <ConversationSidebar
      search={search}
      selectedId={selected}
      conversations={conversations || []}
      onSearchChange={setSearch}
      onSelect={handleSelectConversation}
    />
  );

  const chatPanel = selectedConversation ? (
    <div className="flex h-full flex-col">
      <ConversationHeader
        conversation={selectedConversation}
        switching={switching}
        summaryLoading={summaryLoading}
        showSummary={showSummary}
        onBack={handleBack}
        onToggleMode={() =>
          toggleBotMode(selectedConversation.id, selectedConversation.status)
        }
        onGenerateSummary={handleGenerateSummary}
      />

      {showSummary && summaryVisible ? (
        <ConversationSummaryPanel
          summary={summary}
          loading={summaryLoading}
          error={summaryError}
          onRetry={handleGenerateSummary}
          onClose={resetSummaryState}
        />
      ) : null}

      {combinedError ? (
        <div className="border-t border-red-blush bg-red-pale px-3 py-2 text-xs text-red-dark sm:px-4">
          {combinedError}
        </div>
      ) : null}

      <ConversationMessages messages={messages || []} />

      <MessageInput
        onSend={handleSendMessage}
        disabled={!selected}
        sending={sending}
        className="border-t border-neutral-border p-2 sm:p-3"
      />
    </div>
  ) : (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={<MessageSquare className="h-12 w-12 text-neutral-line" />}
        title="Selecione uma conversa"
        description="Escolha uma conversa a esquerda para ver as mensagens"
      />
    </div>
  );

  return (
    <PageContainer title="Conversas" subtitle={subtitle}>
      <div className="flex h-[calc(100vh-13rem)] overflow-hidden rounded-xl border border-neutral-border bg-white">
        <div
          className={cn(
            "w-full shrink-0 border-r border-neutral-border md:block md:w-80",
            selected ? "hidden" : "block",
          )}
        >
          {conversationList}
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col md:flex",
            selected ? "flex" : "hidden",
          )}
        >
          {chatPanel}
        </div>
      </div>
    </PageContainer>
  );
}
