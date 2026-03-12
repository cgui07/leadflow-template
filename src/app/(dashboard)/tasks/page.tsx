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
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm font-medium text-red-700">
            {overdue.length} tarefa(s) atrasada(s)
          </p>
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
                <div key={task.id} className={`flex items-center gap-3 rounded-lg border p-3 ${isOverdue ? "border-red-200 bg-red-50" : "border-slate-100"}`}>
                  {task.status === "pending" && (
                    <button onClick={() => completeTask(task.id)} className="text-slate-400 hover:text-green-500 transition">
                      <CheckCircle size={20} />
                    </button>
                  )}
                  {task.status === "completed" && (
                    <CheckCircle size={20} className="text-green-500" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isOverdue ? "error" : "default"} size="sm">
                        {typeLabels[task.type] || task.type}
                      </Badge>
                      <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                        <Clock size={10} />
                        {new Date(task.dueAt).toLocaleDateString("pt-BR")}
                      </span>
                      {task.lead && (
                        <Link href={`/leads/${task.lead.id}`} className="text-xs text-blue-500 hover:underline">
                          {task.lead.name}
                        </Link>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionContainer>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova Tarefa" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="follow_up">Follow-up</option>
              <option value="call">Ligação</option>
              <option value="visit">Visita</option>
              <option value="proposal">Proposta</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Data/hora *</label>
            <input
              type="datetime-local"
              value={form.dueAt}
              onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" loading={creating}>Criar</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
