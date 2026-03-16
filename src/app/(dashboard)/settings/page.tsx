import { requireSession } from "@/features/auth/session";
import { SettingsPageClient } from "@/features/settings/components/SettingsPageClient";
import {
  getTenantCustomization,
  getUserSettings,
} from "@/features/settings/server";

const DEFAULT_SUBTITLE = "Configure suas integracoes e preferencias";

export default async function SettingsPage() {
  const session = await requireSession();
  const [settings, tenantSettings] = await Promise.all([
    getUserSettings(session.user.id, { maskApiKey: true }),
    session.canManageTenant
      ? getTenantCustomization({
          role: session.user.role,
          tenantId: session.user.tenantId,
        })
      : Promise.resolve(null),
  ]);
  const subtitle =
    session.branding.customTexts.settingsSubtitle || DEFAULT_SUBTITLE;

  return (
    <SettingsPageClient
      canManageTenant={session.canManageTenant}
      initialSettings={settings}
      initialTenant={tenantSettings}
      subtitle={subtitle}
    />
  );
}
