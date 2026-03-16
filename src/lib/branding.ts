import { appColors } from "../../tailwind.config";

export const DEFAULT_BRAND_NAME = "LeadFlow";
export const DEFAULT_BRAND_LOGO_URL = "/lead-logo.png";

export const BRAND_COLOR_KEYS = [
  "blue",
  "purple",
  "teal",
  "orange",
  "pink",
  "indigo",
] as const;

export type BrandColorKey = (typeof BRAND_COLOR_KEYS)[number];
export const BRAND_COLOR_LABELS: Record<BrandColorKey, string> = {
  blue: "Azul",
  purple: "Roxo",
  teal: "Teal",
  orange: "Laranja",
  pink: "Rosa",
  indigo: "Indigo",
};
export const TENANT_TEXT_FIELDS = [
  {
    key: "dashboardTitle",
    label: "Título do dashboard",
    description: "Aparece no topo da página inicial do cliente.",
    placeholder: "Dashboard",
    multiline: false,
  },
  {
    key: "dashboardSubtitle",
    label: "Subtítulo do dashboard",
    description: "Texto de apoio logo abaixo do título do dashboard.",
    placeholder: "Visão geral dos seus leads e atendimentos",
    multiline: true,
  },
  {
    key: "conversationsSubtitle",
    label: "Subtítulo de conversas",
    description: "Ajuda a ajustar o tom operacional da caixa de entrada.",
    placeholder: "Gerencie suas conversas do WhatsApp",
    multiline: true,
  },
  {
    key: "settingsSubtitle",
    label: "Subtítulo de configurações",
    description: "Texto de apoio na tela de configurações.",
    placeholder: "Configure suas integrações e preferências",
    multiline: true,
  },
] as const;
export const TENANT_FEATURE_FLAGS = [
  {
    key: "attentionQueue",
    label: "Fila operacional no dashboard",
    description: "Mostra a seção Quem preciso responder agora no dashboard.",
  },
  {
    key: "conversationSummary",
    label: "Resumo sob demanda nas conversas",
    description: "Exibe o botão Gerar resumo e o painel de handoff nas conversas.",
  },
  {
    key: "leadActions",
    label: "Ações estruturadas do lead",
    description: "Mantém a aba com visitas, propostas e simulações no detalhe do lead.",
  },
] as const;
export type TenantTextKey = (typeof TENANT_TEXT_FIELDS)[number]["key"];
export type TenantFeatureFlagKey = (typeof TENANT_FEATURE_FLAGS)[number]["key"];

export type TenantBranding = {
  name: string;
  logoUrl: string | null;
  colorPrimary: BrandColorKey;
  colorSecondary: BrandColorKey;
  customTexts: Record<TenantTextKey, string>;
  featureFlags: Record<TenantFeatureFlagKey, boolean>;
};

type BrandingInput = {
  name?: unknown;
  logoUrl?: unknown;
  colorPrimary?: string | null;
  colorSecondary?: string | null;
  customTexts?: unknown;
  featureFlags?: unknown;
};

const BRAND_PRIMARY_VALUES: Record<BrandColorKey, string> = {
  blue: appColors.primary,
  purple: appColors.purple.DEFAULT,
  teal: appColors.teal.DEFAULT,
  orange: appColors.orange.DEFAULT,
  pink: appColors.pink.DEFAULT,
  indigo: appColors.indigo.DEFAULT,
};

const BRAND_CHIP_CLASSES: Record<BrandColorKey, string> = {
  blue: "bg-primary",
  purple: "bg-purple",
  teal: "bg-teal",
  orange: "bg-orange",
  pink: "bg-pink",
  indigo: "bg-indigo",
};

