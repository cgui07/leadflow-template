export const TASK_TYPES = [
  "follow_up",
  "call",
  "visit",
  "proposal",
  "other",
] as const;

export const TASK_STATUSES = ["pending", "completed"] as const;

export type TaskType = (typeof TASK_TYPES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  follow_up: "Follow-up",
  call: "Ligação",
  visit: "Visita",
  proposal: "Proposta",
  other: "Outro",
};

export const TASK_TYPE_OPTIONS = TASK_TYPES.map((value) => ({
  value,
  label: TASK_TYPE_LABELS[value],
}));

export function isTaskType(value: string): value is TaskType {
  return TASK_TYPES.includes(value as TaskType);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}
