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
    const filename = body.filename as string;
    const size = body.size as number;

    if (!filename || typeof size !== "number") {
      return error("Campos 'filename' e 'size' são obrigatórios.", 400);
    }

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
