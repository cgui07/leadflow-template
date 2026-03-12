"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { Button } from "@/components/ui/Button";
import { TextField, SelectField, TextareaField, CheckboxField } from "@/components/forms";
import { useFetch } from "@/lib/hooks";
import { LoadingState } from "@/components/ui/LoadingState";
import { Save, MessageSquare, Bot, Bell } from "lucide-react";

interface Settings {
  whatsappPhoneId: string | null;
  whatsappToken: string | null;
  whatsappWebhookToken: string | null;
  aiProvider: string;
  aiApiKey: string | null;
  aiModel: string;
  greetingMessage: string | null;
  autoReplyEnabled: boolean;
  followUpEnabled: boolean;
  followUpDelayHours: number;
  maxFollowUps: number;
}

const aiProviderOptions = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic (Claude)" },
];

export default function SettingsPage() {
  const { data: settings, loading } = useFetch<Settings>("/api/settings");
  const [form, setForm] = useState<Partial<Settings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.whatsappToken === "••••••" + (settings?.whatsappToken || "").slice(-4)) {
        delete payload.whatsappToken;
      }
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionContainer title="WhatsApp Business" icon={<MessageSquare className="h-5 w-5 text-success" />}>
          <div className="space-y-4">
            <TextField
              label="Phone Number ID"
              type="text"
              value={form.whatsappPhoneId || ""}
              onChange={(e) => update("whatsappPhoneId", e.target.value)}
              placeholder="ID do número do WhatsApp Business"
            />
            <TextField
              label="Access Token"
              type="password"
              value={form.whatsappToken || ""}
              onChange={(e) => update("whatsappToken", e.target.value)}
              placeholder="Token de acesso permanente"
            />
            <div>
              <TextField
                label="Webhook Verify Token"
                type="text"
                value={form.whatsappWebhookToken || ""}
                onChange={(e) => update("whatsappWebhookToken", e.target.value)}
                placeholder="Token para verificação do webhook"
              />
              <p className="mt-1 text-xs text-neutral-muted">
                URL do webhook: <code className="bg-gray-ghost px-1 rounded">{typeof window !== "undefined" ? window.location.origin : ""}/api/whatsapp/webhook</code>
              </p>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer title="Inteligência Artificial" icon={<Bot className="h-5 w-5 text-secondary" />}>
          <div className="space-y-4">
            <SelectField
              label="Provedor"
              options={aiProviderOptions}
              value={form.aiProvider || "openai"}
              onChange={(value) => update("aiProvider", value)}
            />
            <TextField
              label="API Key"
              type="password"
              value={form.aiApiKey || ""}
              onChange={(e) => update("aiApiKey", e.target.value)}
              placeholder="Chave de API"
            />
            <TextField
              label="Modelo"
              type="text"
              value={form.aiModel || ""}
              onChange={(e) => update("aiModel", e.target.value)}
              placeholder="gpt-4o-mini ou claude-sonnet-4-20250514"
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
            label="Mensagem padrão para novos contatos (quando IA não está configurada)"
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
