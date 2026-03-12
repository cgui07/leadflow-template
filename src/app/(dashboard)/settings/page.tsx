"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { Button } from "@/components/ui/Button";
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
        <SectionContainer title="WhatsApp Business" icon={<MessageSquare className="h-5 w-5 text-green-600" />}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number ID</label>
              <input
                type="text"
                value={form.whatsappPhoneId || ""}
                onChange={(e) => update("whatsappPhoneId", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="ID do número do WhatsApp Business"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Access Token</label>
              <input
                type="password"
                value={form.whatsappToken || ""}
                onChange={(e) => update("whatsappToken", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Token de acesso permanente"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Webhook Verify Token</label>
              <input
                type="text"
                value={form.whatsappWebhookToken || ""}
                onChange={(e) => update("whatsappWebhookToken", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Token para verificação do webhook"
              />
              <p className="mt-1 text-xs text-slate-400">
                URL do webhook: <code className="bg-slate-100 px-1 rounded">{typeof window !== "undefined" ? window.location.origin : ""}/api/whatsapp/webhook</code>
              </p>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer title="Inteligência Artificial" icon={<Bot className="h-5 w-5 text-purple-600" />}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Provedor</label>
              <select
                value={form.aiProvider || "openai"}
                onChange={(e) => update("aiProvider", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">API Key</label>
              <input
                type="password"
                value={form.aiApiKey || ""}
                onChange={(e) => update("aiApiKey", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Chave de API"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Modelo</label>
              <input
                type="text"
                value={form.aiModel || ""}
                onChange={(e) => update("aiModel", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="gpt-4o-mini ou claude-sonnet-4-20250514"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Resposta automática</span>
              <button
                onClick={() => update("autoReplyEnabled", !form.autoReplyEnabled)}
                className={`relative h-6 w-11 rounded-full transition ${form.autoReplyEnabled ? "bg-blue-600" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.autoReplyEnabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        </SectionContainer>

        <SectionContainer title="Mensagem de Saudação">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mensagem padrão para novos contatos (quando IA não está configurada)
            </label>
            <textarea
              value={form.greetingMessage || ""}
              onChange={(e) => update("greetingMessage", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              rows={4}
              placeholder="Olá! Obrigado pelo contato. Em breve um corretor especializado vai te atender..."
            />
          </div>
        </SectionContainer>

        <SectionContainer title="Follow-up Automático" icon={<Bell className="h-5 w-5 text-orange-500" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Ativar follow-ups automáticos</span>
              <button
                onClick={() => update("followUpEnabled", !form.followUpEnabled)}
                className={`relative h-6 w-11 rounded-full transition ${form.followUpEnabled ? "bg-blue-600" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.followUpEnabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Intervalo entre follow-ups (horas)</label>
              <input
                type="number"
                value={form.followUpDelayHours || 24}
                onChange={(e) => update("followUpDelayHours", parseInt(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                min={1}
                max={168}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Máximo de follow-ups por lead</label>
              <input
                type="number"
                value={form.maxFollowUps || 3}
                onChange={(e) => update("maxFollowUps", parseInt(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                min={1}
                max={10}
              />
            </div>
          </div>
        </SectionContainer>
      </div>
    </PageContainer>
  );
}
