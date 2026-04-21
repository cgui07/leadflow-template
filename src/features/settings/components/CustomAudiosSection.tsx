"use client";

import { Button } from "@/components/ui/Button";
import { useRef, useState, useEffect } from "react";
import { useCustomAudios } from "../hooks/useCustomAudios";
import { TextareaField } from "@/components/forms/TextareaField";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { Mic, Square, RotateCcw, Save, Plus, Trash2, Loader2, Play, Pause } from "lucide-react";

type RecorderState = "idle" | "recording" | "preview" | "saving" | "error";

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

interface AudioItemProps {
  id: string;
  context: string;
  mimeType: string;
  audioBase64: string;
  onRemove: (id: string) => Promise<void>;
}

function AudioItem({ id, context, mimeType, audioBase64, onRemove }: AudioItemProps) {
  const [playing, setPlaying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const src = `data:${mimeType};base64,${audioBase64}`;

  function togglePlay() {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      void audioRef.current.play();
      setPlaying(true);
    }
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  async function handleRemove() {
    setRemoving(true);
    try {
      await onRemove(id);
    } finally {
      setRemoving(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-neutral-border bg-neutral-surface p-4">
        <button
          type="button"
          onClick={togglePlay}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-blue-royal"
        >
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-neutral uppercase tracking-wide mb-1">Contexto de envio</p>
          <p className="text-sm text-foreground leading-relaxed">{context}</p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral transition hover:bg-red-pale hover:text-red-dark"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <DeleteConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRemove}
        loading={removing}
        title="Remover áudio"
        description="Esse áudio personalizado será removido permanentemente. A IA não o enviará mais."
      />
    </>
  );
}

interface RecorderFormProps {
  saveAudio: (blob: Blob, mimeType: string, context: string) => Promise<unknown>;
  onSaved: () => void;
}

function RecorderForm({ saveAudio, onSaved }: RecorderFormProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [context, setContext] = useState("");
  const [contextError, setContextError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlobMime, setAudioBlobMime] = useState("audio/webm");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    if (!context.trim()) {
      setContextError("Preencha o contexto antes de gravar.");
      return;
    }
    setContextError(null);
    setErrorMsg(null);
    setElapsed(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
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
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setErrorMsg("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
      setState("error");
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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

  async function handleSave() {
    if (!audioBlobRef.current) return;
    if (!context.trim()) { setContextError("Contexto é obrigatório."); return; }

    setState("saving");
    try {
      await saveAudio(audioBlobRef.current, audioBlobMime, context.trim());
      reset();
      setContext("");
      onSaved();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao salvar");
      setState("error");
    }
  }

  return (
    <div className="space-y-4 rounded-xl border-2 border-dashed border-neutral-border bg-neutral-pale p-4">
      <TextareaField
        label="Contexto de envio (obrigatório)"
        value={context}
        onChange={(e) => { setContext(e.target.value); setContextError(null); }}
        placeholder="Ex: quando o lead perguntar sobre o preço, quando o lead confirmar interesse em visita..."
        rows={3}
        error={contextError ?? undefined}
      />

      {state === "idle" && (
        <Button
          variant="ghost"
          type="button"
          onClick={startRecording}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-border bg-white px-4 py-4 text-sm font-medium text-neutral-dark transition hover:border-primary hover:text-primary"
        >
          <Mic className="h-4 w-4" />
          Clique para gravar
        </Button>
      )}

      {state === "recording" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-DEFAULT bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-DEFAULT" />
            <span className="font-mono text-xl font-bold text-red-dark">{formatTime(elapsed)}</span>
          </div>
          <Button
            variant="ghost"
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-lg bg-red-crimson px-6 py-2 text-sm font-semibold text-white hover:bg-red-DEFAULT"
          >
            <Square className="h-4 w-4 fill-current" />
            Parar gravação
          </Button>
        </div>
      )}

      {state === "preview" && audioUrl && (
        <div className="space-y-3 rounded-xl border border-neutral-border bg-white p-4">
          <p className="text-xs font-medium text-neutral">Ouça antes de salvar:</p>
          <audio controls src={audioUrl} className="w-full" playsInline />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-border bg-white px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-pale"
            >
              <RotateCcw className="h-4 w-4" />
              Regravar
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={handleSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-royal"
            >
              <Save className="h-4 w-4" />
              Salvar áudio
            </Button>
          </div>
        </div>
      )}

      {state === "saving" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-neutral-border bg-white px-4 py-4 text-sm text-neutral">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Salvando áudio...
        </div>
      )}

      {state === "error" && (
        <div className="space-y-2">
          <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
            {errorMsg ?? "Ocorreu um erro. Tente novamente."}
          </div>
          <button type="button" onClick={reset} className="text-sm text-primary underline hover:text-blue-royal">
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}

export function CustomAudiosSection() {
  const { audios, loading, removeAudio, saveAudio } = useCustomAudios();
  const [showForm, setShowForm] = useState(false);

  const isEmpty = audios.length === 0;

  return (
    <SectionContainer
      title="Áudios personalizados"
      description="Grave áudios que a IA enviará automaticamente quando o contexto for detectado na conversa."
      actions={
        !showForm && !isEmpty ? (
          <Button
            variant="ghost"
            type="button"
            onClick={() => setShowForm(true)}
            icon={<Plus className="h-4 w-4" />}
            className="text-sm"
          >
            Adicionar
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-neutral" />
          </div>
        ) : (
          <>
            {audios.map((audio) => (
              <AudioItem key={audio.id} {...audio} onRemove={removeAudio} />
            ))}

            {(showForm || isEmpty) && (
              <RecorderForm
                saveAudio={saveAudio}
                onSaved={() => setShowForm(false)}
              />
            )}

            {!showForm && !isEmpty && audios.length > 0 && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-border px-4 py-3 text-sm text-neutral transition hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                Adicionar outro áudio
              </button>
            )}
          </>
        )}
      </div>
    </SectionContainer>
  );
}
