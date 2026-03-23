import { requireAuth, json, error, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { buildPdfStorageKey, generatePresignedUploadUrl, MAX_PDF_SIZE } from "@/lib/storage";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const property = await prisma.properties.findFirst({
      where: { id, user_id: user.id },
      select: { id: true },
    });

    if (!property) {
      return error("Imóvel não encontrado.", 404);
    }

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename") ?? "document.pdf";
    const size = parseInt(searchParams.get("size") ?? "0", 10);

    if (!filename.toLowerCase().endsWith(".pdf")) {
      return error("Apenas arquivos PDF são aceitos.", 400);
    }
    if (size <= 0 || size > MAX_PDF_SIZE) {
      return error("Tamanho de arquivo inválido ou excede 100MB.", 400);
    }

    const key = buildPdfStorageKey(user.id, id);
    const uploadUrl = await generatePresignedUploadUrl(key);

    return json({ uploadUrl, key, filename, size });
  } catch (err) {
    return handleError(err);
  }
}
