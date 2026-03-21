import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { uploadPropertyPdf, deletePropertyPdf } from "@/lib/storage";

const MAX_PDF_SIZE = 100 * 1024 * 1024;

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

    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return error("Nenhum arquivo enviado.", 400);
    }
    if (file.type !== "application/pdf") {
      return error("Apenas arquivos PDF são aceitos.", 400);
    }
    if (file.size > MAX_PDF_SIZE) {
      return error("O arquivo excede o limite de 100MB.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = await uploadPropertyPdf(user.id, id, buffer, file.type);

    const newEntry: PdfEntry = {
      url: storagePath,
      filename: file.name,
      size: file.size,
    };

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const { searchParams } = new URL(req.url);
    const pdfUrl = searchParams.get("url");

    if (!pdfUrl) {
      return error("Parâmetro 'url' obrigatório.", 400);
    }

    const property = await prisma.properties.findFirst({
      where: { id, user_id: user.id },
      select: { id: true, pdfs: true },
    });

    if (!property) {
      return error("Imóvel não encontrado.", 404);
    }

    const pdfs = parsePdfs(property.pdfs);
    const exists = pdfs.some((p) => p.url === pdfUrl);

    if (!exists) {
      return error("PDF não encontrado.", 404);
    }

    await deletePropertyPdf(pdfUrl).catch((err) =>
      logger.error("[pdf] Failed to delete PDF from storage", { error: err instanceof Error ? err.message : String(err) }),
    );

    const updated = pdfs.filter((p) => p.url !== pdfUrl);

    await prisma.properties.update({
      where: { id },
      data: { pdfs: updated, updated_at: new Date() },
    });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
