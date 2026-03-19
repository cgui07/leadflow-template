"use client";

import { Button } from "@/components/ui/Button";
import { useRef, useState, useEffect } from "react";
import { Mic, Square, Send, RotateCcw, Check, Loader2 } from "lucide-react";

type RecorderState =
  | "idle"
  | "recording"
  | "preview"
  | "uploading"
  | "done"
  | "error";

interface VoiceCloneRecorderProps {
  currentVoiceId: string | null;
  onVoiceCloned: (voiceId: string) => void;
}

const MIN_SECONDS = 10;
const SUGGESTED_SECONDS = 30;

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function VoiceCloneRecorder({
  currentVoiceId,
  onVoiceCloned,
}: VoiceCloneRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlobMime, setAudioBlobMime] = useState("audio/webm");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    setErrorMsg(null);
    setElapsed(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blobMime = mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobMime });
        audioBlobRef.current = blob;
        setAudioBlobMime(blobMime);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("preview");
      };

      recorder.start(100);
      setState("recording");

      timerRef.current = setInterval(() => {
        setElapsed((s) => s + 1);
      }, 1000);

      autoStopRef.current = setTimeout(() => {
        stopRecording();
      }, SUGGESTED_SECONDS * 1000);
    } catch {
      setErrorMsg(
        "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
      );
      setState("error");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  }

  function reset() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audioBlobRef.current = null;
    setElapsed(0);
    setErrorMsg(null);
    setState("idle");
  }

  async function uploadVoice() {
    if (!audioBlobRef.current) return;

    setState("uploading");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      const ext = audioBlobMime.includes("mp4")
        ? "m4a"
        : audioBlobMime.includes("ogg")
          ? "ogg"
          : "webm";
      formData.append("audio", audioBlobRef.current, `recording.${ext}`);

      const res = await fetch("/api/settings/voice-clone", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { voiceId?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao clonar voz");
      }

      onVoiceCloned(data.voiceId!);
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado");
      setState("error");
    }
  }

  function formatTime(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  const isMinMet = elapsed >= MIN_SECONDS;
  const progress = Math.min((elapsed / SUGGESTED_SECONDS) * 100, 100);
  const remaining = Math.max(0, SUGGESTED_SECONDS - elapsed);

  if (state === "done") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-sage bg-green-pale px-4 py-3 text-sm text-green-dark">
        <Check className="h-4 w-4 shrink-0" />
        <span>Voz clonada com sucesso! O áudio já está ativo no WhatsApp.</span>
        <Button
          variant="ghost"
          type="button"
          onClick={reset}
          className="ml-auto text-xs text-neutral underline hover:text-green-dark"
        >
          Regravar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {currentVoiceId && state === "idle" && (
        <div className="flex items-center gap-2 rounded-lg border border-neutral-border bg-neutral-surface px-3 py-2 text-xs text-neutral">
          <Check className="h-3.5 w-3.5 text-green-DEFAULT" />
          Voz configurada — grave novamente para substituir
        </div>
      )}

      {state === "idle" && (
        <Button
          variant="ghost"
          type="button"
          onClick={startRecording}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-border bg-neutral-surface px-4 py-5 text-sm font-medium text-neutral-dark transition hover:border-primary hover:text-primary"
        >
          <Mic className="h-5 w-5" />
          Clique para gravar sua voz (mínimo {MIN_SECONDS}s, ideal{" "}
          {SUGGESTED_SECONDS}s)
        </Button>
      )}

      {state === "recording" && (
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-red-DEFAULT bg-white px-4 py-5">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-DEFAULT" />
            <span className="font-mono text-2xl font-bold text-red-dark">
              {formatTime(elapsed)}
            </span>
          </div>
          <div className="w-full overflow-hidden rounded-full bg-neutral-border h-2">
            <div
              className="h-2 rounded-full bg-red-DEFAULT transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center text-xs text-neutral-dark">
            {isMinMet
              ? remaining > 0
                ? `Continue por mais ${remaining}s para melhor qualidade.`
                : "Qualidade ideal atingida — parando..."
              : `Grave pelo menos mais ${MIN_SECONDS - elapsed}s para continuar.`}
          </div>

          <Button
            variant="ghost"
            type="button"
            onClick={stopRecording}
            disabled={!isMinMet}
            className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition ${
              isMinMet
                ? "bg-red-crimson text-white hover:bg-red-DEFAULT"
                : "bg-red-blush text-red-dark opacity-70 cursor-not-allowed"
            }`}
          >
            <Square className="h-4 w-4 fill-current" />
            {isMinMet ? "Parar gravação" : `Aguarde ${MIN_SECONDS - elapsed}s`}
          </Button>
        </div>
      )}

      {state === "preview" && audioUrl && (
        <div className="space-y-3 rounded-xl border border-neutral-border bg-neutral-surface p-4">
          <div className="text-sm font-medium text-neutral-dark">
            Ouça antes de enviar:
          </div>
          <audio controls src={audioUrl} className="w-full" playsInline />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-border bg-white px-4 py-2 text-sm text-neutral-dark transition hover:bg-neutral-pale"
            >
              <RotateCcw className="h-4 w-4" />
              Regravar
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={uploadVoice}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-royal"
            >
              <Send className="h-4 w-4" />
              Clonar minha voz
            </Button>
          </div>
        </div>
      )}

      {state === "uploading" && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-5 text-sm text-neutral">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Clonando sua voz no ElevenLabs...
        </div>
      )}

      {state === "error" && (
        <div className="space-y-2">
          <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
            {errorMsg ?? "Ocorreu um erro. Tente novamente."}
          </div>
          <Button
            variant="ghost"
            type="button"
            onClick={reset}
            className="text-sm text-primary underline hover:text-blue-royal"
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}
