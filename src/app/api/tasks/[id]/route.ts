import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { isTaskStatus } from "@/lib/task-config";
import { json, error, requireAuth, handleError } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });
    if (!existing) return error("Tarefa não encontrada", 404);

    if (data.status && (typeof data.status !== "string" || !isTaskStatus(data.status))) {
      return error("Status de tarefa invalido", 400);
    }

    if (
      data.dueAt !== undefined &&
      data.dueAt !== null &&
      Number.isNaN(new Date(data.dueAt).getTime())
    ) {
      return error("Data de vencimento invalida", 400);
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(typeof data.title === "string" && { title: data.title.trim() }),
        ...(data.description !== undefined && {
          description:
            typeof data.description === "string" && data.description.trim()
              ? data.description.trim()
              : null,
        }),
        status: data.status,
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
        completedAt:
          data.status === "completed"
            ? new Date()
            : data.status === "pending"
              ? null
              : undefined,
      },
    });

    return json(task);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });
    if (!existing) return error("Tarefa não encontrada", 404);

    await prisma.task.delete({ where: { id } });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
