"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextField, SelectField, DateField, TextareaField } from "@/components/forms";
import { useFetch } from "@/lib/hooks";
import { Plus, CheckCircle, Clock, Trash2 } from "lucide-react";
import Link from "next/link";

interface TaskItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: string;
  dueAt: string;
  completedAt?: string;
  lead?: { id: string; name: string; phone: string };
}

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

export default function TasksPage() {
  const [tab, setTab] = useState("pending");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", type: "follow_up", dueAt: "", description: "" });

  const { data: tasks, loading, refetch } = useFetch<TaskItem[]>(`/api/tasks?status=${tab}`);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ title: "", type: "follow_up", dueAt: "", description: "" });
      refetch();
    } finally {
      setCreating(false);
    }
  }

  async function completeTask(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    refetch();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    refetch();
  }

  if (loading) return <LoadingState variant="skeleton" />;

  const overdue = (tasks || []).filter(
    (t) => t.status === "pending" && new Date(t.dueAt) < new Date()
  );

  return (
    <PageContainer
      title="Tarefas"
      subtitle="Gerencie seus follow-ups e tarefas"
      actions={
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          Nova Tarefa
        </Button>
      }
    >
      {overdue.length > 0 && tab === "pending" && (
        <div className="rounded-lg bg-red-pale border border-red-blush p-3">
          <div className="text-sm font-medium text-danger">
            {overdue.length} tarefa(s) atrasada(s)
          </div>
        </div>
      )}
      <Tabs
        tabs={[
          { id: "pending", label: "Pendentes" },
          { id: "completed", label: "Concluídas" },
          { id: "all", label: "Todas" },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />
      <SectionContainer>
        {!tasks?.length ? (
          <EmptyState
            title="Nenhuma tarefa"
            description={tab === "pending" ? "Todas as tarefas estão em dia!" : "Nenhuma tarefa encontrada."}
          />
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isOverdue = task.status === "pending" && new Date(task.dueAt) < new Date();
              return (
                <div key={task.id} className={`flex items-center gap-3 rounded-lg border p-3 ${isOverdue ? "border-red-blush bg-red-pale" : "border-neutral-border"}`}>
                  {task.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => completeTask(task.id)}
                      icon={<CheckCircle size={20} />}
                      className="h-auto p-0"
                    />
                  )}
                  {task.status === "completed" && (
                    <CheckCircle size={20} className="text-success" />
                  )}
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${task.status === "completed" ? "text-neutral-muted line-through" : "text-neutral-dark"}`}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isOverdue ? "error" : "default"} size="sm">
                        {typeLabels[task.type] || task.type}
                      </Badge>
                      <div className={`text-xs flex items-center gap-1 ${isOverdue ? "text-danger" : "text-neutral-muted"}`}>
                        <Clock size={10} />
                        {new Date(task.dueAt).toLocaleDateString("pt-BR")}
                      </div>
                      {task.lead && (
                        <Link href={`/leads/${task.lead.id}`} className="text-xs text-primary hover:underline">
                          {task.lead.name}
                        </Link>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                    icon={<Trash2 size={16} />}
                    className="h-auto p-0 text-neutral-line hover:text-danger"
                  />
                </div>
              );
            })}
          </div>
        )}
      </SectionContainer>
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova Tarefa" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <TextField
            label="Título"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
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
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            required
          />
          <TextareaField
            label="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" loading={creating}>Criar</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
