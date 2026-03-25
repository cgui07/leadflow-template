import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { deletePropertyPdf, verifyUploadExists } from "@/lib/storage";
import type { PdfCategory, PdfEntry } from "@/features/properties/types";
import { isValidPdfCategory, parsePdfEntries } from "@/features/properties/types";

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
    const { key, filename, size, category } = body as {
      key: string;
      filename: string;
      size: number;
      category: string;
    };

    if (!key || !filename || typeof size !== "number") {
      return error("Campos 'key', 'filename' e 'size' são obrigatórios.", 400);
    }

    if (!isValidPdfCategory(category)) {
      return error("Campo 'category' é obrigatório. Valores: BOOK, FLUXO, RENTABILIDADE, PRODUTO_PRONTO.", 400);
    }

    if (!key.startsWith(`${user.id}/`)) {
      return error("Acesso negado.", 403);
    }

    const actualSize = await verifyUploadExists(key);
    if (!actualSize) {
      return error("Arquivo não encontrado no storage. Tente o upload novamente.", 400);
    }

    const newEntry: PdfEntry = {
      url: key,
      filename,
      size: actualSize,
      category: category as PdfCategory,
    };

    const pdfs = parsePdfEntries(property.pdfs);
    pdfs.push(newEntry);

    await prisma.properties.update({
      where: { id },
      data: { pdfs: JSON.parse(JSON.stringify(pdfs)), updated_at: new Date() },
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

    const pdfs = parsePdfEntries(property.pdfs);
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
      data: { pdfs: JSON.parse(JSON.stringify(updated)), updated_at: new Date() },
    });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
