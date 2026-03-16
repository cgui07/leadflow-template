"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildBranding, type TenantBranding } from "@/lib/branding";
import type {
  TenantCustomizationResponse,
  TenantCustomizationSettings,
} from "../contracts";

interface UseTenantCustomizationFormResult {
  form: TenantCustomizationSettings;
  preview: TenantBranding;
  saveError: string | null;
  saved: boolean;
  saving: boolean;
  updateCustomText: (key: keyof TenantBranding["customTexts"], value: string) => void;
  updateFeatureFlag: (
    key: keyof TenantBranding["featureFlags"],
    value: boolean,
  ) => void;
  updateField: <K extends keyof TenantCustomizationSettings>(
    key: K,
    value: TenantCustomizationSettings[K],
  ) => void;
  save: () => Promise<void>;
}

export function useTenantCustomizationForm(
  initialTenant: TenantCustomizationSettings,
): UseTenantCustomizationFormResult {
  const router = useRouter();
  const [form, setForm] = useState<TenantCustomizationSettings>(initialTenant);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialTenant);
  }, [initialTenant]);

  const preview = useMemo(() => {
    return buildBranding(form);
  }, [form]);

  function updateField<K extends keyof TenantCustomizationSettings>(
    key: K,
    value: TenantCustomizationSettings[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setSaveError(null);
  }

  function updateCustomText(key: keyof TenantBranding["customTexts"], value: string) {
    setForm((current) => ({
      ...current,
      customTexts: {
        ...current.customTexts,
        [key]: value,
      },
    }));
    setSaved(false);
    setSaveError(null);
  }

  function updateFeatureFlag(
    key: keyof TenantBranding["featureFlags"],
    value: boolean,
  ) {
    setForm((current) => ({
      ...current,
      featureFlags: {
        ...current.featureFlags,
        [key]: value,
      },
    }));
    setSaved(false);
    setSaveError(null);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/admin/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          logoUrl: form.logoUrl,
          colorPrimary: form.colorPrimary,
          colorSecondary: form.colorSecondary,
          customTexts: form.customTexts,
          featureFlags: form.featureFlags,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | TenantCustomizationResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        setSaveError(
          payload && "error" in payload && payload.error
            ? payload.error
            : "Não foi possível salvar a personalização.",
        );
        return;
      }

      if (!payload || !("tenant" in payload)) {
        setSaveError("Não foi possível salvar a personalização.");
        return;
      }

      setForm(payload.tenant);
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    preview,
    saveError,
    saved,
    saving,
    updateCustomText,
    updateFeatureFlag,
    updateField,
    save,
  };
}
