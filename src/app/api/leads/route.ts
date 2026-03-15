import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { json, requireAuth, handleError } from "@/lib/api";
import { getDefaultPipelineStageId } from "@/lib/pipeline";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = req.nextUrl;

    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { userId: user.id };
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          pipelineStage: { select: { name: true, color: true } },
          conversation: { select: { unreadCount: true, lastMessageAt: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return json({ leads, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await req.json();
    const defaultPipelineStageId = await getDefaultPipelineStageId(user.id);

    const lead = await prisma.lead.create({
      data: {
        userId: user.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        source: data.source || "manual",
        status: "new",
        value: data.value,
        region: data.region,
        propertyType: data.propertyType,
        purpose: data.purpose,
        notes: data.notes,
        pipelineStageId: defaultPipelineStageId,
        conversation: { create: {} },
      },
    });

    await prisma.activity.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        type: "status_change",
        title: "Lead criado manualmente",
      },
    });

    return json(lead, 201);
  } catch (err) {
    return handleError(err);
  }
}
