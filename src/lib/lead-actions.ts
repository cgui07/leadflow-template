import { prisma } from "./db";
import {
  ACTION_TYPE_DEFAULT_TITLES,
  ACTION_TYPE_LABELS,
  OPEN_ACTION_STATUSES,
  type LeadActionType,
} from "./lead-action-config";

export async function upsertLeadActionFromAI(
  userId: string,
  leadId: string,
  type: LeadActionType,
) {
  const existing = await prisma.leadAction.findFirst({
    where: {
      leadId,
      type,
      status: { in: OPEN_ACTION_STATUSES },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return { action: existing, created: false };
  }

  const action = await prisma.leadAction.create({
    data: {
      userId,
      leadId,
      type,
      status: "pending",
      title: ACTION_TYPE_DEFAULT_TITLES[type],
      origin: "ai",
    },
  });

  await prisma.activity.create({
    data: {
      userId,
      leadId,
      type: "lead_action_created",
      title: `${ACTION_TYPE_LABELS[type]} detectada pela IA`,
      description:
        "Ação criada automáticamente a partir de sinal detectado na conversa.",
    },
  });

  return { action, created: true };
}
