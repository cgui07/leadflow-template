import { prisma } from "@/lib/db";
import { json, requireAuth, handleError } from "@/lib/api";
import { NextRequest } from "next/server";

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

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        leadId: data.leadId,
        type: data.type || "follow_up",
        title: data.title,
        description: data.description,
        dueAt: new Date(data.dueAt),
      },
    });

    return json(task, 201);
  } catch (err) {
    return handleError(err);
  }
}
