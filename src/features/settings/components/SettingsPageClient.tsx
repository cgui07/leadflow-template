"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { useSettingsForm } from "../hooks/useSettingsForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { GoogleCalendarSettings } from "./GoogleCalendarSettings";
import { FacebookSettingsSection } from "./FacebookSettingsSection";
import { Bot, Calendar, Loader2, Megaphone, Palette, Save } from "lucide-react";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { AutomationSettingsSection } from "./AutomationSettingsSection";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TenantCustomizationSection } from "./TenantCustomizationSection";
import type {
  SettingsSection,
  TenantCustomizationSettings,
  UserSettings,
} from "../contracts";

interface SettingsPageClientProps {
  canManageTenant: boolean;
  initialSettings: UserSettings;
  initialTenant: TenantCustomizationSettings | null;
  subtitle: string;
}

function resolveSection(
  requestedSection: string | null,
  canManageTenant: boolean,
): SettingsSection {
  if (requestedSection === "facebook") return "facebook";
  if (requestedSection === "calendar") return "calendar";
  if (canManageTenant && requestedSection === "design") return "design";
  return "automation";
}

export function SettingsPageClient({
  canManageTenant,
  initialSettings,
  initialTenant,
  subtitle,
}: SettingsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedSection = searchParams.get("section");
  const activeSection = resolveSection(requestedSection, canManageTenant);
  const [transitioning, setTransitioning] = useState(false);
  const {
    form,
    modelHelpText,
    modelOptions,
    save,
    saveError,
    saved,
    saving,
    selectedProvider,
    update,
  } = useSettingsForm(initialSettings);
  const tabs = useMemo(() => {
    return [
      {
        id: "automation",
        label: "IA e WhatsApp",
        icon: <Bot className="h-4 w-4" />,
      },
      {
        id: "facebook",
        label: "Facebook Ads",
        icon: <Megaphone className="h-4 w-4" />,
      },
      {
        id: "calendar",
        label: "Google Agenda",
        icon: <Calendar className="h-4 w-4" />,
      },
      ...(canManageTenant
        ? [
            {
              id: "design",
              label: "Design e marca",
              icon: <Palette className="h-4 w-4" />,
            },
          ]
        : []),
    ];
  }, [canManageTenant]);

  useEffect(() => {
    if (requestedSection === activeSection) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("section", activeSection);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeSection, pathname, requestedSection, router, searchParams]);

  function handleSectionChange(section: string) {
    setTransitioning(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", section);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (transitioning) {
      setTransitioning(false);
    }
  }, [activeSection, transitioning]);

  return (
    <PageContainer
      title="Configurações"
      subtitle={subtitle}
      actions={
        activeSection === "automation" || activeSection === "facebook" ? (
          <Button
            icon={<Save className="h-4 w-4" />}
            onClick={save}
            loading={saving}
          >
            {saved ? "Salvo!" : "Salvar"}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <SectionContainer
          title="Áreas de configuração"
          description="Escolha se quer ajustar automações do workspace ou a identidade visual do cliente."
          noPadding
        >
          {/* Desktop: Tabs */}
          <div className="hidden md:block px-6 pt-2">
            <Tabs
              tabs={tabs}
              activeTab={activeSection}
              onTabChange={handleSectionChange}
            />
          </div>

          <div className="flex flex-wrap gap-2 px-4 pt-2 pb-1 md:hidden">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant="ghost"
                icon={tab.icon}
                onClick={() => handleSectionChange(tab.id)}
                className={cn(
                  "h-auto rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  activeSection === tab.id
                    ? "bg-primary text-white hover:bg-blue-royal"
                    : "border border-neutral-border bg-neutral-surface text-neutral-dark hover:bg-neutral-pale",
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </SectionContainer>

        {transitioning ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-royal" />
          </div>
        ) : activeSection === "automation" ? (
          <AutomationSettingsSection
            form={form}
            modelHelpText={modelHelpText}
            modelOptions={modelOptions}
            saveError={saveError}
            selectedProvider={selectedProvider}
            update={update}
          />
        ) : activeSection === "facebook" ? (
          <FacebookSettingsSection
            form={form}
            saveError={saveError}
            update={update}
          />
        ) : activeSection === "calendar" ? (
          <GoogleCalendarSettings />
        ) : initialTenant ? (
          <TenantCustomizationSection initialTenant={initialTenant} />
        ) : null}
      </div>
    </PageContainer>
  );
}
