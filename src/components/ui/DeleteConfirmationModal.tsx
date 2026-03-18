"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { Trash2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
}

export function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = "Remover item",
  description,
  confirmText = "Remover",
  cancelText = "Cancelar",
  loading = false,
  danger = true,
}: DeleteConfirmationModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            icon={<Trash2 className="h-4 w-4" />}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div />
    </Modal>
  );
}
