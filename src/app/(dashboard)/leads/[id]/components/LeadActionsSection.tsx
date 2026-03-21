"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SectionContainer } from "@/components/layout/SectionContainer";
import {
  Form,
  TextField,
  SelectField,
  DateField,
  TextareaField,
} from "@/components/forms";
import { CalendarCheck, Plus } from "lucide-react";
import {
  ACTION_TYPE_LABELS,
  ACTION_STATUS_LABELS,
  LEAD_ACTION_TYPES,
  LEAD_ACTION_STATUSES,
} from "@/lib/lead-action-config";
import { ActionCard } from "./ActionCard";
import { toDatetimeLocal, getErrorMessage, getResponseError } from "./action-utils";

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
        <Form onSubmit={handleSubmit} className="space-y-4">
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
        </Form>
      </Modal>
    </>
  );
}
