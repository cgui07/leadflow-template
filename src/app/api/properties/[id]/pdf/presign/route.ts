import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { createPresignedUploadUrl } from "@/lib/storage";
import { requireAuth, json, error, handleError } from "@/lib/api";

export async function POST(
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

    const body = await req.json();
    const rawFilename = body.filename as string;
    const size = body.size as number;

    if (!rawFilename || typeof size !== "number") {
      return error("Campos 'filename' e 'size' são obrigatórios.", 400);
    }

    // Sanitize filename: strip path traversal, null bytes, allow only safe chars
    const basename = rawFilename.split(/[/\\]/).pop() || "";
    const sanitized = basename.replace(/\0/g, "").replace(/[^a-zA-Z0-9._\-\s()]/g, "_").trim();

    if (!sanitized || !sanitized.toLowerCase().endsWith(".pdf")) {
      return error("Apenas arquivos .pdf são permitidos.", 400);
    }

    const filename = sanitized;

    const MAX_PDF_SIZE = 100 * 1024 * 1024;
    if (size > MAX_PDF_SIZE) {
      return error("O arquivo excede o limite de 100MB.", 400);
    }

    const { key, url } = await createPresignedUploadUrl(user.id, id, filename);

    return json({ key, url, filename, size });
  } catch (err) {
    return handleError(err);
  }
}
