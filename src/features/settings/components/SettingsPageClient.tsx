"use client";
import { Tabs } from "@/components/ui/Tabs";
import { ConnectorsSection } from "./ConnectorsSection";
import { useEffect, useMemo, useTransition } from "react";
import { useSettingsForm } from "../hooks/useSettingsForm";
import { Bot, Link2, Loader2, Palette } from "lucide-react";
import { SelectField } from "@/components/forms/SelectField";
import { PageContainer } from "@/components/layout/PageContainer";
import { UnsavedChangesBar } from "@/components/ui/UnsavedChangesBar";
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
  if (requestedSection === "conectores") return "conectores";
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
  const [transitioning, startTransition] = useTransition();
  const { form, modelOptions, save, saveError, saving, isDirty, discard, update } =
    useSettingsForm(initialSettings);

  const tabs = useMemo(() => {
    return [
      {
        id: "automation",
        label: "IA e WhatsApp",
        icon: <Bot className="h-4 w-4" />,
      },
      {
        id: "conectores",
        label: "Conectores",
        icon: <Link2 className="h-4 w-4" />,
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

  const selectOptions = useMemo(
    () => tabs.map((t) => ({ value: t.id, label: t.label })),
    [tabs],
  );

  useEffect(() => {
    if (requestedSection === activeSection) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("section", activeSection);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeSection, pathname, requestedSection, router, searchParams]);

  function handleSectionChange(section: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", section);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <PageContainer
      title="Configurações"
      subtitle={subtitle}
    >
      <div className="space-y-6">
        <SectionContainer
          title="Áreas de configuração"
          description="Escolha se quer ajustar automações do workspace ou a identidade visual do cliente."
          noPadding
        >
          <div className="hidden md:block px-6 pt-2">
            <Tabs
              tabs={tabs}
              activeTab={activeSection}
              onTabChange={handleSectionChange}
            />
          </div>

          <div className="px-4 py-3 md:hidden">
            <SelectField
              options={selectOptions}
              value={activeSection}
              onChange={handleSectionChange}
              fieldSize="lg"
            />
          </div>
        </SectionContainer>

        {transitioning ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-royal" />
          </div>
        ) : activeSection === "automation" ? (
          <AutomationSettingsSection
            form={form}
            modelOptions={modelOptions}
            saveError={saveError}
            update={update}
          />
        ) : activeSection === "conectores" ? (
          <ConnectorsSection form={form} update={update} />
        ) : initialTenant ? (
          <TenantCustomizationSection initialTenant={initialTenant} />
        ) : null}
      </div>

      <UnsavedChangesBar
        visible={activeSection === "automation" && isDirty}
        saving={saving}
        onSave={save}
        onDiscard={discard}
      />
    </PageContainer>
  );
}
