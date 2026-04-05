import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { cloneVoice, deleteVoice } from "@/lib/elevenlabs";
import { error, handleError, json, requireAuth } from "@/lib/api";

const ALLOWED_AUDIO_MIMES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
  "audio/x-m4a",
  "audio/aac",
]);

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Rate limit: 3 clones per hour per user
    const { allowed } = checkRateLimit(`voice-clone:${user.id}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
    });
    if (!allowed) {
      return error("Limite de clonagem atingido. Tente novamente em 1 hora.", 429);
    }

    const apiKey = env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return error("ElevenLabs não configurado no servidor", 500);
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const voiceName = (formData.get("name") as string | null) ?? user.name ?? "Voz LospeFlow";

    if (!audioFile) {
      return error("Arquivo de áudio não enviado");
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      return error("Áudio muito grande (máximo 10MB)");
    }

    if (!ALLOWED_AUDIO_MIMES.has(audioFile.type)) {
      return error("Tipo de arquivo não permitido. Envie um arquivo de áudio válido.");
    }

    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });

    // Delete previous cloned voice if exists
    const existing = await prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: { elevenlabsVoiceId: true },
    });

    if (existing?.elevenlabsVoiceId) {
      try {
        await deleteVoice(existing.elevenlabsVoiceId, apiKey);
      } catch {
        // Non-critical — continue even if delete fails
      }
    }

    const voiceId = await cloneVoice(audioBlob, voiceName, apiKey);

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, elevenlabsVoiceId: voiceId, voiceReplyEnabled: true },
      update: { elevenlabsVoiceId: voiceId, voiceReplyEnabled: true },
    });

    return json({ voiceId });
  } catch (err) {
    return handleError(err);
  }
}
