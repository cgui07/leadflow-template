import { Badge, BrandLogo } from "@/components/ui";
import {
  BRAND_COLOR_LABELS,
  TENANT_FEATURE_FLAGS,
  getBrandActiveNavClass,
  getBrandHeroGradientClass,
  getBrandSoftSurfaceClass,
  type TenantBranding,
} from "@/lib/branding";

interface TenantBrandPreviewProps {
  branding: TenantBranding;
}

export function TenantBrandPreview({ branding }: TenantBrandPreviewProps) {
  const enabledFeatures = TENANT_FEATURE_FLAGS.filter(
    (feature) => branding.featureFlags[feature.key],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-border bg-white shadow-card">
      <div
        className={`${getBrandHeroGradientClass(branding.colorPrimary)} p-5 text-white`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <BrandLogo
                src={branding.logoUrl}
                alt={`${branding.name} logo`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-2xl bg-white-90 object-contain p-2"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white-20 text-lg font-bold">
                {branding.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white-70">
                Preview da marca
              </div>
              <div className="text-xl font-semibold">{branding.name}</div>
            </div>
          </div>
          <div className="whitespace-nowrap rounded-full bg-white-15 px-3 py-1 text-xs font-medium text-white-90">
            Tenant ativo
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <div
            className={`rounded-xl px-3 py-2 text-xs font-medium ${getBrandSoftSurfaceClass(branding.colorPrimary)}`}
          >
            Primária: {BRAND_COLOR_LABELS[branding.colorPrimary]}
          </div>
          <div
            className={`rounded-xl px-3 py-2 text-xs font-medium ${getBrandSoftSurfaceClass(branding.colorSecondary)}`}
          >
            Secundária: {BRAND_COLOR_LABELS[branding.colorSecondary]}
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
