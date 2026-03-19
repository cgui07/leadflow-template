"use client";

import { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Form, TextField } from "@/components/forms";

interface AddStageModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string) => Promise<void>;
}

export function AddStageModal({ open, onClose, onSubmit }: AddStageModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      await onSubmit(name.trim(), color);
      setName("");
      setColor("blue");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar coluna.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova coluna" size="sm">
      <Form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-blush bg-red-pale px-3 py-2 text-sm text-red-dark">
            {error}
          </div>
        ) : null}

        <TextField
          label="Nome da coluna"
          placeholder="Ex: Qualificados, Negociando..."
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
            Criar
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
