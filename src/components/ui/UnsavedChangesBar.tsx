"use client";

import { Button } from "./Button";

interface UnsavedChangesBarProps {
  visible: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesBar({
  visible,
  saving,
  onSave,
  onDiscard,
}: UnsavedChangesBarProps) {
  return (
    <div
      className={[
        "fixed bottom-6 left-0 right-0 z-50 flex justify-center transition-all duration-300 ease-in-out",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      ].join(" ")}
    >
      <div className="flex items-center gap-4 rounded-xl border-2 border-red-blush bg-surface px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-sm font-medium text-neutral">Alterações não salvas</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
            Descartar
          </Button>
          <Button size="sm" onClick={onSave} loading={saving}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
