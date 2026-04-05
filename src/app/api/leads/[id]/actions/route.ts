import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { CreateLeadActionSchema } from "@/lib/schemas";
import { json, error, requireAuth, handleError } from "@/lib/api";
import {
  OPEN_ACTION_STATUSES,
  ACTION_TYPE_LABELS,
  type LeadActionType,
} from "@/lib/lead-action-config";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, userId: user.id },
    });
    if (!lead) return error("Lead não encontrado", 404);

    const actions = await prisma.leadAction.findMany({
      where: { leadId: id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return json(actions);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const raw = await req.json();
    const parsed = CreateLeadActionSchema.safeParse(raw);
    if (!parsed.success) {
      return error(parsed.error.issues[0]?.message || "Dados inválidos", 400);
    }
    const data = parsed.data;

    const lead = await prisma.lead.findFirst({
      where: { id, userId: user.id },
    });
    if (!lead) return error("Lead não encontrado", 404);

    // Check for existing open action of same type
    const existing = await prisma.leadAction.findFirst({
      where: {
        leadId: id,
        type: data.type,
        status: { in: OPEN_ACTION_STATUSES },
      },
    });

    if (existing) {
      return error(
        `Já existe uma ação aberta do tipo "${ACTION_TYPE_LABELS[data.type as LeadActionType]}" para este lead.`,
        409,
      );
    }

    const action = await prisma.leadAction.create({
      data: {
        userId: user.id,
        leadId: id,
        type: data.type,
        status: data.status || "pending",
        title: data.title || "",
        notes: data.notes || null,
        origin: "manual",
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
      },
    });

    return json(action, 201);
  } catch (err) {
    return handleError(err);
  }
}
