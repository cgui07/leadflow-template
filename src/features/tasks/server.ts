import { prisma } from "@/lib/db";
import type { TaskListStatus } from "./contracts";
import { isTaskStatus, isTaskType } from "@/lib/task-config";

function mapTask(task: {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: Date;
  completedAt: Date | null;
  lead?: { id: string; name: string; phone: string } | null;
}) {
  return {
    id: task.id,
    type: task.type,
    title: task.title,
    description: task.description,
    status: task.status,
    dueAt: task.dueAt.toISOString(),
    completedAt: task.completedAt?.toISOString() ?? null,
    lead: task.lead ?? null,
  };
}

export async function listTasks(userId: string, status: TaskListStatus) {
  const tasks = await prisma.task.findMany({
    where: { userId, ...(status !== "all" ? { status } : {}) },
    orderBy: { dueAt: "asc" },
    include: { lead: { select: { id: true, name: true, phone: true } } },
  });

  return tasks.map(mapTask);
}

export async function createTask(userId: string, input: Record<string, unknown>) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const dueAt = new Date(typeof input.dueAt === "string" ? input.dueAt : "");

  if (!title) {
    throw new Error("TASK_TITLE_REQUIRED");
  }

  if (Number.isNaN(dueAt.getTime())) {
    throw new Error("TASK_DUE_AT_INVALID");
  }

  if (
    input.type &&
    (typeof input.type !== "string" || !isTaskType(input.type))
  ) {
    throw new Error("TASK_TYPE_INVALID");
  }

  let leadId: string | null = null;
  if (typeof input.leadId === "string" && input.leadId.trim()) {
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, userId },
      select: { id: true },
    });

    if (!lead) {
      throw new Error("TASK_LEAD_NOT_FOUND");
    }

    leadId = lead.id;
  }

  const task = await prisma.task.create({
    data: {
      userId,
      leadId,
      type: typeof input.type === "string" ? input.type : "follow_up",
      title,
      description:
        typeof input.description === "string" && input.description.trim()
          ? input.description.trim()
          : null,
      dueAt,
    },
    include: { lead: { select: { id: true, name: true, phone: true } } },
  });

  return mapTask(task);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: Record<string, unknown>,
) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) {
    throw new Error("TASK_NOT_FOUND");
  }

  if (
    input.status &&
    (typeof input.status !== "string" || !isTaskStatus(input.status))
  ) {
    throw new Error("TASK_STATUS_INVALID");
  }

  if (
    input.dueAt !== undefined &&
    input.dueAt !== null &&
    (typeof input.dueAt !== "string" ||
      Number.isNaN(new Date(input.dueAt).getTime()))
  ) {
    throw new Error("TASK_DUE_AT_INVALID");
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(typeof input.title === "string" && { title: input.title.trim() }),
      ...(input.description !== undefined && {
        description:
          typeof input.description === "string" && input.description.trim()
            ? input.description.trim()
            : null,
      }),
      ...(typeof input.status === "string" && { status: input.status }),
      ...(typeof input.dueAt === "string" && { dueAt: new Date(input.dueAt) }),
      completedAt:
        input.status === "completed"
          ? new Date()
          : input.status === "pending"
            ? null
            : undefined,
    },
    include: { lead: { select: { id: true, name: true, phone: true } } },
  });

  return mapTask(task);
}

export async function deleteTask(userId: string, taskId: string) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) {
    throw new Error("TASK_NOT_FOUND");
  }

  await prisma.task.delete({ where: { id: taskId } });
}
