"use client";

import Link from "next/link";
import { useState } from "react";
import { useFetch } from "@/lib/hooks";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TaskItem, TaskListStatus } from "../contracts";
import { CheckCircle, Clock, Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import {
  DateField,
  Form,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/forms";

const typeLabels: Record<string, string> = {
  follow_up: "Follow-up",
  call: "Ligação",
  visit: "Visita",
  proposal: "Proposta",
  other: "Outro",
};

const typeOptions = [
  { value: "follow_up", label: "Follow-up" },
  { value: "call", label: "Ligação" },
  { value: "visit", label: "Visita" },
  { value: "proposal", label: "Proposta" },
  { value: "other", label: "Outro" },
];

interface TasksPageClientProps {
  initialStatus: TaskListStatus;
  initialTasks: TaskItem[];
}

export function TasksPageClient({
  initialStatus,
  initialTasks,
}: TasksPageClientProps) {
  const [tab, setTab] = useState<TaskListStatus>(initialStatus);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "follow_up",
    dueAt: "",
    description: "",
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    data: tasks,
    error,
    refetch,
  } = useFetch<TaskItem[]>(`/api/tasks?status=${tab}`, {
    initialData: initialTasks,
    revalidateOnMount: false,
  });

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setActionError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setActionError(payload?.error || "Não foi possível criar a tarefa.");
        return;
      }

      setShowCreate(false);
      setForm({ title: "", type: "follow_up", dueAt: "", description: "" });
      await refetch();
    } finally {
      setCreating(false);
    }
  }

  async function completeTask(id: string) {
    setActionError(null);

    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setActionError(payload?.error || "Não foi possível atualizar a tarefa.");
      return;
    }

    await refetch();
  }

  async function removeTask(id: string) {
    setActionError(null);

    const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setActionError(payload?.error || "Não foi possível remover a tarefa.");
      return;
    }

    await refetch();
  }

  const taskList = tasks || [];
  const overdue = taskList.filter((task) => {
    return task.status === "pending" && new Date(task.dueAt) < new Date();
  });

  return (
    <PageContainer
      title="Tarefas"
      subtitle="Gerencie seus follow-ups e tarefas"
      actions={
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          Nova Tarefa
        </Button>
      }
    >
      {error || actionError ? (
        <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
          {actionError || error}
        </div>
      ) : null}

      {overdue.length > 0 && tab === "pending" ? (
        <div className="rounded-lg border border-red-blush bg-red-pale p-3">
          <div className="text-sm font-medium text-danger">
            {overdue.length} tarefa(s) atrasada(s)
          </div>
        </div>
      ) : null}

      <Tabs
        tabs={[
          { id: "pending", label: "Pendentes" },
          { id: "completed", label: "Concluidas" },
          { id: "all", label: "Todas" },
        ]}
        activeTab={tab}
        onTabChange={(nextTab) => setTab(nextTab as TaskListStatus)}
      />

      <SectionContainer>
        {!taskList.length ? (
          <EmptyState
            title="Nenhuma tarefa"
            description={
              tab === "pending"
                ? "Todas as tarefas estão em dia!"
                : "Nenhuma tarefa encontrada."
            }
          />
        ) : (
          <div className="space-y-2">
            {taskList.map((task) => {
              const isOverdue =
                task.status === "pending" && new Date(task.dueAt) < new Date();

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    isOverdue
                      ? "border-red-blush bg-red-pale"
                      : "border-neutral-border"
                  }`}
                >
                  {task.status === "pending" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => completeTask(task.id)}
                      icon={<CheckCircle size={20} />}
                      className="h-auto p-0"
                    />
                  ) : (
                    <CheckCircle size={20} className="text-success" />
                  )}

                  <div className="flex-1">
                    <div
                      className={`text-sm font-medium ${
                        task.status === "completed"
                          ? "text-neutral-muted line-through"
                          : "text-neutral-dark"
                      }`}
                    >
                      {task.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={isOverdue ? "error" : "default"}
                        size="sm"
                      >
                        {typeLabels[task.type] || task.type}
                      </Badge>
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          isOverdue ? "text-danger" : "text-neutral-muted"
                        }`}
                      >
                        <Clock size={10} />
                        {new Date(task.dueAt).toLocaleDateString("pt-BR")}
                      </div>
                      {task.lead ? (
                        <Link
                          href={`/leads/${task.lead.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {task.lead.name}
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTask(task.id)}
                    icon={<Trash2 size={16} />}
                    className="h-auto p-0 text-neutral-line hover:text-danger"
                  />
                </div>
              );
            })}
          </div>
        )}
      </SectionContainer>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nova Tarefa"
        size="md"
      >
        <Form onSubmit={handleCreate} className="space-y-4">
          <TextField
            label="Título"
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            required
          />
          <SelectField
            label="Tipo"
            options={typeOptions}
            value={form.type}
            onChange={(value) => setForm({ ...form, type: value })}
          />
          <DateField
            label="Data/hora"
            fieldType="datetime-local"
            value={form.dueAt}
            onChange={(event) =>
              setForm({ ...form, dueAt: event.target.value })
            }
            required
          />
          <TextareaField
            label="Descricao"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowCreate(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
              Criar
            </Button>
          </div>
        </Form>
      </Modal>
    </PageContainer>
  );
}
