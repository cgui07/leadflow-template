"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_BRANDING,
  type TenantBranding,
} from "@/lib/branding";

export const AUTH_REFRESH_EVENT = "leadflow:auth-refresh";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  tenantId?: string | null;
}

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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(
    async (showLoading = false, signal?: AbortSignal) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const response = await fetch("/api/auth/me", {
          ...NO_STORE_FETCH_OPTIONS,
          signal,
        });

        if (!response.ok) {
          throw new Error("Nao foi possivel carregar a sessao");
        }

        const data = (await response.json()) as {
          user?: User | null;
          branding?: TenantBranding;
        };

        if (signal?.aborted) {
          return;
        }

        setUser(data.user || null);
        setBranding(data.branding || DEFAULT_BRANDING);
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        if (!signal?.aborted) {
          setUser(null);
          setBranding(DEFAULT_BRANDING);
        }
      } finally {
        if (showLoading && !signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadSession(true, controller.signal);

    function handleRefresh() {
      void loadSession(false);
    }

    window.addEventListener(AUTH_REFRESH_EVENT, handleRefresh);

    return () => {
      controller.abort();
      window.removeEventListener(AUTH_REFRESH_EVENT, handleRefresh);
    };
  }, [loadSession]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }, []);

  return { user, branding, loading, logout };
}

export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
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

    const controller = new AbortController();

    void runFetch(controller.signal);

    return () => {
      controller.abort();
    };
  }, [runFetch, url]);

  const refetch = useCallback(() => {
    return runFetch();
  }, [runFetch]);

  return { data, loading, error, refetch };
}
