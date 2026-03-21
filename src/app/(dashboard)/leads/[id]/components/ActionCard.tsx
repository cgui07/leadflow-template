"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { isOverdue, formatDate, getErrorMessage, getResponseError } from "./action-utils";
import { CalendarCheck, CheckCircle, Clock, Eye, FileText, Landmark, RotateCcw, Trash2, X } from "lucide-react";
import {
  ACTION_TYPE_LABELS,
  ACTION_STATUS_LABELS,
  ACTION_STATUS_BADGE_VARIANT,
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

export function ActionCard({ action, leadId, onRefetch, onEdit, onError }: ActionCardProps) {
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
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

  async function handleDeleteConfirm() {
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
      setDeleteModalOpen(false);
    } catch (error) {
      onError(getErrorMessage(error, "Não foi possível excluir a ação."));
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
            onClick={() => setDeleteModalOpen(true)}
            loading={loading}
            aria-label="Excluir"
            className="h-auto p-1 text-neutral-line hover:text-danger"
          />
        </div>
      </div>

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir ação"
        description={`Tem certeza que deseja excluir a ação "${action.title || ACTION_TYPE_LABELS[action.type as LeadActionType] || "sem título"}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        loading={loading}
      />
    </div>
  );
}
