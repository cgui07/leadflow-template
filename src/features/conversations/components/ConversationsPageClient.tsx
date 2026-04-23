"use client";

import { cn } from "@/lib/utils";
import { useFetch } from "@/lib/hooks";
import { FaWhatsapp } from "react-icons/fa";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { PageContainer } from "@/components/layout/PageContainer";
import type { ConversationItem, MessageItem } from "../contracts";
import { MessageInput } from "@/components/domain/chat/MessageInput";
import { useConversationSummary } from "../hooks/useConversationSummary";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useState } from "react";
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
  const [selected, setSelected] = useState<string | null>(
    initialSelectedConversationId,
  );
  const [sending, setSending] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(
    null,
  );

  const {
    summary,
    summaryError,
    summaryLoading,
    summaryVisible,
    resetSummaryState,
    generateSummary,
  } = useConversationSummary(showSummary);

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
  const {
    data: messages,
    error: messagesError,
    refetch: refetchMessages,
  } = useFetch<MessageItem[]>(
    selected ? `/api/conversations/${selected}/messages` : null,
    {
      initialData:
        initialSelectedConversationId &&
        initialSelectedConversationId === selected
          ? initialMessages
          : null,
      revalidateOnMount: false,
    },
  );
  const selectedConversationIdFromUrl = searchParams.get("conversationId");
  const selectedConversation = conversations?.find((c) => c.id === selected);

  useEffect(() => {
    if (!selectedConversationIdFromUrl) {
      if (selected === null) return;
      resetSummaryState();
      setConversationError(null);
      setSelected(null);
      return;
    }

    if (!conversations?.length) return;

    const hasConversationInList = conversations.some(
      (c) => c.id === selectedConversationIdFromUrl,
    );

    if (!hasConversationInList || selected === selectedConversationIdFromUrl)
      return;

    resetSummaryState();
    setConversationError(null);
    setSelected(selectedConversationIdFromUrl);
  }, [conversations, selected, selectedConversationIdFromUrl, resetSummaryState]);

  // Poll messages for selected conversation
  useEffect(() => {
    if (!selected) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refetchMessages();
    }, 3000);
    return () => clearInterval(id);
  }, [selected, refetchMessages]);

  // Poll conversation list
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, 10000);
    return () => clearInterval(id);
  }, [refetch]);

  const readErrorMessage = useCallback(async (response: Response, fallback: string) => {
    const data = await response.json().catch(() => null);
    return typeof data?.error === "string" && data.error.trim()
      ? data.error
      : fallback;
  }, []);

  const syncConversationQuery = useCallback((conversationId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (conversationId) {
      params.set("conversationId", conversationId);
    } else {
      params.delete("conversationId");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const handleSelectConversation = useCallback((conversationId: string) => {
    resetSummaryState();
    setConversationError(null);
    setSelected(conversationId);
    syncConversationQuery(conversationId);
  }, [resetSummaryState, syncConversationQuery]);

  const handleBack = useCallback(() => {
    resetSummaryState();
    setConversationError(null);
    setSelected(null);
    syncConversationQuery(null);
  }, [resetSummaryState, syncConversationQuery]);

  const handleSendAudio = useCallback(async (blob: Blob, mimeType: string) => {
    if (!selected) return;

    setSending(true);
    setConversationError(null);

    try {
      const ext = mimeType.includes("ogg") ? "ogg" : "webm";
      const formData = new FormData();
      formData.append("file", blob, `audio.${ext}`);
      formData.append("mediaType", "audio");

      const response = await fetch(`/api/conversations/${selected}/media`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Não foi possível enviar o áudio."),
        );
      }

      await Promise.all([refetchMessages(), refetch()]);
    } catch (error) {
      setConversationError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o áudio.",
      );
      throw error;
    } finally {
      setSending(false);
    }
  }, [selected, readErrorMessage, refetchMessages, refetch]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selected) return;

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
          await readErrorMessage(
            response,
            "Não foi possível enviar a mensagem.",
          ),
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
  }, [selected, readErrorMessage, refetchMessages, refetch]);

  const toggleBotMode = useCallback(async (conversationId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "bot" || currentStatus === "active" ? "human" : "bot";
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
  }, [readErrorMessage, refetch]);

  const handleGenerateSummary = useCallback(() => {
    if (selected) generateSummary(selected);
  }, [selected, generateSummary]);

  const combinedError =
    conversationError || conversationsError || messagesError;

  return (
    <PageContainer title="WhatsApp" subtitle={subtitle}>
      <div className="flex h-[calc(100vh-13rem)] overflow-hidden rounded-xl border border-neutral-border bg-white">
        <div
          className={cn(
            "w-full shrink-0 border-r border-neutral-border md:block md:w-80",
            selected ? "hidden" : "block",
          )}
        >
          <ConversationSidebar
            search={search}
            selectedId={selected}
            conversations={conversations || []}
            onSearchChange={setSearch}
            onSelect={handleSelectConversation}
          />
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col md:flex",
            selected ? "flex" : "hidden",
          )}
        >
          {selectedConversation ? (
            <div className="flex h-full flex-col">
              <ConversationHeader
                conversation={selectedConversation}
                switching={switching}
                summaryLoading={summaryLoading}
                showSummary={showSummary}
                onBack={handleBack}
                onToggleMode={() =>
                  toggleBotMode(
                    selectedConversation.id,
                    selectedConversation.status,
                  )
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
                <ErrorAlert
                  error={combinedError}
                  className="rounded-none border-x-0 border-b-0 border-t px-3 py-2 text-xs sm:px-4"
                />
              ) : null}

              <ConversationMessages messages={messages || []} />

              <MessageInput
                onSend={handleSendMessage}
                onSendAudio={handleSendAudio}
                disabled={!selected}
                sending={sending}
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={<FaWhatsapp className="h-12 w-12 text-neutral-line" />}
                title="Selecione uma conversa"
                description="Escolha uma conversa a esquerda para ver as mensagens"
              />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
