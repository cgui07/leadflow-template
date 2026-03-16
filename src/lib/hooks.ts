"use client";

import { useState, useEffect, useCallback } from "react";
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user || null);
        setBranding(data?.branding || DEFAULT_BRANDING);
      })
      .catch(() => {
        setUser(null);
        setBranding(DEFAULT_BRANDING);
      })
      .finally(() => {
        if (showLoading) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSession(true);
    });

    function handleRefresh() {
      void loadSession(false);
    }

    window.addEventListener(AUTH_REFRESH_EVENT, handleRefresh);
    return () => {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!url) return;
    setError(null);
    setLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar dados");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => {
    if (!url) return;
    queueMicrotask(refetch);
  }, [url, refetch]);

  return { data, loading, error, refetch };
}
