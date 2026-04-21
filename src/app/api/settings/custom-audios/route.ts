import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB base64

const ALLOWED_MIMES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
]);

export async function GET() {
  try {
    const user = await requireAuth();

    const audios = await prisma.customAudio.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        context: true,
        mimeType: true,
        audioBase64: true,
        createdAt: true,
      },
    });

    return json(audios);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const context = (formData.get("context") as string | null)?.trim();

    if (!audioFile) return error("Arquivo de áudio não enviado");
    if (!context) return error("Contexto é obrigatório");
    if (context.length > 1000) return error("Contexto muito longo (máximo 1000 caracteres)");

    const mimeBase = audioFile.type.split(";")[0].trim();
    if (!ALLOWED_MIMES.has(audioFile.type) && !ALLOWED_MIMES.has(mimeBase)) {
      return error("Formato de áudio não suportado");
    }

    if (audioFile.size > MAX_AUDIO_BYTES) {
      return error("Áudio muito grande (máximo 10MB)");
    }

    const existing = await prisma.customAudio.count({ where: { userId: user.id } });
    if (existing >= 20) {
      return error("Limite de 20 áudios personalizados atingido");
    }

    const buffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(buffer).toString("base64");

    const created = await prisma.customAudio.create({
      data: {
        userId: user.id,
        context,
        audioBase64,
        mimeType: audioFile.type || "audio/webm",
      },
      select: {
        id: true,
        context: true,
        mimeType: true,
        audioBase64: true,
        createdAt: true,
      },
    });

    return json(created, 201);
  } catch (err) {
    return handleError(err);
  }
}
