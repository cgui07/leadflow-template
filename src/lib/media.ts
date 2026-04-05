import { env } from "./env";
import { logger } from "./logger";
import { getEvolutionApiKey } from "./evolution";

const EVOLUTION_API_URL = env.EVOLUTION_API_URL;
const OPENAI_TRANSCRIPTION_KEY = env.OPENAI_TRANSCRIPTION_KEY;

import {
  MAX_IMAGE_SIZE,
  MAX_AUDIO_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_AUDIO_SECONDS,
} from "./constants";

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
    logger.error("Failed to download from Evolution", { error: err instanceof Error ? err.message : String(err) });
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
      logger.warn("Audio too large for transcription", { size: buffer.length });
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
      logger.error("Whisper transcription failed", { status: res.status });
      return null;
    }

    const data = await res.json();
    return data.text || null;
  } catch (err) {
    logger.error("Transcription error", { error: err instanceof Error ? err.message : String(err) });
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

const MAGIC_BYTES: [string, number[], number?][] = [
  // Images
  ["image/jpeg", [0xff, 0xd8, 0xff]],
  ["image/png", [0x89, 0x50, 0x4e, 0x47]],
  ["image/gif", [0x47, 0x49, 0x46]],
  ["image/webp", [0x52, 0x49, 0x46, 0x46]],
  // Audio
  ["audio/ogg", [0x4f, 0x67, 0x67, 0x53]],
  ["audio/flac", [0x66, 0x4c, 0x61, 0x43]],
  ["audio/mpeg", [0xff, 0xfb]],
  ["audio/mpeg", [0xff, 0xf3]],
  ["audio/mpeg", [0xff, 0xf2]],
  ["audio/mpeg", [0x49, 0x44, 0x33]], // ID3 tag
  // Documents
  ["application/pdf", [0x25, 0x50, 0x44, 0x46]],
];

function detectMimeFromBytes(buffer: Buffer): string | null {
  for (const [mime, sig, offset] of MAGIC_BYTES) {
    const start = offset ?? 0;
    if (buffer.length < start + sig.length) continue;
    if (sig.every((b, i) => buffer[start + i] === b)) return mime;
  }
  // MP4/M4A (ftyp box at offset 4)
  if (buffer.length >= 8 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    return "video/mp4"; // covers audio/mp4 and video/mp4
  }
  return null;
}

function isMimeCompatible(declared: string, detected: string): boolean {
  // Normalize broad categories
  const d = declared.split(";")[0].trim().toLowerCase();
  const det = detected.toLowerCase();
  if (d === det) return true;
  // Allow audio/mp4 vs video/mp4 (same container)
  if ((d === "audio/mp4" || d === "video/mp4") && (det === "audio/mp4" || det === "video/mp4")) return true;
  // Allow audio/mpeg vs audio/mp3
  if ((d === "audio/mpeg" || d === "audio/mp3") && (det === "audio/mpeg" || det === "audio/mp3")) return true;
  // Same broad type (image/*, audio/*)
  const [dType] = d.split("/");
  const [detType] = det.split("/");
  if (dType === detType) return true;
  return false;
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
    logger.warn("Could not obtain base64", { mediaType });
    return null;
  }

  base64 = base64.replace(/^data:[^;]+;base64,/, "");

  const buffer = Buffer.from(base64, "base64");

  // Validate MIME type against magic bytes
  const detectedMime = detectMimeFromBytes(buffer);
  if (detectedMime && !isMimeCompatible(mimeType, detectedMime)) {
    logger.warn("MIME type mismatch", { declared: mimeType, detected: detectedMime });
    return null;
  }

  if (mediaType === "image") {
    if (buffer.length > MAX_IMAGE_SIZE) {
      logger.warn("Image too large", { size: buffer.length });
      return null;
    }
    return { type: "image", mimeType, base64 };
  }

  if (mediaType === "audio") {
    if (seconds && seconds > MAX_AUDIO_SECONDS) {
      logger.warn("Audio too long", { seconds });
      return null;
    }

    const openaiKey = getOpenAIKeyForTranscription(aiConfig);
    if (!openaiKey) {
      logger.warn("No OpenAI key available for audio transcription");
      return null;
    }

    const transcription = await transcribeAudio(base64, mimeType, openaiKey);
    if (!transcription) return null;

    return { type: "audio", mimeType, base64, transcription };
  }

  if (mediaType === "document") {
    if (buffer.length > MAX_DOCUMENT_SIZE) {
      logger.warn("Document too large", { size: buffer.length });
      return null;
    }
    return { type: "document", mimeType, base64, fileName };
  }

  return null;
}
