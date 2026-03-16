export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualifying",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualifying: "Qualificando",
  qualified: "Qualificado",
  proposal: "Proposta",
  negotiation: "Negociação",
  won: "Ganho",
  lost: "Perdido",
};

export const LEAD_STATUS_BADGE_VARIANTS: Record<
  LeadStatus,
  "info" | "default" | "purple" | "warning" | "success" | "error"
> = {
  new: "info",
  contacted: "default",
  qualifying: "purple",
  qualified: "success",
  proposal: "warning",
  negotiation: "warning",
  won: "success",
  lost: "error",
};

export const LEAD_STATUS_SOFT_CLASSES: Record<LeadStatus, string> = {
  new: "bg-info-10 text-info",
  contacted: "bg-gray-ghost text-neutral-dark",
  qualifying: "bg-purple-pale text-secondary",
  qualified: "bg-green-pale text-success",
  proposal: "bg-yellow-pale text-warning",
  negotiation: "bg-orange-pale text-accent",
  won: "bg-green-pale text-green-dark",
  lost: "bg-red-pale text-danger",
};

export const LEAD_STATUS_OPTIONS = LEAD_STATUSES.map((value) => ({
  value,
  label: LEAD_STATUS_LABELS[value],
}));

export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.includes(value as LeadStatus);
}
