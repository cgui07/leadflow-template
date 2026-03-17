import { NextRequest } from "next/server";
import { createTask, listTasks } from "@/features/tasks/server";
import { error, handleError, json, requireAuth } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const rawStatus = req.nextUrl.searchParams.get("status") || "pending";
    const status =
      rawStatus === "completed" || rawStatus === "all" ? rawStatus : "pending";
    const tasks = await listTasks(user.id, status);

    return json(tasks);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const task = await createTask(
      user.id,
      (await req.json()) as Record<string, unknown>,
    );

    return json(task, 201);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "TASK_TITLE_REQUIRED") {
        return error("Título obrigatório");
      }

      if (err.message === "TASK_DUE_AT_INVALID") {
        return error("Data de vencimento inválida");
      }

      if (err.message === "TASK_TYPE_INVALID") {
        return error("Tipo de tarefa inválido", 400);
      }

      if (err.message === "TASK_LEAD_NOT_FOUND") {
        return error("Lead não encontrado", 404);
      }
    }

    if (err instanceof SyntaxError) {
      return error("Payload inválido");
    }

    return handleError(err);
  }
}
