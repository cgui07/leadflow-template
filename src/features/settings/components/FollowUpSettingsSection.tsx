"use client";

import { Bell } from "lucide-react";
import type { UserSettings } from "../contracts";
import { CustomFollowUpForm } from "./CustomFollowUpForm";
import { AutomaticFollowUpForm } from "./AutomaticFollowUpForm";
import { SectionContainer } from "@/components/layout/SectionContainer";
import {
  CheckboxField,
  RadioGroupField,
  type RadioOption,
} from "@/components/forms";

type FollowUpMode = "automatic" | "custom";

const FOLLOW_UP_MODE_OPTIONS: RadioOption<FollowUpMode>[] = [
  {
    value: "automatic",
    label: "Follow-up automático",
    description:
      "A IA envia mensagens em intervalos regulares usando templates padrão.",
  },
  {
    value: "custom",
    label: "Follow-up personalizado",
    description:
      "Escreva um roteiro livre e a IA seguirá exatamente o que você descrever.",
  },
];

interface FollowUpSettingsSectionProps {
  form: UserSettings;
  update: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
}

export function FollowUpSettingsSection({
  form,
  update,
}: FollowUpSettingsSectionProps) {
  const mode: FollowUpMode =
    form.followUpCustomInstructions !== null ? "custom" : "automatic";

  function handleModeChange(newMode: FollowUpMode) {
    if (newMode === "automatic") {
      update("followUpCustomInstructions", null);
    } else {
      update(
        "followUpCustomInstructions",
        form.followUpCustomInstructions ?? "",
      );
    }
  }

  return (
    <SectionContainer
      title="Follow-up automático"
      icon={<Bell className="h-5 w-5 text-accent" />}
      actions={
        <CheckboxField
          variant="switch"
          checked={form.followUpEnabled}
          onChange={(checked) => update("followUpEnabled", checked)}
        />
      }
    >
      {form.followUpEnabled && (
        <div className="space-y-4">
          <RadioGroupField<FollowUpMode>
            options={FOLLOW_UP_MODE_OPTIONS}
            value={mode}
            onChange={handleModeChange}
            layout="horizontal"
          />

          {mode === "automatic" ? (
            <AutomaticFollowUpForm form={form} update={update} />
          ) : (
            <CustomFollowUpForm form={form} update={update} />
          )}
        </div>
      )}
    </SectionContainer>
  );
}
