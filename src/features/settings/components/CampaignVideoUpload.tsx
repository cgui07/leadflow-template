"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader, Trash2, Upload, Video } from "lucide-react";

interface CampaignVideoUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
}

export function CampaignVideoUpload({
  value,
  onChange,
  label,
}: CampaignVideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.type !== "video/mp4") {
      setError("Use video MP4.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Tamanho maximo: 10MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const presignRes = await fetch("/api/settings/campaign-video/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao preparar upload.");
      }

      const { url, publicUrl } = await presignRes.json();
      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Erro ao enviar video.");
      }

      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-neutral">{label}</div>

      {value ? (
        <div className="space-y-2">
          <video
            src={value}
            controls
            className="max-h-40 rounded-lg border border-border"
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => onChange(null)}
          >
            Remover
          </Button>
        </div>
      ) : (
        <div
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-surface-alt p-3 transition-colors hover:border-primary"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-neutral">
            {uploading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Video className="h-4 w-4" />
            )}
          </div>
          <div className="text-xs text-neutral">
            {uploading
              ? "Enviando..."
              : "Clique para escolher video (MP4, max. 10MB)"}
          </div>
          {!uploading && <Upload className="ml-auto h-3.5 w-3.5 text-neutral" />}
        </div>
      )}

      {error && <div className="text-xs text-red-dark">{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
