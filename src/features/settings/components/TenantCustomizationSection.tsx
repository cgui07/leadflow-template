"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { TenantBrandPreview } from "./TenantBrandPreview";
import type { TenantCustomizationSettings } from "../contracts";
import { Building2, Palette, Save, Settings2 } from "lucide-react";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { CheckboxField, TextField, TextareaField } from "@/components/forms";
import { useTenantCustomizationForm } from "../hooks/useTenantCustomizationForm";
import {
  BRAND_COLOR_KEYS,
  BRAND_COLOR_LABELS,
  TENANT_FEATURE_FLAGS,
  TENANT_TEXT_FIELDS,
  getBrandChipClass,
  getBrandSoftSurfaceClass,
  type BrandColorKey,
} from "@/lib/branding";

interface TenantCustomizationSectionProps {
  initialTenant: TenantCustomizationSettings;
}

export function TenantCustomizationSection({
  initialTenant,
}: TenantCustomizationSectionProps) {
  const {
    form,
    preview,
    saveError,
    saved,
    saving,
    updateCustomText,
    updateFeatureFlag,
    updateField,
    save,
  } = useTenantCustomizationForm(initialTenant);

  return (
    <div className="space-y-6">
      <SectionContainer
        title="Marca do cliente"
        description="Ajuste nome, logo e paleta visual do workspace deste cliente."
        icon={<Palette className="h-5 w-5 text-secondary" />}
        actions={
          <Button
            icon={<Save className="h-4 w-4" />}
            onClick={save}
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
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Ex: Oliveira Prime"
                />
                <TextField label="Slug do tenant" value={form.slug} disabled />
              </div>
              <div className="hidden md:grid md:grid-cols-2 md:gap-4">
                <div />
                <div className="text-sm text-neutral">
                  Slug interno usado para identificar este cliente.
                </div>
              </div>
              <div className="text-sm text-neutral md:hidden">
                Slug interno usado para identificar este cliente.
              </div>
            </div>

            <TextField
              label="Logo (URL)"
              value={form.logoUrl || ""}
              onChange={(event) =>
                updateField("logoUrl", event.target.value || null)
              }
              placeholder="https://..."
              description="Use uma URL publica da logo. Se ficar em branco, o sistema usa a inicial da marca."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ColorPicker
                label="Cor primaria"
                value={form.colorPrimary}
                onChange={(value) => updateField("colorPrimary", value)}
              />
              <ColorPicker
                label="Cor secundaria"
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
                  onChange={(event) => updateCustomText(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <TextField
                  key={field.key}
                  label={field.label}
                  description={field.description}
                  value={form.customTexts[field.key]}
                  onChange={(event) => updateCustomText(field.key, event.target.value)}
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
            <Button
              key={color}
              type="button"
              variant="unstyled"
              size="md"
              aria-pressed={selected}
              onClick={() => onChange(color)}
              className={cn(
                "h-auto flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors",
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
                  {BRAND_COLOR_LABELS[color]}
                </div>
              </div>
              <div
                className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${getBrandSoftSurfaceClass(color)}`}
              >
                Tema
              </div>
            </Button>
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
  icon: ReactNode;
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
