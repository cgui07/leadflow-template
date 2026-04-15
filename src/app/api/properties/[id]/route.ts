import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { deleteProperty } from "@/features/properties/server";
import { requireAuth, json, error, handleError } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await deleteProperty(user.id, id);
    return json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return error("Imóvel não encontrado.", 404);
    }
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const property = await prisma.properties.findFirst({
      where: { id, user_id: user.id },
    });
    if (!property) return error("Imóvel não encontrado.", 404);

    const body = await req.json();
    const { name, rawText } = body as { name: string; rawText?: string };

    if (!name?.trim()) return error("Nome é obrigatório.", 400);

    // Se tem descrição, extrai dados com IA
    if (rawText && rawText.trim().length >= 10) {
      const settings = await prisma.userSettings.findUnique({
        where: { userId: user.id },
      });
      if (!settings?.aiApiKey) {
        return error("Configure uma chave de IA nas configurações.", 400);
      }
      const { extractPropertyData } = await import("@/lib/ai");
      const extracted = await extractPropertyData(
        { provider: settings.aiProvider, apiKey: settings.aiApiKey, model: settings.aiModel },
        rawText,
      );
      const updated = await prisma.properties.update({
        where: { id },
        data: {
          raw_text: rawText,
          title: extracted?.title ?? name.trim(),
          type: extracted?.type ?? null,
          purpose: extracted?.purpose ?? null,
          price: extracted?.price ?? null,
          area: extracted?.area ?? null,
          bedrooms: extracted?.bedrooms ?? null,
          bathrooms: extracted?.bathrooms ?? null,
          parking_spots: extracted?.parkingSpots ?? null,
          address: extracted?.address ?? null,
          neighborhood: extracted?.neighborhood ?? null,
          city: extracted?.city ?? null,
          state: extracted?.state ?? null,
          amenities: extracted?.amenities ?? [],
          description: extracted?.description ?? null,
          updated_at: new Date(),
        },
      });
      return json(updated);
    }

    // Sem descrição — só atualiza o nome
    const updated = await prisma.properties.update({
      where: { id },
      data: { title: name.trim(), updated_at: new Date() },
    });
    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}
