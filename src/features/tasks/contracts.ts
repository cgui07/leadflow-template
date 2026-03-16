export type TaskListStatus = "pending" | "completed" | "all";

export interface TaskItem {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  status: string;
  dueAt: string;
  completedAt?: string | null;
  lead?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}
