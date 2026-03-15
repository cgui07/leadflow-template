import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { LEAD_ACTION_STATUSES } from "@/lib/lead-action-config";
import { json, error, requireAuth, handleError } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> },
) {
  try {
    const user = await requireAuth();
    const { id, actionId } = await params;
    const data = await req.json();

    const action = await prisma.leadAction.findFirst({
      where: { id: actionId, leadId: id, userId: user.id },
    });
    if (!action) return error("Ação não encontrada", 404);

    if (data.status && !LEAD_ACTION_STATUSES.includes(data.status)) {
      return error(
        `Status inválido. Use: ${LEAD_ACTION_STATUSES.join(", ")}`,
        400,
      );
    }

    const isCompleting =
      data.status === "completed" || data.status === "cancelled";

    const updated = await prisma.leadAction.update({
      where: { id: actionId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        }),
        ...(data.reminderAt !== undefined && {
          reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
        }),
        ...(isCompleting && { completedAt: new Date() }),
        updatedAt: new Date(),
      },
    });

    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> },
) {
  try {
    const user = await requireAuth();
    const { id, actionId } = await params;

    const action = await prisma.leadAction.findFirst({
      where: { id: actionId, leadId: id, userId: user.id },
    });
    if (!action) return error("Ação não encontrada", 404);

    await prisma.leadAction.delete({ where: { id: actionId } });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
