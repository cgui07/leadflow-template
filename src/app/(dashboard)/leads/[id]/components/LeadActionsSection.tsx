"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionContainer } from "@/components/layout/SectionContainer";
import {
  TextField,
  SelectField,
  DateField,
  TextareaField,
} from "@/components/forms";
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Landmark,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  ACTION_TYPE_LABELS,
  ACTION_STATUS_LABELS,
  ACTION_STATUS_BADGE_VARIANT,
  LEAD_ACTION_TYPES,
  LEAD_ACTION_STATUSES,
  type LeadActionType,
  type LeadActionStatus,
} from "@/lib/lead-action-config";

interface LeadActionItem {
  id: string;
  type: string;
  status: string;
  title: string;
  notes?: string | null;
  origin: string;
  scheduledAt?: string | null;
  reminderAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadActionsSectionProps {
  leadId: string;
  actions: LeadActionItem[];
  onRefetch: () => void;
}

interface ActionCardProps {
  action: LeadActionItem;
  leadId: string;
  onRefetch: () => void;
  onEdit: (action: LeadActionItem) => void;
  onError: (message: string) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  visit: <Eye size={16} className="text-purple" />,
  proposal: <FileText size={16} className="text-blue" />,
  financing: <Landmark size={16} className="text-green-emerald" />,
};

const typeOptions = LEAD_ACTION_TYPES.map((t) => ({
  value: t,
  label: ACTION_TYPE_LABELS[t],
}));

const statusOptions = LEAD_ACTION_STATUSES.map((s) => ({
  value: s,
  label: ACTION_STATUS_LABELS[s],
}));

const emptyForm = {
  type: "visit",
  status: "pending",
  title: "",
  notes: "",
  scheduledAt: "",
  reminderAt: "",
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;

  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocal(dateStr: string | null | undefined) {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);

  return localDate.toISOString().slice(0, 16);
}

function isOverdue(action: LeadActionItem) {
  if (!action.scheduledAt) return false;

  const finishedStatuses = ["completed", "cancelled"];
  if (finishedStatuses.includes(action.status)) return false;

  return new Date(action.scheduledAt) < new Date();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

async function getResponseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) {
      return data.error;
    }
  } catch {
    // Ignore invalid JSON and keep the fallback message below.
  }

  return fallback;
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-blush bg-red-pale px-3 py-2 text-sm text-red-dark">
      {message}
    </div>
  );
}

