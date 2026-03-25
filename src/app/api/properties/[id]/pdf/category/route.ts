import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { isValidPdfCategory, parsePdfEntries } from "@/features/properties/types";
import type { PdfCategory } from "@/features/properties/types";

export async function PATCH(
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
    const { url, category } = body as { url: string; category: string };

    if (!url || !isValidPdfCategory(category)) {
      return error("Campos 'url' e 'category' são obrigatórios.", 400);
    }

    const pdfs = parsePdfEntries(property.pdfs);
    const updated = pdfs.map((p) =>
      p.url === url ? { ...p, category: category as PdfCategory } : p,
    );

    await prisma.properties.update({
      where: { id },
      data: { pdfs: JSON.parse(JSON.stringify(updated)), updated_at: new Date() },
    });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
