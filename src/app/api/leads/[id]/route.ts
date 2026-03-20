import { NextRequest } from "next/server";
import { handleError, json, requireAuth, error } from "@/lib/api";
import { deleteLead, getLeadDetail, updateLead } from "@/features/leads/server";
import { UpdateLeadSchema } from "@/lib/schemas";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const lead = await getLeadDetail(user.id, id);

    if (!lead) {
      return error("Lead não encontrado", 404);
    }

    return json(lead);
  } catch (err) {
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
    const data = UpdateLeadSchema.parse(await req.json());
    const lead = await updateLead(user.id, id, data as Record<string, unknown>);

    return json(lead);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "LEAD_NOT_FOUND") {
        return error("Lead não encontrado", 404);
      }
      if (err.message === "LEAD_STATUS_INVALID") {
        return error("Status de lead inválido", 400);
      }
      if (err.message === "LEAD_STAGE_INVALID") {
        return error("Estágio inválido", 400);
      }
      if (err.message === "LEAD_STAGE_NOT_FOUND") {
        return error("Estágio não encontrado", 404);
      }
    }

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
    await deleteLead(user.id, id);

    return json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "LEAD_NOT_FOUND") {
      return error("Lead não encontrado", 404);
    }

    return handleError(err);
  }
}
