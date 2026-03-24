"use client";

import type { UserSettings } from "../contracts";
import { TextareaField } from "@/components/forms";

interface CustomFollowUpFormProps {
  form: UserSettings;
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export function CustomFollowUpForm({ form, update }: CustomFollowUpFormProps) {
  return (
    <div className="space-y-2">
      <TextareaField
        label="Roteiro de follow-up"
        value={form.followUpCustomInstructions ?? ""}
        onChange={(event) =>
          update("followUpCustomInstructions", event.target.value || null)
        }
        rows={5}
        placeholder={`Exemplos do que você pode escrever:\n\n"Faça no máximo 3 follow-ups. No primeiro, mencione o apartamento que o cliente viu e pergunte se ele ainda tem interesse. No segundo, ofereça agendar uma visita no fim de semana. No terceiro, informe que o imóvel está com alta procura."`}
      />
      <div className="text-xs text-neutral">
        A IA mantém o tom natural de WhatsApp e nunca se revela como robô — só
        o conteúdo muda.
      </div>
    </div>
  );
}