function ActionCard({
  action,
  leadId,
  onRefetch,
  onEdit,
  onError,
}: ActionCardProps) {
  const [loading, setLoading] = useState(false);
  const overdue = isOverdue(action);
  const finished = ["completed", "cancelled"].includes(action.status);

  async function quickUpdate(data: Record<string, string>) {
    setLoading(true);

    try {
      const response = await fetch(`/api/leads/${leadId}/actions/${action.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Não foi possível atualizar a ação."),
        );
      }

      onError("");
      onRefetch();
    } catch (error) {
      onError(getErrorMessage(error, "Não foi possível atualizar a ação."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Excluir esta ação?")) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/leads/${leadId}/actions/${action.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Não foi possível excluir a ação."),
        );
      }

      onError("");
      onRefetch();
    } catch (error) {
      onError(getErrorMessage(error, "Não foi possível excluir a ação."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-lg border p-3 sm:p-4 ${
        overdue
          ? "border-red-blush bg-red-pale-50"
          : finished
            ? "border-neutral-line bg-neutral-surface-50"
            : "border-neutral-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {typeIcons[action.type] || (
            <CalendarCheck size={16} className="text-neutral-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-semibold ${
                finished
                  ? "text-neutral-muted line-through"
                  : "text-neutral-ink"
              }`}
            >
              {action.title}
            </span>

            <Badge
              variant={
                ACTION_STATUS_BADGE_VARIANT[
                  action.status as LeadActionStatus
                ] || "default"
              }
              size="sm"
            >
              {ACTION_STATUS_LABELS[action.status as LeadActionStatus] ||
                action.status}
            </Badge>

            {action.origin === "ai" && (
              <Badge variant="purple" size="sm">
                IA
              </Badge>
            )}

            {overdue && (
              <Badge variant="error" size="sm">
                Vencida
              </Badge>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-muted">
            <span>
              {ACTION_TYPE_LABELS[action.type as LeadActionType] || action.type}
            </span>

            {action.scheduledAt && (
              <span className="flex items-center gap-1">
                <CalendarCheck size={10} />
                {formatDate(action.scheduledAt)}
              </span>
            )}

            {action.reminderAt && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                Lembrete: {formatDate(action.reminderAt)}
              </span>
            )}
          </div>

          {action.notes && (
            <div className="mt-1.5 text-xs text-neutral-steel">
              {action.notes}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!finished && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<CheckCircle size={14} />}
                onClick={() => quickUpdate({ status: "completed" })}
                loading={loading}
                aria-label="Concluir"
                className="h-auto p-1"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={() => onEdit(action)}
                loading={loading}
                aria-label="Editar"
                className="h-auto p-1"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={14} />}
                onClick={() => quickUpdate({ status: "cancelled" })}
                loading={loading}
                aria-label="Cancelar"
                className="h-auto p-1 text-neutral-line hover:text-danger"
              />
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={handleDelete}
            loading={loading}
            aria-label="Excluir"
            className="h-auto p-1 text-neutral-line hover:text-danger"
          />
        </div>
      </div>
    </div>
  );
}

export function LeadActionsSection({
  leadId,
  actions,
  onRefetch,
}: LeadActionsSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const openActions = actions.filter((action) => {
    return !["completed", "cancelled"].includes(action.status);
  });
  const closedActions = actions.filter((action) => {
    return ["completed", "cancelled"].includes(action.status);
  });

  function closeModal() {
    setShowModal(false);
    setFormError("");
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setSectionError("");
    setShowModal(true);
  }

  function openEdit(action: LeadActionItem) {
    setEditingId(action.id);
    setForm({
      type: action.type,
      status: action.status,
      title: action.title,
      notes: action.notes || "",
      scheduledAt: toDatetimeLocal(action.scheduledAt),
      reminderAt: toDatetimeLocal(action.reminderAt),
    });
    setFormError("");
    setSectionError("");
    setShowModal(true);
  }

  function handleActionSuccess() {
    setSectionError("");
    onRefetch();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const response = editingId
        ? await fetch(`/api/leads/${leadId}/actions/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: form.status,
              title: form.title,
              notes: form.notes,
              scheduledAt: form.scheduledAt || null,
              reminderAt: form.reminderAt || null,
            }),
          })
        : await fetch(`/api/leads/${leadId}/actions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: form.type,
              status: form.status,
              title: form.title,
              notes: form.notes,
              scheduledAt: form.scheduledAt || null,
              reminderAt: form.reminderAt || null,
            }),
          });

      if (!response.ok) {
        throw new Error(
          await getResponseError(
            response,
            editingId
              ? "Não foi possível salvar a ação."
              : "Não foi possível criar a ação.",
          ),
        );
      }

      setSectionError("");
      closeModal();
      onRefetch();
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          editingId
            ? "Não foi possível salvar a ação."
            : "Não foi possível criar a ação.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionContainer
        title="Ações do Lead"
        description="Visitas, propostas e simulações"
        icon={<CalendarCheck className="h-4 w-4 text-primary" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={14} />}
            onClick={openCreate}
          >
            Nova ação
          </Button>
        }
      >
        <div className="space-y-3">
          {sectionError && <ErrorNotice message={sectionError} />}

          {actions.length === 0 ? (
            <EmptyState
              title="Nenhuma ação registrada"
              description="Ações de visita, proposta e simulação aparecem aqui quando detectadas pela IA ou criadas manualmente."
            />
          ) : (
            <div className="space-y-2">
              {openActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  leadId={leadId}
                  onRefetch={handleActionSuccess}
                  onEdit={openEdit}
                  onError={setSectionError}
                />
              ))}

              {closedActions.length > 0 && openActions.length > 0 && (
                <div className="mt-3 border-t border-neutral-line pt-2">
                  <div className="mb-2 text-xs text-neutral-muted">
                    Concluídas / Canceladas
                  </div>
                </div>
              )}

              {closedActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  leadId={leadId}
                  onRefetch={handleActionSuccess}
                  onEdit={openEdit}
                  onError={setSectionError}
                />
              ))}
            </div>
          )}
        </div>
      </SectionContainer>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingId ? "Editar ação" : "Nova ação"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingId && (
            <SelectField
              label="Tipo"
              options={typeOptions}
              value={form.type}
              onChange={(value) => setForm({ ...form, type: value })}
            />
          )}

          <SelectField
            label="Status"
            options={statusOptions}
            value={form.status}
            onChange={(value) => setForm({ ...form, status: value })}
          />

          <TextField
            label="Título"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <DateField
            label="Data prevista / agendada"
            fieldType="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />

          <DateField
            label="Lembrete"
            fieldType="datetime-local"
            value={form.reminderAt}
            onChange={(e) => setForm({ ...form, reminderAt: e.target.value })}
          />

          <TextareaField
            label="Observações"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />

          {formError && <ErrorNotice message={formError} />}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
