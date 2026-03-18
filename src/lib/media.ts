import { getEvolutionApiKey } from "./evolution";

const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || "http://localhost:8080";
const OPENAI_TRANSCRIPTION_KEY = process.env.OPENAI_TRANSCRIPTION_KEY || "";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const MAX_AUDIO_SECONDS = 120;

export interface MediaContent {
  type: "image" | "audio" | "document";
  mimeType: string;
  base64: string;
  transcription?: string;
  fileName?: string;
}

export async function downloadMediaFromEvolution(
  instanceName: string,
  messageId: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`,
      {
        method: "POST",
        headers: {
          apikey: getEvolutionApiKey(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: { key: { id: messageId } } }),
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.base64 || null;
  } catch (err) {
    console.error("[media] Failed to download from Evolution:", err);
    return null;
  }
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
  openaiApiKey: string,
): Promise<string | null> {
  try {
    const ext = mimeType.includes("ogg")
      ? "ogg"
      : mimeType.includes("mp4")
        ? "mp4"
        : mimeType.includes("mpeg")
          ? "mp3"
          : "webm";

    const buffer = Buffer.from(audioBase64, "base64");

    if (buffer.length > MAX_AUDIO_SIZE) {
      console.warn("[media] Audio too large for transcription:", buffer.length);
      return null;
    }

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([buffer], { type: mimeType }),
      `audio.${ext}`,
    );
    formData.append("model", "whisper-1");
    formData.append("language", "pt");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}` },
      body: formData,
    });

    if (!res.ok) {
      console.error("[media] Whisper transcription failed:", res.status);
      return null;
    }

    const data = await res.json();
    return data.text || null;
  } catch (err) {
    console.error("[media] Transcription error:", err);
    return null;
  }
}

function getOpenAIKeyForTranscription(aiConfig: {
  provider: string;
  apiKey: string;
  transcriptionApiKey?: string;
}): string | null {
  if (aiConfig.provider === "openai") return aiConfig.apiKey;
  if (aiConfig.transcriptionApiKey) return aiConfig.transcriptionApiKey;
  if (OPENAI_TRANSCRIPTION_KEY) return OPENAI_TRANSCRIPTION_KEY;
  return null;
}

export async function resolveMediaContent(params: {
  mediaType: string;
  base64Data?: string | null;
  mimeType: string;
  fileName?: string;
  seconds?: number;
  instanceName: string;
  messageId: string;
  aiConfig: { provider: string; apiKey: string };
}): Promise<MediaContent | null> {
  const {
    mediaType,
    mimeType,
    fileName,
    seconds,
    instanceName,
    messageId,
    aiConfig,
  } = params;

  let base64 = params.base64Data || null;

  if (!base64) {
    base64 = await downloadMediaFromEvolution(instanceName, messageId);
  }

  if (!base64) {
    console.warn("[media] Could not obtain base64 for", mediaType);
    return null;
  }

  base64 = base64.replace(/^data:[^;]+;base64,/, "");

  const buffer = Buffer.from(base64, "base64");

  if (mediaType === "image") {
    if (buffer.length > MAX_IMAGE_SIZE) {
      console.warn("[media] Image too large:", buffer.length);
      return null;
    }
    return { type: "image", mimeType, base64 };
  }

  if (mediaType === "audio") {
    if (seconds && seconds > MAX_AUDIO_SECONDS) {
      console.warn("[media] Audio too long:", seconds, "seconds");
      return null;
    }

    const openaiKey = getOpenAIKeyForTranscription(aiConfig);
    if (!openaiKey) {
      console.warn("[media] No OpenAI key available for audio transcription");
      return null;
    }

    const transcription = await transcribeAudio(base64, mimeType, openaiKey);
    if (!transcription) return null;

    return { type: "audio", mimeType, base64, transcription };
  }

  if (mediaType === "document") {
    if (buffer.length > MAX_DOCUMENT_SIZE) {
      console.warn("[media] Document too large:", buffer.length);
      return null;
    }
    return { type: "document", mimeType, base64, fileName };
  }

  return null;
}
