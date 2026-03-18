import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { requireAuth, json, error, handleError } from "@/lib/api";
import {
  uploadPropertyPdf,
  deletePropertyPdf,
} from "@/lib/storage";

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const property = await prisma.properties.findFirst({
      where: { id, user_id: user.id },
      select: { id: true, pdf_url: true },
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
      return error("O arquivo excede o limite de 10MB.", 400);
    }

    // Delete old PDF if exists
    if (property.pdf_url) {
      await deletePropertyPdf(property.pdf_url).catch((err) =>
        console.error("[pdf] Failed to delete old PDF:", err),
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = await uploadPropertyPdf(user.id, id, buffer, file.type);

    await prisma.properties.update({
      where: { id },
      data: {
        pdf_url: storagePath,
        pdf_filename: file.name,
        pdf_size: file.size,
        updated_at: new Date(),
      },
    });

    return json({
      pdf_url: storagePath,
      pdf_filename: file.name,
      pdf_size: file.size,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const property = await prisma.properties.findFirst({
      where: { id, user_id: user.id },
      select: { id: true, pdf_url: true },
    });

    if (!property) {
      return error("Imóvel não encontrado.", 404);
    }

    if (!property.pdf_url) {
      return error("Este imóvel não possui PDF.", 400);
    }

    await deletePropertyPdf(property.pdf_url).catch((err) =>
      console.error("[pdf] Failed to delete PDF:", err),
    );

    await prisma.properties.update({
      where: { id },
      data: {
        pdf_url: null,
        pdf_filename: null,
        pdf_size: null,
        updated_at: new Date(),
      },
    });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