const BRAND_HERO_GRADIENT_CLASSES: Record<BrandColorKey, string> = {
  blue: "bg-linear-to-br from-blue-navy via-primary to-secondary",
  purple: "bg-linear-to-br from-purple-plum via-purple-violet to-blue-navy",
  teal: "bg-linear-to-br from-teal-deep via-teal-dark to-blue-navy",
  orange: "bg-linear-to-br from-orange-burn via-orange-dark to-yellow-gold",
  pink: "bg-linear-to-br from-pink-magenta via-pink-hot to-purple-violet",
  indigo: "bg-linear-to-br from-blue-midnight via-indigo-deep to-purple-grape",
};
const BRAND_SOFT_SURFACE_CLASSES: Record<BrandColorKey, string> = {
  blue: "bg-blue-pale text-blue-royal",
  purple: "bg-purple-pale text-purple-violet",
  teal: "bg-teal-pale text-teal-dark",
  orange: "bg-orange-pale text-orange-dark",
  pink: "bg-pink-pale text-pink-hot",
  indigo: "bg-indigo-pale text-indigo-deep",
};
const BRAND_ACTIVE_NAV_CLASSES: Record<BrandColorKey, string> = {
  blue: "bg-blue-royal text-white",
  purple: "bg-purple-violet text-white",
  teal: "bg-teal-dark text-white",
  orange: "bg-orange-dark text-white",
  pink: "bg-pink-hot text-white",
  indigo: "bg-indigo-deep text-white",
};
const BRAND_TEXT_CLASSES: Record<BrandColorKey, string> = {
  blue: "text-blue-royal",
  purple: "text-purple-violet",
  teal: "text-teal-dark",
  orange: "text-orange-dark",
  pink: "text-pink-hot",
  indigo: "text-indigo-deep",
};
export const DEFAULT_FEATURE_FLAGS: Record<TenantFeatureFlagKey, boolean> = {
  attentionQueue: true,
  conversationSummary: true,
  leadActions: true,
};
export const DEFAULT_CUSTOM_TEXTS: Record<TenantTextKey, string> = {
  dashboardTitle: "",
  dashboardSubtitle: "",
  conversationsSubtitle: "",
  settingsSubtitle: "",
};

export const DEFAULT_BRANDING: TenantBranding = {
  name: DEFAULT_BRAND_NAME,
  logoUrl: DEFAULT_BRAND_LOGO_URL,
  colorPrimary: "blue",
  colorSecondary: "purple",
  customTexts: { ...DEFAULT_CUSTOM_TEXTS },
  featureFlags: { ...DEFAULT_FEATURE_FLAGS },
};

export function createDefaultBranding(): TenantBranding {
  return {
    ...DEFAULT_BRANDING,
    customTexts: { ...DEFAULT_CUSTOM_TEXTS },
    featureFlags: { ...DEFAULT_FEATURE_FLAGS },
  };
}

export function isBrandColorKey(value: string): value is BrandColorKey {
  return BRAND_COLOR_KEYS.includes(value as BrandColorKey);
}

export function normalizeBrandColor(
  value: string | null | undefined,
  fallback: BrandColorKey,
): BrandColorKey {
  return value && isBrandColorKey(value) ? value : fallback;
}

export function sanitizeTenantCustomTexts(
  value: unknown,
): Record<TenantTextKey, string> {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const next = { ...DEFAULT_CUSTOM_TEXTS };

  for (const field of TENANT_TEXT_FIELDS) {
    const currentValue = input[field.key];
    next[field.key] =
      typeof currentValue === "string" ? currentValue.trim() : "";
  }

  return next;
}

export function sanitizeTenantFeatureFlags(
  value: unknown,
): Record<TenantFeatureFlagKey, boolean> {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const next = { ...DEFAULT_FEATURE_FLAGS };

  for (const field of TENANT_FEATURE_FLAGS) {
    if (typeof input[field.key] === "boolean") {
      next[field.key] = input[field.key] as boolean;
    }
  }

  return next;
}

export function buildBranding(input?: BrandingInput | null): TenantBranding {
  if (!input) {
    return createDefaultBranding();
  }

  return {
    name:
      typeof input.name === "string" && input.name.trim()
        ? input.name.trim()
        : DEFAULT_BRANDING.name,
    logoUrl:
      typeof input.logoUrl === "string" && input.logoUrl.trim()
        ? input.logoUrl.trim()
        : null,
    colorPrimary: normalizeBrandColor(
      typeof input.colorPrimary === "string" ? input.colorPrimary : null,
      DEFAULT_BRANDING.colorPrimary,
    ),
    colorSecondary: normalizeBrandColor(
      typeof input.colorSecondary === "string" ? input.colorSecondary : null,
      DEFAULT_BRANDING.colorSecondary,
    ),
    customTexts: sanitizeTenantCustomTexts(input.customTexts),
    featureFlags: sanitizeTenantFeatureFlags(input.featureFlags),
  };
}

export function getBrandPrimaryValue(color: BrandColorKey): string {
  return BRAND_PRIMARY_VALUES[color];
}

export function getBrandChipClass(color: BrandColorKey): string {
  return BRAND_CHIP_CLASSES[color];
}

export function getBrandHeroGradientClass(color: BrandColorKey): string {
  return BRAND_HERO_GRADIENT_CLASSES[color];
}

export function getBrandSoftSurfaceClass(color: BrandColorKey): string {
  return BRAND_SOFT_SURFACE_CLASSES[color];
}

export function getBrandActiveNavClass(color: BrandColorKey): string {
  return BRAND_ACTIVE_NAV_CLASSES[color];
}

export function getBrandTextClass(color: BrandColorKey): string {
  return BRAND_TEXT_CLASSES[color];
}
