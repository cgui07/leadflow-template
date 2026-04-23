"use client";

import { cn } from "@/lib/utils";
import { X, Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAudioRecorder } from "./useAudioRecorder";

function formatSeconds(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

interface AudioRecorderBarProps {
  onSendAudio: (blob: Blob, mimeType: string) => Promise<void>;
  onClose: () => void;
  className?: string;
}

export function AudioRecorderBar({
  onSendAudio,
  onClose,
  className,
}: AudioRecorderBarProps) {
  const { state, seconds, error, start, cancel, send } = useAudioRecorder({
    onSend: onSendAudio,
  });

  const isSending = state === "sending";
  const isRecording = state === "recording";

  function handleCancel() {
    cancel();
    onClose();
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 bg-neutral-surface px-3 py-2 sm:px-4 sm:py-3",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={isSending}
        icon={<X className="h-5 w-5 text-neutral" />}
        className="shrink-0"
        title="Cancelar"
      />

      <div className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
        {isRecording && (
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
        )}
        {isSending && (
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-teal-500" />
        )}
        {state === "idle" && (
          <Mic className="h-4 w-4 shrink-0 text-neutral-muted" />
        )}

        <span className="flex-1 text-sm text-neutral-dark">
          {isSending
            ? "Enviando…"
            : isRecording
              ? "Gravando…"
              : "Clique em gravar"}
        </span>

        <span className="font-mono text-sm tabular-nums text-neutral-muted">
          {formatSeconds(seconds)}
        </span>
      </div>

      {error && (
        <span className="text-xs text-danger">{error}</span>
      )}

      {state === "idle" ? (
        <Button
          size="sm"
          onClick={start}
          icon={<Mic className="h-5 w-5" />}
          className="shrink-0 rounded-full bg-red-500 text-white hover:bg-red-600"
          title="Iniciar gravação"
        />
      ) : (
        <Button
          onClick={send}
          loading={isSending}
          disabled={!isRecording}
          icon={<Send className="h-5 w-5" />}
          className={cn(
            "shrink-0 rounded-full",
            isRecording
              ? "bg-whatsapp text-white hover:bg-whatsapp-dark"
              : "bg-neutral-border text-neutral-muted",
          )}
          title="Enviar áudio"
        />
      )}
    </div>
  );
}
