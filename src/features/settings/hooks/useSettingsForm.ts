"use client";

import type { UserSettings } from "../contracts";
import { useEffect, useMemo, useState } from "react";
import { normalizeSettingsProvider } from "../utils";
import {
  DEFAULT_AI_MODEL_BY_PROVIDER,
  getAIModelOptions,
  isSupportedAIModel,
  type AIProvider,
} from "@/lib/ai-models";

interface UseSettingsFormResult {
  form: UserSettings;
  modelHelpText: string;
  modelOptions: ReturnType<typeof getAIModelOptions>;
  saveError: string | null;
  saved: boolean;
  saving: boolean;
  selectedProvider: AIProvider;
  update: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
  save: () => Promise<void>;
}

function isUserSettings(value: unknown): value is UserSettings {
  return (
    !!value &&
    typeof value === "object" &&
    "aiProvider" in value &&
    "aiModel" in value &&
    "autoReplyEnabled" in value &&
    "followUpEnabled" in value
  );
}

export function useSettingsForm(
  initialSettings: UserSettings,
): UseSettingsFormResult {
  const [form, setForm] = useState<UserSettings>(initialSettings);
  const [serverSnapshot, setServerSnapshot] =
    useState<UserSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedProvider = normalizeSettingsProvider(form.aiProvider);

  useEffect(() => {
    setForm(initialSettings);
    setServerSnapshot(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    const provider = normalizeSettingsProvider(form.aiProvider);

    if (form.aiProvider !== provider) {
      setForm((current) => ({ ...current, aiProvider: provider }));
      return;
    }

    if (!isSupportedAIModel(provider, form.aiModel)) {
      setForm((current) => ({
        ...current,
        aiModel: DEFAULT_AI_MODEL_BY_PROVIDER[provider],
      }));
    }
  }, [form.aiModel, form.aiProvider]);

  const modelOptions = useMemo(() => {
    return getAIModelOptions(selectedProvider);
  }, [selectedProvider]);

  const modelHelpText =
    selectedProvider === "openai"
      ? "Mostrando os modelos OpenAI suportados por esta integração."
      : "Mostrando os modelos Anthropic suportados por esta integração.";

  function update<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setSaveError(null);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);

    try {
      const payload: Partial<UserSettings> = {
        ...form,
        aiApiKey:
          form.aiApiKey === serverSnapshot.aiApiKey
            ? undefined
            : form.aiApiKey?.trim()
              ? form.aiApiKey
              : null,
        openaiTranscriptionKey:
          form.openaiTranscriptionKey === serverSnapshot.openaiTranscriptionKey
            ? undefined
            : form.openaiTranscriptionKey?.trim()
              ? form.openaiTranscriptionKey
              : null,
        facebookPageAccessToken:
          form.facebookPageAccessToken ===
          serverSnapshot.facebookPageAccessToken
            ? undefined
            : form.facebookPageAccessToken?.trim()
              ? form.facebookPageAccessToken
              : null,
        elevenlabsVoiceId:
          form.elevenlabsVoiceId === serverSnapshot.elevenlabsVoiceId
            ? undefined
            : form.elevenlabsVoiceId?.trim()
              ? form.elevenlabsVoiceId.trim()
              : null,
      };

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as
        | UserSettings
        | { error?: string }
        | null;

      if (!response.ok) {
        setSaveError(
          result && "error" in result && result.error
            ? result.error
            : "Não foi possível salvar suas configurações.",
        );
        return;
      }

      if (!isUserSettings(result)) {
        setSaveError("Não foi possível salvar suas configurações.");
        return;
      }

      setForm(result);
      setServerSnapshot(result);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    modelHelpText,
    modelOptions,
    saveError,
    saved,
    saving,
    selectedProvider,
    update,
    save,
  };
}
