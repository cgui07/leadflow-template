"use client";

import { useEffect, useMemo } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Bot, Palette, Save } from "lucide-react";
import { useSettingsForm } from "../hooks/useSettingsForm";
import { PageContainer } from "@/components/layout/PageContainer";
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
  return canManageTenant && requestedSection === "design" ? "design" : "automation";
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
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", section);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <PageContainer
      title="Configuracoes"
      subtitle={subtitle}
      actions={
        activeSection === "automation" ? (
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
          description="Escolha se quer ajustar automacoes do workspace ou a identidade visual do cliente."
          noPadding
        >
          <Tabs
            tabs={tabs}
            activeTab={activeSection}
            onTabChange={handleSectionChange}
            className="px-6 pt-2"
          />
        </SectionContainer>

        {activeSection === "automation" ? (
          <AutomationSettingsSection
            form={form}
            modelHelpText={modelHelpText}
            modelOptions={modelOptions}
            saveError={saveError}
            selectedProvider={selectedProvider}
            update={update}
          />
        ) : initialTenant ? (
          <TenantCustomizationSection initialTenant={initialTenant} />
        ) : null}
      </div>
    </PageContainer>
  );
}
