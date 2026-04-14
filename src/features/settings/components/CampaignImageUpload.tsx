"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageIcon, Loader, Trash2, Upload } from "lucide-react";

interface CampaignImageUploadProps {
  slot: "outreach" | "second";
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
}

export function CampaignImageUpload({
  slot,
  value,
  onChange,
  label,
}: CampaignImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Use JPG, PNG, WEBP ou GIF.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Tamanho máximo: 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const presignRes = await fetch("/api/settings/campaign-image/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          slot,
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
        throw new Error("Erro ao enviar imagem.");
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
        <div className="flex items-center gap-3">
          <Image
            src={value}
            alt="Imagem de campanha"
            width={64}
            height={64}
            className="h-16 w-16 rounded-lg object-cover border border-border"
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
          className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface-alt p-3 cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-neutral">
            {uploading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </div>
          <div className="text-xs text-neutral">
            {uploading
              ? "Enviando..."
              : "Clique para escolher imagem (JPG, PNG, WEBP · máx 5MB)"}
          </div>
          {!uploading && (
            <Upload className="h-3.5 w-3.5 text-neutral ml-auto" />
          )}
        </div>
      )}

      {error && <div className="text-xs text-red-dark">{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
