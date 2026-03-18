import { NextRequest } from "next/server";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { deleteProperty } from "@/features/properties/server";

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
