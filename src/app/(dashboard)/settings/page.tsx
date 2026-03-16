"use client";

import { useFetch } from "@/lib/hooks";
import { Bell, Bot, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useEffect, useMemo, useState } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { WhatsAppConnection } from "@/components/domain/WhatsAppConnection";
import { CheckboxField, SelectField, TextField, TextareaField } from "@/components/forms";
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
  followUpEnabled: boolean;
  followUpDelayHours: number;
  maxFollowUps: number;
}

function normalizeProvider(provider: string | undefined): AIProvider {
  return provider && isSupportedAIProvider(provider) ? provider : "openai";
}

export default function SettingsPage() {
  const { data: settings, loading } = useFetch<Settings>("/api/settings");
  const [form, setForm] = useState<Partial<Settings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const selectedProvider = normalizeProvider(form.aiProvider);
  const modelOptions = useMemo(() => {
    return getAIModelOptions(selectedProvider);
  }, [selectedProvider]);

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

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.aiApiKey === "••••••" + (settings?.aiApiKey || "").slice(-4)) {
        delete payload.aiApiKey;
      }

      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState variant="skeleton" />;

  return (
    <PageContainer
      title="Configurações"
      subtitle="Configure suas integrações e preferências"
      actions={
        <Button icon={<Save className="h-4 w-4" />} onClick={handleSave} loading={saving}>
          {saved ? "Salvo!" : "Salvar"}
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WhatsAppConnection />
        <SectionContainer title="Inteligência Artificial" icon={<Bot className="h-5 w-5 text-secondary" />}>
          <div className="space-y-4">
            <SelectField
              label="Provedor"
              options={AI_PROVIDER_OPTIONS}
              value={selectedProvider}
              onChange={(value) => update("aiProvider", value)}
            />
            <TextField
              label="API Key"
              type="password"
              value={form.aiApiKey || ""}
              onChange={(e) => update("aiApiKey", e.target.value)}
              placeholder="Chave de API"
            />
            <SelectField
              label="Modelo"
              value={form.aiModel || DEFAULT_AI_MODEL_BY_PROVIDER[selectedProvider]}
              options={modelOptions}
              onChange={(value) => update("aiModel", value)}
              placeholder="Selecione um modelo"
              searchable
              description={
                selectedProvider === "openai"
                  ? "Mostrando os modelos OpenAI suportados por esta integração."
                  : "Mostrando os modelos Anthropic suportados por esta integração."
              }
            />
            <CheckboxField
              variant="switch"
              label="Resposta automática"
              checked={form.autoReplyEnabled ?? false}
              onChange={(checked) => update("autoReplyEnabled", checked)}
            />
          </div>
        </SectionContainer>
        <SectionContainer title="Mensagem de Saudação">
          <TextareaField
            label="Mensagem padrão para novos contatos (quando a IA não está configurada)"
            value={form.greetingMessage || ""}
            onChange={(e) => update("greetingMessage", e.target.value)}
            rows={4}
            placeholder="Olá! Obrigado pelo contato. Em breve um corretor especializado vai te atender..."
          />
        </SectionContainer>
        <SectionContainer title="Follow-up Automático" icon={<Bell className="h-5 w-5 text-accent" />}>
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
              onChange={(e) => update("followUpDelayHours", parseInt(e.target.value))}
              min={1}
              max={168}
            />
            <TextField
              label="Máximo de follow-ups por lead"
              type="number"
              value={String(form.maxFollowUps || 3)}
              onChange={(e) => update("maxFollowUps", parseInt(e.target.value))}
              min={1}
              max={10}
            />
          </div>
        </SectionContainer>
      </div>
    </PageContainer>
  );
}
