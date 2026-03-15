import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { normalizePipelineColor } from "@/lib/ui-colors";
import { json, requireAuth, handleError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth();

    const stages = await prisma.pipelineStage.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
      include: {
        leads: {
          select: {
            id: true, name: true, phone: true, score: true, value: true,
            status: true, lastContactAt: true, createdAt: true,
          },
          orderBy: { score: "desc" },
        },
      },
    });

    return json(stages);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { name, color } = await req.json();

    const maxOrder = await prisma.pipelineStage.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
    });

    const stage = await prisma.pipelineStage.create({
      data: {
        userId: user.id,
        name,
        color: normalizePipelineColor(color),
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return json(stage, 201);
  } catch (err) {
    return handleError(err);
  }
}
