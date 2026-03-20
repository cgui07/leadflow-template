"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const NO_STORE_FETCH_OPTIONS = {
  cache: "no-store" as const,
  credentials: "same-origin" as const,
  headers: {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
  },
};

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

interface UseFetchOptions<T> {
  initialData?: T | null;
  revalidateOnMount?: boolean;
}

export function useFetchMutation<T = unknown>(url: string, options?: { method?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mutate(body?: unknown): Promise<T | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: options?.method ?? "POST",
        headers: { "Content-Type": "application/json" },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao processar requisição");
        return null;
      }
      return await res.json();
    } catch {
      setError("Erro de conexão");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { mutate, loading, error, setError };
}

export function useFetch<T>(
  url: string | null,
  options?: UseFetchOptions<T>,
) {
  const hasInitialData = options && "initialData" in options;
  const initialData = options?.initialData ?? null;
  const initialUrlRef = useRef(url);
  const [data, setData] = useState<T | null>(hasInitialData ? initialData : null);
  const revalidateOnMount = options?.revalidateOnMount ?? !hasInitialData;
  const [loading, setLoading] = useState(Boolean(url) && (revalidateOnMount || !hasInitialData));
  const [error, setError] = useState<string | null>(null);

  const runFetch = useCallback(
    async (signal?: AbortSignal) => {
      if (!url) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const response = await fetch(url, {
          ...NO_STORE_FETCH_OPTIONS,
          signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error || "Erro ao carregar dados");
        }

        const nextData = (await response.json()) as T;

        if (signal?.aborted) {
          return;
        }

        setData(nextData);
      } catch (fetchError) {
        if (isAbortError(fetchError)) {
          return;
        }

        if (!signal?.aborted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Erro ao carregar dados",
          );
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [url],
  );

  useEffect(() => {
    if (!url) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (
      url === initialUrlRef.current &&
      hasInitialData &&
      !revalidateOnMount
    ) {
      return;
    }

    const controller = new AbortController();

    void runFetch(controller.signal);

    return () => {
      controller.abort();
    };
  }, [hasInitialData, revalidateOnMount, runFetch, url]);

  const refetch = useCallback(() => {
    return runFetch();
  }, [runFetch]);

  return { data, loading, error, refetch };
}
