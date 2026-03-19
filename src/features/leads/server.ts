import { prisma } from "@/lib/db";
import { isLeadStatus } from "@/lib/lead-status";
import { getDefaultPipelineStageId } from "@/lib/pipeline";
import type { LeadDetail, LeadsListParams, LeadsResponse } from "./contracts";

const LEAD_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "score",
  "name",
  "lastContactAt",
]);

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizePage(value: number | undefined): number {
  return value && Number.isFinite(value) && value > 0 ? value : 1;
}

function normalizeLimit(value: number | undefined): number {
  return value && Number.isFinite(value)
    ? Math.min(Math.max(value, 1), 100)
    : 20;
}

function normalizeSort(value: string | undefined): string {
  return value && LEAD_SORT_FIELDS.has(value) ? value : "createdAt";
}

function normalizeOrder(value: string | undefined): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc";
}

export async function listLeads(
  userId: string,
  params: LeadsListParams,
): Promise<LeadsResponse> {
  const status = params.status;
  const search = params.search?.trim();
  const sort = normalizeSort(params.sort);
  const order = normalizeOrder(params.order);
  const page = normalizePage(params.page);
  const limit = normalizeLimit(params.limit);
  const where: Record<string, unknown> = { userId };

  if (status && status !== "all") {
    where.status = status;
  }

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

  return {
    leads: leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      status: lead.status,
      score: lead.score,
      source: lead.source,
      region: lead.region,
      value: toNumber(lead.value),
      createdAt: lead.createdAt.toISOString(),
      pipelineStage: lead.pipelineStage
        ? {
            name: lead.pipelineStage.name,
            color: lead.pipelineStage.color,
          }
        : null,
      conversation: lead.conversation
        ? {
            unreadCount: lead.conversation.unreadCount,
            lastMessageAt: lead.conversation.lastMessageAt?.toISOString() ?? null,
          }
        : null,
    })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function createLead(userId: string, input: Record<string, unknown>) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const rawPhone = typeof input.phone === "string" ? input.phone.trim() : "";
  const phone = rawPhone.replace(/\D/g, "") || rawPhone;

  if (!name || !phone) {
    throw new Error("LEAD_NAME_PHONE_REQUIRED");
  }

  const defaultPipelineStageId = await getDefaultPipelineStageId(userId);

  const lead = await prisma.lead.create({
    data: {
      userId,
      name,
      phone,
      email:
        typeof input.email === "string" && input.email.trim()
          ? input.email.trim()
          : null,
      source:
        typeof input.source === "string" && input.source.trim()
          ? input.source.trim()
          : "manual",
      status: "new",
      value: typeof input.value === "number" ? input.value : undefined,
      region:
        typeof input.region === "string" && input.region.trim()
          ? input.region.trim()
          : null,
      propertyType:
        typeof input.propertyType === "string" && input.propertyType.trim()
          ? input.propertyType.trim()
          : null,
      purpose:
        typeof input.purpose === "string" && input.purpose.trim()
          ? input.purpose.trim()
          : null,
      notes:
        typeof input.notes === "string" && input.notes.trim()
          ? input.notes.trim()
          : null,
      pipelineStageId: defaultPipelineStageId,
      conversation: { create: {} },
    },
  });

  await prisma.activity.create({
    data: {
      userId,
      leadId: lead.id,
      type: "status_change",
      title: "Lead criado manualmente",
    },
  });

  return lead;
}

export async function getLeadDetail(
  userId: string,
  leadId: string,
): Promise<LeadDetail | null> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
    include: {
      pipelineStage: true,
      conversation: {
        include: { messages: { orderBy: { createdAt: "desc" }, take: 50 } },
      },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      leadActions: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
    },
  });

  if (!lead) {
    return null;
  }

  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    status: lead.status,
    score: lead.score,
    source: lead.source,
    value: toNumber(lead.value),
    region: lead.region,
    priceMin: toNumber(lead.priceMin),
    priceMax: toNumber(lead.priceMax),
    propertyType: lead.propertyType,
    purpose: lead.purpose,
    timeline: lead.timeline,
    bedrooms: lead.bedrooms,
    notes: lead.notes,
    lastContactAt: lead.lastContactAt?.toISOString() ?? null,
    nextFollowUpAt: lead.nextFollowUpAt?.toISOString() ?? null,
    followUpCount: lead.followUpCount,
    createdAt: lead.createdAt.toISOString(),
    pipelineStage: lead.pipelineStage
      ? {
          id: lead.pipelineStage.id,
          name: lead.pipelineStage.name,
          color: lead.pipelineStage.color,
        }
      : null,
    conversation: lead.conversation
      ? {
          id: lead.conversation.id,
          status: lead.conversation.status,
          messages: lead.conversation.messages.map((message) => ({
            id: message.id,
            direction: message.direction,
            sender: message.sender,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
          })),
        }
      : null,
    activities: lead.activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      createdAt: activity.createdAt.toISOString(),
    })),
    leadActions: lead.leadActions.map((action) => ({
      id: action.id,
      type: action.type,
      status: action.status,
      title: action.title,
      notes: action.notes,
      origin: action.origin,
      scheduledAt: action.scheduledAt?.toISOString() ?? null,
      reminderAt: action.reminderAt?.toISOString() ?? null,
      completedAt: action.completedAt?.toISOString() ?? null,
      createdAt: action.createdAt.toISOString(),
      updatedAt: action.updatedAt.toISOString(),
    })),
  };
}

