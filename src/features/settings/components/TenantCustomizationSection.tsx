"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TenantBrandPreview } from "./TenantBrandPreview";
import type { TenantCustomizationSettings } from "../contracts";
import { Palette, Save } from "lucide-react";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { TextField } from "@/components/forms";
import { useTenantCustomizationForm } from "../hooks/useTenantCustomizationForm";
import {
  BRAND_COLOR_KEYS,
  BRAND_COLOR_LABELS,
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
  const { form, preview, saveError, saved, saving, updateField, save } =
    useTenantCustomizationForm(initialTenant);

  return (
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
          <TextField
            label="Nome da marca"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ex: Oliveira Prime"
          />

          <TextField
            label="Logo (URL)"
            value={form.logoUrl || ""}
            onChange={(event) =>
              updateField("logoUrl", event.target.value || null)
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

          {saveError && (
            <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
              {saveError}
            </div>
          )}
        </div>

        <TenantBrandPreview branding={preview} />
      </div>
    </SectionContainer>
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
