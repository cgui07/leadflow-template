import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { isTaskType } from "@/lib/task-config";
import { error, json, requireAuth, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const status = req.nextUrl.searchParams.get("status") || "pending";

    const tasks = await prisma.task.findMany({
      where: { userId: user.id, ...(status !== "all" ? { status } : {}) },
      orderBy: { dueAt: "asc" },
      include: { lead: { select: { id: true, name: true, phone: true } } },
    });

    return json(tasks);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await req.json();
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const dueAt = new Date(data.dueAt);

    if (!title) {
      return error("Titulo obrigatorio");
    }

    if (Number.isNaN(dueAt.getTime())) {
      return error("Data de vencimento invalida");
    }

    if (data.type && (typeof data.type !== "string" || !isTaskType(data.type))) {
      return error("Tipo de tarefa invalido", 400);
    }

    let leadId: string | null = null;
    if (typeof data.leadId === "string" && data.leadId.trim()) {
      const lead = await prisma.lead.findFirst({
        where: { id: data.leadId, userId: user.id },
        select: { id: true },
      });

      if (!lead) {
        return error("Lead nao encontrado", 404);
      }

      leadId = lead.id;
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        leadId,
        type: data.type || "follow_up",
        title,
        description:
          typeof data.description === "string" && data.description.trim()
            ? data.description.trim()
            : null,
        dueAt,
      },
    });

    return json(task, 201);
  } catch (err) {
    return handleError(err);
  }
}