export async function updateLead(
  userId: string,
  leadId: string,
  input: Record<string, unknown>,
) {
  const existing = await prisma.lead.findFirst({
    where: { id: leadId, userId },
  });

  if (!existing) {
    throw new Error("LEAD_NOT_FOUND");
  }

  if (
    input.status &&
    (typeof input.status !== "string" || !isLeadStatus(input.status))
  ) {
    throw new Error("LEAD_STATUS_INVALID");
  }

  if (input.pipelineStageId !== undefined && input.pipelineStageId !== null) {
    if (
      typeof input.pipelineStageId !== "string" ||
      !input.pipelineStageId.trim()
    ) {
      throw new Error("LEAD_STAGE_INVALID");
    }

    const stage = await prisma.pipelineStage.findFirst({
      where: { id: input.pipelineStageId, userId },
      select: { id: true },
    });

    if (!stage) {
      throw new Error("LEAD_STAGE_NOT_FOUND");
    }
  }

  if (input.status && input.status !== existing.status) {
    await prisma.activity.create({
      data: {
        userId,
        leadId,
        type: "status_change",
        title: `Status alterado para ${input.status}`,
        metadata: { from: existing.status, to: input.status },
      },
    });
  }

  return prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(typeof input.name === "string" && { name: input.name.trim() }),
      ...(typeof input.phone === "string" && { phone: input.phone.trim() }),
      ...(input.email !== undefined && {
        email:
          typeof input.email === "string" && input.email.trim()
            ? input.email.trim()
            : null,
      }),
      ...(typeof input.status === "string" && { status: input.status }),
      ...(typeof input.score === "number" && { score: input.score }),
      ...(typeof input.value === "number" && { value: input.value }),
      ...(input.value === null && { value: null }),
      ...(input.region !== undefined && {
        region:
          typeof input.region === "string" && input.region.trim()
            ? input.region.trim()
            : null,
      }),
      ...(typeof input.priceMin === "number" && { priceMin: input.priceMin }),
      ...(input.priceMin === null && { priceMin: null }),
      ...(typeof input.priceMax === "number" && { priceMax: input.priceMax }),
      ...(input.priceMax === null && { priceMax: null }),
      ...(input.propertyType !== undefined && {
        propertyType:
          typeof input.propertyType === "string" && input.propertyType.trim()
            ? input.propertyType.trim()
            : null,
      }),
      ...(input.purpose !== undefined && {
        purpose:
          typeof input.purpose === "string" && input.purpose.trim()
            ? input.purpose.trim()
            : null,
      }),
      ...(input.timeline !== undefined && {
        timeline:
          typeof input.timeline === "string" && input.timeline.trim()
            ? input.timeline.trim()
            : null,
      }),
      ...(typeof input.bedrooms === "number" && { bedrooms: input.bedrooms }),
      ...(input.bedrooms === null && { bedrooms: null }),
      ...(input.notes !== undefined && {
        notes:
          typeof input.notes === "string" && input.notes.trim()
            ? input.notes.trim()
            : null,
      }),
      ...(input.pipelineStageId !== undefined && {
        pipelineStageId: input.pipelineStageId,
      }),
    },
  });
}

export async function deleteLead(userId: string, leadId: string) {
  const existing = await prisma.lead.findFirst({
    where: { id: leadId, userId },
  });

  if (!existing) {
    throw new Error("LEAD_NOT_FOUND");
  }

  await prisma.lead.delete({ where: { id: leadId } });
}
