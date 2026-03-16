import { listTasks } from "@/features/tasks/server";
import { requireSession } from "@/features/auth/session";
import { TasksPageClient } from "@/features/tasks/components/TasksPageClient";

export default async function TasksPage() {
  const session = await requireSession();
  const tasks = await listTasks(session.user.id, "pending");

  return <TasksPageClient initialStatus="pending" initialTasks={tasks} />;
}
