import type { ConversationSummary } from "../contracts";
import { useCallback, useEffect, useRef, useState } from "react";

export function useConversationSummary(showSummary: boolean) {
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const summaryAbortRef = useRef<AbortController | null>(null);
  const summaryRequestIdRef = useRef(0);

  const resetSummaryState = useCallback(() => {
    summaryAbortRef.current?.abort();
    summaryAbortRef.current = null;
    summaryRequestIdRef.current += 1;
    setSummary(null);
    setSummaryError(null);
    setSummaryLoading(false);
    setSummaryVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      summaryAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!showSummary) {
      resetSummaryState();
    }
  }, [showSummary, resetSummaryState]);

  const generateSummary = useCallback(
    async (conversationId: string) => {
      if (!showSummary) return;

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
        const response = await fetch(
          `/api/conversations/${conversationId}/summary`,
          {
            method: "POST",
            signal: controller.signal,
          },
        );

        if (summaryRequestIdRef.current !== requestId) return;

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setSummaryError(
            typeof data?.error === "string" && data.error.trim()
              ? data.error
              : "Não foi possível gerar o resumo desta conversa.",
          );
          return;
        }

        const data = (await response.json()) as ConversationSummary;
        if (summaryRequestIdRef.current !== requestId) return;
        setSummary(data);
      } catch (error) {
        if (
          controller.signal.aborted ||
          summaryRequestIdRef.current !== requestId
        )
          return;

        setSummaryError(
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o resumo desta conversa.",
        );
      } finally {
        if (
          controller.signal.aborted ||
          summaryRequestIdRef.current !== requestId
        )
          return;

        setSummaryLoading(false);
        summaryAbortRef.current = null;
      }
    },
    [showSummary],
  );

  return {
    summary,
    summaryError,
    summaryLoading,
    summaryVisible,
    resetSummaryState,
    generateSummary,
  };
}
