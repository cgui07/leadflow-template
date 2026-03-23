import { requireAuth, json, error, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { MAX_PDF_SIZE } from "@/lib/storage";
import { NextRequest } from "next/server";

type PdfEntry = { url: string; filename: string; size: number };

function parsePdfs(raw: unknown): PdfEntry[] {
  if (Array.isArray(raw)) return raw as PdfEntry[];
  return [];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const property = await prisma.properties.findFirst({
      where: { id, user_id: user.id },
      select: { id: true, pdfs: true },
    });

    if (!property) {
      return error("Imóvel não encontrado.", 404);
    }

    const body = await req.json();
    const { key, filename, size } = body as { key?: string; filename?: string; size?: number };

    if (!key || typeof key !== "string") {
      return error("Parâmetro 'key' obrigatório.", 400);
    }
    if (!filename || typeof filename !== "string") {
      return error("Parâmetro 'filename' obrigatório.", 400);
    }
    if (!size || typeof size !== "number" || size <= 0 || size > MAX_PDF_SIZE) {
      return error("Parâmetro 'size' inválido.", 400);
    }

    // Ensure key belongs to this user/property to prevent spoofing
    const expectedPrefix = `${user.id}/${id}/`;
    if (!key.startsWith(expectedPrefix)) {
      return error("Chave de armazenamento inválida.", 403);
    }

    const newEntry: PdfEntry = { url: key, filename, size };
    const pdfs = parsePdfs(property.pdfs);
    pdfs.push(newEntry);

    await prisma.properties.update({
      where: { id },
      data: { pdfs, updated_at: new Date() },
    });

    return json(newEntry);
  } catch (err) {
    return handleError(err);
  }
}
