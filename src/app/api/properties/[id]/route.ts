import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
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

    const updated = await prisma.properties.update({
      where: { id },
      data: {
        title: body.title ?? null,
        type: body.type ?? null,
        purpose: body.purpose ?? null,
        price: body.price ? body.price : null,
        area: body.area ? body.area : null,
        bedrooms: body.bedrooms != null ? Number(body.bedrooms) : null,
        bathrooms: body.bathrooms != null ? Number(body.bathrooms) : null,
        parking_spots: body.parking_spots != null ? Number(body.parking_spots) : null,
        address: body.address ?? null,
        neighborhood: body.neighborhood ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        amenities: Array.isArray(body.amenities) ? body.amenities : [],
        description: body.description ?? null,
        updated_at: new Date(),
      },
    });

    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}
