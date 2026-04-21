"use client";

import { useState, useEffect, useCallback } from "react";

export interface CustomAudio {
  id: string;
  context: string;
  mimeType: string;
  audioBase64: string;
  createdAt: string;
}

export function useCustomAudios() {
  const [audios, setAudios] = useState<CustomAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/custom-audios");
      if (!res.ok) throw new Error("Erro ao carregar áudios");
      const data = (await res.json()) as CustomAudio[];
      setAudios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveAudio(audioBlob: Blob, mimeType: string, context: string): Promise<CustomAudio | null> {
    const formData = new FormData();
    const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
    formData.append("audio", audioBlob, `recording.${ext}`);
    formData.append("context", context);

    const res = await fetch("/api/settings/custom-audios", {
      method: "POST",
      body: formData,
    });

    const data = (await res.json()) as CustomAudio & { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Erro ao salvar áudio");

    setAudios((prev) => [...prev, data]);
    return data;
  }

  async function removeAudio(id: string) {
    const res = await fetch(`/api/settings/custom-audios/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Erro ao remover áudio");
    }
    setAudios((prev) => prev.filter((a) => a.id !== id));
  }

  return { audios, loading, error, saveAudio, removeAudio };
}
