"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  createDefaultBranding,
  type TenantFeatureFlagKey,
  type TenantBranding,
  type TenantTextKey,
} from "@/lib/branding";

const BrandingContext = createContext<TenantBranding>(createDefaultBranding());

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

export function useBrandText(key: TenantTextKey, fallback: string): string {
  const branding = useBranding();

  return branding.customTexts[key] || fallback;
}

export function useFeatureFlag(flag: TenantFeatureFlagKey): boolean {
  const branding = useBranding();

  return branding.featureFlags[flag] === true;
}
