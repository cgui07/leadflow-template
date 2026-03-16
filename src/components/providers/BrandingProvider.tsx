"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  DEFAULT_BRANDING,
  TENANT_FEATURE_FLAGS,
  TENANT_TEXT_FIELDS,
  type TenantBranding,
} from "@/lib/branding";

const BrandingContext = createContext<TenantBranding>(DEFAULT_BRANDING);

export function BrandingProvider({
  branding,
  children,
}: {
  branding: TenantBranding;
  children: ReactNode;
}) {
  const value = useMemo(() => branding, [branding]);

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): TenantBranding {
  return useContext(BrandingContext);
}

export function useBrandText(key: string, fallback: string): string {
  const branding = useBranding();
  const isKnownKey = TENANT_TEXT_FIELDS.some((field) => field.key === key);
  if (!isKnownKey) return fallback;

  return branding.customTexts[key as keyof TenantBranding["customTexts"]] || fallback;
}

export function useFeatureFlag(flag: string): boolean {
  const branding = useBranding();
  const isKnownFlag = TENANT_FEATURE_FLAGS.some((field) => field.key === flag);
  if (!isKnownFlag) return false;

  return branding.featureFlags[flag as keyof TenantBranding["featureFlags"]] === true;
}
