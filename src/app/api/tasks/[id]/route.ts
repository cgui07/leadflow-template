import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { json, error, requireAuth, handleError } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });
    if (!existing) return error("Tarefa não encontrada", 404);

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
        completedAt: data.status === "completed" ? new Date() : undefined,
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
