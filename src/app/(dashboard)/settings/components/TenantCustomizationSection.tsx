"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useEffect, useMemo, useState } from "react";
import { TenantBrandPreview } from "./TenantBrandPreview";
import { useFetch, AUTH_REFRESH_EVENT } from "@/lib/hooks";
import { LoadingState } from "@/components/ui/LoadingState";
import { SectionContainer } from "@/components/layout/SectionContainer";
import {
  Building2,
  Palette,
  Save,
  Settings2,
} from "lucide-react";
import {
  CheckboxField,
  TextField,
  TextareaField,
} from "@/components/forms";
import {
  BRAND_COLOR_KEYS,
  TENANT_FEATURE_FLAGS,
  TENANT_TEXT_FIELDS,
  buildBranding,
  getBrandChipClass,
  getBrandSoftSurfaceClass,
  type BrandColorKey,
  type TenantBranding,
} from "@/lib/branding";

type TenantSettings = {
  id: string;
  slug: string;
  status: string;
} & TenantBranding;

type TenantSettingsResponse = {
  tenant: TenantSettings;
};

const COLOR_LABELS: Record<BrandColorKey, string> = {
  blue: "Azul",
  purple: "Roxo",
  teal: "Teal",
  orange: "Laranja",
  pink: "Rosa",
  indigo: "Índigo",
};

