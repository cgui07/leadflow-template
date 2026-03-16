"use client";

import { Badge } from "@/components/ui/Badge";
import {
  TENANT_FEATURE_FLAGS,
  getBrandActiveNavClass,
  getBrandChipClass,
  getBrandHeroGradientClass,
  getBrandSoftSurfaceClass,
  type BrandColorKey,
  type TenantBranding,
} from "@/lib/branding";

const COLOR_LABELS: Record<BrandColorKey, string> = {
  blue: "Azul",
  purple: "Roxo",
  teal: "Teal",
  orange: "Laranja",
  pink: "Rosa",
  indigo: "Índigo",
};

interface TenantBrandPreviewProps {
  branding: TenantBranding;
}

export function TenantBrandPreview({ branding }: TenantBrandPreviewProps) {
  const dashboardTitle = branding.customTexts.dashboardTitle || "Dashboard";
  const dashboardSubtitle =
    branding.customTexts.dashboardSubtitle ||
    "Visão geral dos seus leads e atendimentos";
  const conversationsSubtitle =
    branding.customTexts.conversationsSubtitle ||
    "Gerencie suas conversas do WhatsApp";
  const settingsSubtitle =
    branding.customTexts.settingsSubtitle ||
    "Configure suas integrações e preferências";
  const enabledFeatures = TENANT_FEATURE_FLAGS.filter((feature) => {
    return branding.featureFlags[feature.key];
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-border bg-white shadow-card">
      <div
        className={`${getBrandHeroGradientClass(branding.colorPrimary)} p-5 text-white`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt={branding.name}
                className="h-12 w-12 rounded-2xl bg-white/90 object-contain p-2"
              />
            ) : (
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold`}
              >
                {branding.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/70">
                Preview da marca
              </div>
              <div className="text-xl font-semibold">{branding.name}</div>
            </div>
          </div>
          <div className="rounded-full whitespace-nowrap bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
            Tenant ativo
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <div
            className={`rounded-xl px-3 py-2 text-xs font-medium ${getBrandSoftSurfaceClass(branding.colorPrimary)}`}
          >
            Primária: {COLOR_LABELS[branding.colorPrimary]}
          </div>
          <div
            className={`rounded-xl px-3 py-2 text-xs font-medium ${getBrandSoftSurfaceClass(branding.colorSecondary)}`}
          >
            Secundária: {COLOR_LABELS[branding.colorSecondary]}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-border p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-muted">
            Navegação
          </div>
          <div className="space-y-2">
            <div
              className={`rounded-xl px-3 py-2 text-sm font-medium ${getBrandActiveNavClass(branding.colorPrimary)}`}
            >
              Dashboard
            </div>
            <div className="rounded-xl border border-neutral-border px-3 py-2 text-sm text-neutral-dark">
              Conversas
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-border p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-muted">
            Textos ativos
          </div>
          <div className="space-y-3">
            <PreviewCopy
              title={dashboardTitle}
              subtitle={dashboardSubtitle}
              badgeClass={getBrandChipClass(branding.colorPrimary)}
            />
            <PreviewCopy
              title="Conversas"
              subtitle={conversationsSubtitle}
              badgeClass={getBrandChipClass(branding.colorSecondary)}
            />
            <PreviewCopy
              title="Configurações"
              subtitle={settingsSubtitle}
              badgeClass={getBrandChipClass(branding.colorPrimary)}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-muted">
            Recursos liberados
          </div>
          <div className="flex flex-wrap gap-2">
            {enabledFeatures.map((feature) => (
              <Badge key={feature.key} variant="default" size="sm">
                {feature.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCopy({
  title,
  subtitle,
  badgeClass,
}: {
  title: string;
  subtitle: string;
  badgeClass: string;
}) {
  return (
    <div className="rounded-xl bg-neutral-surface p-3">
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${badgeClass}`} />
        <div className="text-sm font-semibold text-neutral-ink">{title}</div>
      </div>
      <div className="mt-1 text-xs leading-5 text-neutral">
        {subtitle}
      </div>
    </div>
  );
}
