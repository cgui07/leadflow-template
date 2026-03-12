import { prisma } from "@/lib/db";
import { json, requireAuth, handleError } from "@/lib/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = req.nextUrl;
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    const where: Record<string, unknown> = { lead: { userId: user.id } };
    if (status && status !== "all") where.status = status;
    if (search) {
      where.lead = {
        userId: user.id,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      };
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      include: {
        lead: { select: { id: true, name: true, phone: true, avatarUrl: true, score: true, status: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return json(conversations);
  } catch (err) {
    return handleError(err);
  }
}