export function TenantCustomizationSection() {
  const { data, loading, error, refetch } = useFetch<TenantSettingsResponse>(
    "/api/admin/tenant",
  );
  const [form, setForm] = useState<TenantSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.tenant) return;
    setForm(data.tenant);
  }, [data]);

  const preview = useMemo(() => {
    return buildBranding(form);
  }, [form]);

  function updateField<K extends keyof TenantSettings>(
    key: K,
    value: TenantSettings[K],
  ) {
    setForm((current) => {
      if (!current) return current;
      return { ...current, [key]: value };
    });
    setSaved(false);
    setSaveError(null);
  }

  function updateCustomText(key: keyof TenantBranding["customTexts"], value: string) {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        customTexts: {
          ...current.customTexts,
          [key]: value,
        },
      };
    });
    setSaved(false);
    setSaveError(null);
  }

  function updateFeatureFlag(
    key: keyof TenantBranding["featureFlags"],
    value: boolean,
  ) {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        featureFlags: {
          ...current.featureFlags,
          [key]: value,
        },
      };
    });
    setSaved(false);
    setSaveError(null);
  }

  async function handleSave() {
    if (!form) return;

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
      const payload = (await response.json()) as
        | TenantSettingsResponse
        | { error?: string };

      if (!response.ok) {
        const errorMessage =
          "error" in payload
            ? payload.error
            : "Não foi possível salvar a personalização.";
        setSaveError(errorMessage || "Não foi possível salvar a personalização.");
        return;
      }

      if (!("tenant" in payload)) {
        setSaveError("Não foi possível salvar a personalização.");
        return;
      }

      setForm(payload.tenant);
      setSaved(true);
      refetch();
      window.dispatchEvent(new Event(AUTH_REFRESH_EVENT));
    } catch {
      setSaveError("Não foi possível salvar a personalização.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !form) {
    return <LoadingState variant="skeleton" />;
  }

  if (!form) {
    return (
      <SectionContainer
        title="Marca do cliente"
        description="Personalize identidade, textos e recursos deste tenant."
        icon={<Palette className="h-5 w-5 text-secondary" />}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
            {error || "Não foi possível carregar a configuração deste tenant."}
          </div>
          <Button variant="outline" onClick={refetch}>
            Tentar novamente
          </Button>
        </div>
      </SectionContainer>
    );
  }

  return (
    <div className="space-y-6">
      <SectionContainer
        title="Marca do cliente"
        description="Ajuste nome, logo e paleta visual do workspace deste cliente."
        icon={<Palette className="h-5 w-5 text-secondary" />}
        actions={
          <Button
            icon={<Save className="h-4 w-4" />}
            onClick={handleSave}
            loading={saving}
          >
            {saved ? "Personalização salva" : "Salvar"}
          </Button>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Nome da marca"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Ex: Oliveira Prime"
                />
                <TextField
                  label="Slug do tenant"
                  value={form.slug}
                  disabled
                />
              </div>
              <div className="hidden md:grid md:grid-cols-2 md:gap-4">
                <div />
                <p className="text-sm text-neutral">
                  Slug interno usado para identificar este cliente.
                </p>
              </div>
              <p className="text-sm text-neutral md:hidden">
                Slug interno usado para identificar este cliente.
              </p>
            </div>

            <TextField
              label="Logo (URL)"
              value={form.logoUrl || ""}
              onChange={(e) =>
                updateField("logoUrl", e.target.value || null)
              }
              placeholder="https://..."
              description="Use uma URL pública da logo. Se ficar em branco, o sistema usa a inicial da marca."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ColorPicker
                label="Cor primária"
                value={form.colorPrimary}
                onChange={(value) => updateField("colorPrimary", value)}
              />
              <ColorPicker
                label="Cor secundária"
                value={form.colorSecondary}
                onChange={(value) => updateField("colorSecondary", value)}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <InfoCard
                icon={<Building2 className="h-4 w-4 text-neutral-muted" />}
                label="Status do tenant"
                value={form.status === "active" ? "Ativo" : "Inativo"}
              />
              <InfoCard
                icon={<Settings2 className="h-4 w-4 text-neutral-muted" />}
                label="Aplicação imediata"
                value="Sidebar, títulos e módulos opcionais"
              />
            </div>

            {saveError && (
              <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
                {saveError}
              </div>
            )}
          </div>

          <TenantBrandPreview branding={preview} />
        </div>
      </SectionContainer>

      <SectionContainer
        title="Experiência por cliente"
        description="Controle textos operacionais e recursos ligados para este tenant."
        icon={<Settings2 className="h-5 w-5 text-accent" />}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-4">
            {TENANT_TEXT_FIELDS.map((field) =>
              field.multiline ? (
                <TextareaField
                  key={field.key}
                  label={field.label}
                  description={field.description}
                  value={form.customTexts[field.key]}
                  onChange={(e) => updateCustomText(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <TextField
                  key={field.key}
                  label={field.label}
                  description={field.description}
                  value={form.customTexts[field.key]}
                  onChange={(e) => updateCustomText(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              ),
            )}
          </div>

          <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-4">
            <div className="mb-4">
              <div className="text-sm font-semibold text-neutral-ink">
                Recursos do tenant
              </div>
              <div className="mt-1 text-sm text-neutral">
                Você pode ligar ou desligar módulos sem alterar o resto da base.
              </div>
            </div>

            <div className="space-y-4">
              {TENANT_FEATURE_FLAGS.map((feature) => (
                <div
                  key={feature.key}
                  className="rounded-xl border border-neutral-border bg-white p-3"
                >
                  <CheckboxField
                    variant="switch"
                    label={feature.label}
                    description={feature.description}
                    checked={form.featureFlags[feature.key]}
                    onChange={(checked) => updateFeatureFlag(feature.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BrandColorKey;
  onChange: (value: BrandColorKey) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-neutral-dark">{label}</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BRAND_COLOR_KEYS.map((color) => {
          const selected = color === value;

          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left transition-colors",
                selected
                  ? "border-neutral-ink bg-neutral-surface"
                  : "border-neutral-border bg-white hover:bg-neutral-surface",
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${getBrandChipClass(color)}`}
                />
                <div className="text-sm font-medium text-neutral-ink">
                  {COLOR_LABELS[color]}
                </div>
              </div>
              <div
                className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${getBrandSoftSurfaceClass(color)}`}
              >
                Tema
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-border bg-neutral-surface p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-muted">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-neutral-ink">{value}</div>
    </div>
  );
}
