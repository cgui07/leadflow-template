"use client";

import { TextField } from "@/components/forms";
import type { UserSettings } from "../contracts";

interface AutomaticFollowUpFormProps {
  form: UserSettings;
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

function parseInteger(value: string, fallback: number): number {
  const next = Number.parseInt(value, 10);
  return Number.isFinite(next) ? next : fallback;
}

export function AutomaticFollowUpForm({ form, update }: AutomaticFollowUpFormProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <TextField
        label="Intervalo entre follow-ups"
        type="number"
        value={String(form.followUpDelayHours)}
        onChange={(event) =>
          update("followUpDelayHours", parseInteger(event.target.value, form.followUpDelayHours))
        }
        min={1}
        max={168}
        description="Em horas (ex: 24 = 1 dia)"
      />
      <TextField
        label="Máximo de follow-ups"
        type="number"
        value={String(form.maxFollowUps)}
        onChange={(event) =>
          update("maxFollowUps", parseInteger(event.target.value, form.maxFollowUps))
        }
        min={1}
        max={10}
        description="Por lead"
      />
    </div>
  );
}
