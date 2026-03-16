import { NextRequest } from "next/server";
import { deleteTask, updateTask } from "@/features/tasks/server";
import { error, handleError, json, requireAuth } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const task = await updateTask(
      user.id,
      id,
      (await req.json()) as Record<string, unknown>,
    );

    return json(task);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "TASK_NOT_FOUND") {
        return error("Tarefa não encontrada", 404);
      }

      if (err.message === "TASK_STATUS_INVALID") {
        return error("Status de tarefa inválido", 400);
      }

      if (err.message === "TASK_DUE_AT_INVALID") {
        return error("Data de vencimento invalida", 400);
      }
    }

    if (err instanceof SyntaxError) {
      return error("Payload inválido");
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
    await deleteTask(user.id, id);

    return json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "TASK_NOT_FOUND") {
      return error("Tarefa não encontrada", 404);
    }

    return handleError(err);
  }
}
