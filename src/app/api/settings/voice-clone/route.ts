import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { cloneVoice, deleteVoice } from "@/lib/elevenlabs";
import { error, handleError, json, requireAuth } from "@/lib/api";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const apiKey = env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return error("ElevenLabs não configurado no servidor", 500);
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const voiceName = (formData.get("name") as string | null) ?? user.name ?? "Voz LeadFlow";

    if (!audioFile) {
      return error("Arquivo de áudio não enviado");
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      return error("Áudio muito grande (máximo 10MB)");
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
