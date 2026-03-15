import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { json, error, requireAuth, handleError } from "@/lib/api";
import {
  LEAD_ACTION_TYPES,
  LEAD_ACTION_STATUSES,
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
    if (!lead) return error("Lead nao encontrado", 404);

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
    const data = await req.json();

    const lead = await prisma.lead.findFirst({
      where: { id, userId: user.id },
    });
    if (!lead) return error("Lead nao encontrado", 404);

    if (!data.type || !LEAD_ACTION_TYPES.includes(data.type)) {
      return error(
        `Tipo invalido. Use: ${LEAD_ACTION_TYPES.join(", ")}`,
        400,
      );
    }

    if (data.status && !LEAD_ACTION_STATUSES.includes(data.status)) {
      return error(
        `Status invalido. Use: ${LEAD_ACTION_STATUSES.join(", ")}`,
        400,
      );
    }

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
        `Ja existe uma acao aberta do tipo "${ACTION_TYPE_LABELS[data.type as LeadActionType]}" para este lead.`,
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
