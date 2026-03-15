export const LEAD_ACTION_TYPES = ["visit", "proposal", "financing"] as const;
export type LeadActionType = (typeof LEAD_ACTION_TYPES)[number];

export const LEAD_ACTION_STATUSES = [
  "pending",
  "awaiting_schedule",
  "scheduled",
  "done",
  "completed",
  "cancelled",
] as const;
export type LeadActionStatus = (typeof LEAD_ACTION_STATUSES)[number];

export const LEAD_ACTION_ORIGINS = ["ai", "manual"] as const;
export type LeadActionOrigin = (typeof LEAD_ACTION_ORIGINS)[number];

export const OPEN_ACTION_STATUSES: LeadActionStatus[] = [
  "pending",
  "awaiting_schedule",
  "scheduled",
  "done",
];

export const ACTION_TYPE_LABELS: Record<LeadActionType, string> = {
  visit: "Visita",
  proposal: "Proposta",
  financing: "Simulação/Financiamento",
};

export const ACTION_STATUS_LABELS: Record<LeadActionStatus, string> = {
  pending: "Pendente",
  awaiting_schedule: "Aguardando agendamento",
  scheduled: "Agendado",
  done: "Realizado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const ACTION_STATUS_BADGE_VARIANT: Record<
  LeadActionStatus,
  "warning" | "info" | "purple" | "success" | "default" | "error"
> = {
  pending: "warning",
  awaiting_schedule: "info",
  scheduled: "purple",
  done: "info",
  completed: "success",
  cancelled: "error",
};

export const ACTION_TYPE_DEFAULT_TITLES: Record<LeadActionType, string> = {
  visit: "Visita solicitada pelo lead",
  proposal: "Proposta solicitada pelo lead",
  financing: "Simulação/financiamento solicitada pelo lead",
};
