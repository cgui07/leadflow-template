"use client";

import { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { Modal } from "@/components/ui/Modal";
import type { PipelineStage } from "../types";
import { Button } from "@/components/ui/Button";
import { Form, TextField } from "@/components/forms";

interface EditStageModalProps {
  open: boolean;
  stage: PipelineStage;
  onClose: () => void;
  onSubmit: (stageId: string, name: string, color: string) => Promise<void>;
}

export function EditStageModal({ open, stage, onClose, onSubmit }: EditStageModalProps) {
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState(stage.color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      await onSubmit(stage.id, name.trim(), color);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar coluna.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar coluna" size="sm">
      <Form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-blush bg-red-pale px-3 py-2 text-sm text-red-dark">
            {error}
          </div>
        ) : null}

        <TextField
          label="Nome da coluna"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <ColorPicker value={color} onChange={setColor} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim()}>
            Salvar
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
