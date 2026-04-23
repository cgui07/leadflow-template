"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingState = "idle" | "recording" | "sending";

interface UseAudioRecorderOptions {
  onSend: (blob: Blob, mimeType: string) => Promise<void>;
}

export function useAudioRecorder({ onSend }: UseAudioRecorderOptions) {
  const [state, setState] = useState<RecordingState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100);
      setState("recording");
      setSeconds(0);

      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Não foi possível acessar o microfone.");
    }
  }, []);

  const cancel = useCallback(() => {
    stopTimer();
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    releaseStream();
    setState("idle");
    setSeconds(0);
    setError(null);
  }, [stopTimer, releaseStream]);

  const send = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || state !== "recording") return;

    stopTimer();

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      releaseStream();
      mediaRecorderRef.current = null;

      setState("sending");
      try {
        await onSend(blob, mimeType);
      } catch {
        setError("Não foi possível enviar o áudio.");
      } finally {
        setState("idle");
        setSeconds(0);
      }
    };

    recorder.stop();
  }, [state, stopTimer, releaseStream, onSend]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      mediaRecorderRef.current?.stop();
      releaseStream();
    };
  }, [stopTimer, releaseStream]);

  return { state, seconds, error, start, cancel, send };
}
