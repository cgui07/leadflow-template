"use client";

import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { useAuth, useFetch } from "@/lib/hooks";
import { useEffect, useMemo, useState } from "react";
import { Bell, Bot, Palette, Save } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/layout/PageContainer";
import { useBrandText } from "@/components/providers/BrandingProvider";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { WhatsAppConnection } from "@/components/domain/WhatsAppConnection";
import { TenantCustomizationSection } from "./components/TenantCustomizationSection";
import {
  CheckboxField,
  DurationField,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/forms";
import {
  AI_PROVIDER_OPTIONS,
  DEFAULT_AI_MODEL_BY_PROVIDER,
  getAIModelOptions,
  isSupportedAIModel,
  isSupportedAIProvider,
  type AIProvider,
} from "@/lib/ai-models";

interface Settings {
  aiProvider: string;
  aiApiKey: string | null;
  aiModel: string;
  greetingMessage: string | null;
  autoReplyEnabled: boolean;
  autoReplyDelaySeconds: number;
  followUpEnabled: boolean;
  followUpDelayHours: number;
  maxFollowUps: number;
}

type SettingsSection = "automation" | "design";

function normalizeProvider(provider: string | undefined): AIProvider {
  return provider && isSupportedAIProvider(provider) ? provider : "openai";
}

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const subtitle = useBrandText(
    "settingsSubtitle",
    "Configure suas integrações e preferências",
  );
  const { data: settings, loading } = useFetch<Settings>("/api/settings");
  const [form, setForm] = useState<Partial<Settings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedProvider = normalizeProvider(form.aiProvider);
  const canManageTenant = user?.role === "admin" && !!user.tenantId;
  const requestedSection = searchParams.get("section");
  const activeSection: SettingsSection =
    canManageTenant && requestedSection === "design" ? "design" : "automation";
  const modelOptions = useMemo(() => {
    return getAIModelOptions(selectedProvider);
  }, [selectedProvider]);
  const modelHelpText =
    selectedProvider === "openai"
      ? "Mostrando os modelos OpenAI suportados por esta integração."
      : "Mostrando os modelos Anthropic suportados por esta integração.";
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
    if (!settings) return;

    const provider = normalizeProvider(settings.aiProvider);
    const aiModel = isSupportedAIModel(provider, settings.aiModel)
      ? settings.aiModel
      : DEFAULT_AI_MODEL_BY_PROVIDER[provider];

    setForm({
      ...settings,
      aiProvider: provider,
      aiModel,
      autoReplyDelaySeconds: settings.autoReplyDelaySeconds ?? 0,
    });
  }, [settings]);

  useEffect(() => {
    if (!form.aiProvider) return;

    const provider = normalizeProvider(form.aiProvider);

    if (form.aiProvider !== provider) {
      setForm((prev) => ({ ...prev, aiProvider: provider }));
      return;
    }

    if (!form.aiModel || !isSupportedAIModel(provider, form.aiModel)) {
      setForm((prev) => ({
        ...prev,
        aiModel: DEFAULT_AI_MODEL_BY_PROVIDER[provider],
      }));
    }
  }, [form.aiModel, form.aiProvider]);

  useEffect(() => {
    if (requestedSection === "automation") return;
    if (canManageTenant && requestedSection === "design") return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("section", "automation");
    const query = params.toString();
    router.replace(`${pathname}?${query}`, { scroll: false });
  }, [canManageTenant, pathname, requestedSection, router, searchParams]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setSaveError(null);
  }

  function handleSectionChange(section: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", section);
    const query = params.toString();
    router.replace(`${pathname}?${query}`, { scroll: false });
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    try {
      const payload = { ...form };

      if (payload.aiApiKey === "••••••" + (settings?.aiApiKey || "").slice(-4)) {
        delete payload.aiApiKey;
      }

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setSaveError(
          result?.error || "Não foi possível salvar suas configurações.",
        );
        return;
      }

      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState variant="skeleton" />;

  return (
    <PageContainer
      title="Configurações"
      subtitle={subtitle}
      actions={
        activeSection === "automation" ? (
          <Button
            icon={<Save className="h-4 w-4" />}
            onClick={handleSave}
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
          <Tabs
            tabs={tabs}
            activeTab={activeSection}
            onTabChange={handleSectionChange}
            className="px-6 pt-2"
          />
        </SectionContainer>

        {activeSection === "automation" && (
          <>
            {saveError && (
              <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <WhatsAppConnection />

              <SectionContainer
                title="Inteligência artificial"
                icon={<Bot className="h-5 w-5 text-secondary" />}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField
                      label="Provedor"
                      options={AI_PROVIDER_OPTIONS}
                      value={selectedProvider}
                      onChange={(value) => update("aiProvider", value)}
                    />
                    <SelectField
                      label="Modelo"
                      value={
                        form.aiModel ||
                        DEFAULT_AI_MODEL_BY_PROVIDER[selectedProvider]
                      }
                      options={modelOptions}
                      onChange={(value) => update("aiModel", value)}
                      placeholder="Selecione um modelo"
                      searchable
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="text-xs text-neutral md:col-start-2">
                      {modelHelpText}
                    </div>
                  </div>

                  <TextField
                    label="API key"
                    type="password"
                    value={form.aiApiKey || ""}
                    onChange={(e) => update("aiApiKey", e.target.value)}
                    placeholder="Chave de API"
                  />

                  <CheckboxField
                    variant="switch"
                    label="Resposta automática"
                    checked={form.autoReplyEnabled ?? false}
                    onChange={(checked) => update("autoReplyEnabled", checked)}
                  />

                  <DurationField
                    label="Tempo para responder"
                    description="Defina quanto tempo a IA espera antes de responder uma nova mensagem do cliente."
                    valueSeconds={form.autoReplyDelaySeconds ?? 0}
                    onChange={(seconds) =>
                      update("autoReplyDelaySeconds", seconds)
                    }
                  />
                </div>
              </SectionContainer>

              <SectionContainer title="Mensagem de saudação">
                <TextareaField
                  label="Mensagem padrão para novos contatos quando a IA não estiver configurada"
                  value={form.greetingMessage || ""}
                  onChange={(e) => update("greetingMessage", e.target.value)}
                  rows={4}
                  placeholder="Olá! Obrigado pelo contato. Em breve um corretor especializado vai te atender."
                />
              </SectionContainer>

              <SectionContainer
                title="Follow-up automático"
                icon={<Bell className="h-5 w-5 text-accent" />}
              >
                <div className="space-y-4">
                  <CheckboxField
                    variant="switch"
                    label="Ativar follow-ups automáticos"
                    checked={form.followUpEnabled ?? false}
                    onChange={(checked) => update("followUpEnabled", checked)}
                  />
                  <TextField
                    label="Intervalo entre follow-ups (horas)"
                    type="number"
                    value={String(form.followUpDelayHours || 24)}
                    onChange={(e) =>
                      update(
                        "followUpDelayHours",
                        Number.parseInt(e.target.value, 10),
                      )
                    }
                    min={1}
                    max={168}
                  />
                  <TextField
                    label="Máximo de follow-ups por lead"
                    type="number"
                    value={String(form.maxFollowUps || 3)}
                    onChange={(e) =>
                      update("maxFollowUps", Number.parseInt(e.target.value, 10))
                    }
                    min={1}
                    max={10}
                  />
                </div>
              </SectionContainer>
            </div>
          </>
        )}

        {activeSection === "design" && canManageTenant && (
          <TenantCustomizationSection />
        )}
      </div>
    </PageContainer>
  );
}
