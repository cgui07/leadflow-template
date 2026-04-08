"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { UserSettings } from "../contracts";
import { CheckboxField } from "@/components/forms";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import {
  Building2,
  Calendar,
  CheckCircle,
  ClipboardCopy,
  ExternalLink,
  Loader,
  Megaphone,
  RefreshCw,
  Unlink,
} from "lucide-react";

interface CalendarStatus {
  connected: boolean;
  calendarId: string | null;
  connectedAt: string | null;
}

interface FacebookPage {
  pageId: string;
  pageName: string | null;
}

interface FacebookStatus {
  connected: boolean;
  pages: FacebookPage[];
}

interface ConnectorsSectionProps {
  form: UserSettings;
  update: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
}

function GoogleCalendarCard() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar_connected")) {
      setMessage({ type: "success", text: "Google Agenda conectado!" });
    } else if (params.get("calendar_error")) {
      setMessage({
        type: "error",
        text: `Erro: ${params.get("calendar_error")}`,
      });
    }
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/google-calendar");
      if (res.ok) setStatus((await res.json()) as CalendarStatus);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/settings/google-calendar", {
        method: "DELETE",
      });
      if (res.ok) {
        setStatus({ connected: false, calendarId: null, connectedAt: null });
        setMessage({ type: "success", text: "Google Agenda desconectado." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao desconectar." });
    } finally {
      setDisconnecting(false);
      setModalOpen(false);
    }
  }

  return (
    <>
      <ConnectorCard
        icon={<Calendar className="h-5 w-5" />}
        title="Google Agenda"
        description="Verifique disponibilidade e crie eventos ao agendar visitas."
        loading={loading}
        message={message}
        connected={status?.connected ?? false}
        connectedLabel={status?.calendarId ?? "primary"}
        connectedSince={status?.connectedAt ?? null}
        connectHref="/api/settings/google-calendar/connect"
        connectLabel="Conectar Google Agenda"
        onDisconnect={() => setModalOpen(true)}
        disconnecting={disconnecting}
      />
      <DeleteConfirmationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={disconnect}
        title="Desconectar Google Agenda"
        description="Os agendamentos existentes não serão afetados."
        confirmText="Desconectar"
        loading={disconnecting}
      />
    </>
  );
}

function FacebookCard({
  form,
  update,
}: {
  form: UserSettings;
  update: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
}) {
  const [status, setStatus] = useState<FacebookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("facebook_connected")) {
      setMessage({ type: "success", text: "Facebook conectado!" });
    } else if (params.get("facebook_error")) {
      setMessage({
        type: "error",
        text: `Erro: ${params.get("facebook_error")}`,
      });
    }
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/facebook");
      if (res.ok) setStatus((await res.json()) as FacebookStatus);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/settings/facebook", { method: "DELETE" });
      if (res.ok) {
        setStatus({ connected: false, pages: [] });
        setMessage({ type: "success", text: "Facebook desconectado." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao desconectar." });
    } finally {
      setDisconnecting(false);
      setModalOpen(false);
    }
  }

  return (
    <>
      <ConnectorCard
        icon={<Megaphone className="h-5 w-5" />}
        title="Facebook / Instagram Ads"
        description="Receba leads de formulários de anúncios direto no CRM."
        loading={loading}
        message={message}
        connected={status?.connected ?? false}
        connectedLabel={
          status?.pages.map((p) => p.pageName ?? p.pageId).join(", ") ?? ""
        }
        connectedSince={null}
        connectHref="/api/settings/facebook/connect"
        connectLabel="Conectar Facebook"
        onDisconnect={() => setModalOpen(true)}
        disconnecting={disconnecting}
        extra={
          status?.connected ? (
            <CheckboxField
              variant="switch"
              label="Envio automático via WhatsApp"
              checked={form.facebookAutoOutreach}
              onChange={(checked) => update("facebookAutoOutreach", checked)}
            />
          ) : null
        }
      />
      <DeleteConfirmationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={disconnect}
        title="Desconectar Facebook"
        description="Você deixará de receber leads de campanhas automaticamente."
        confirmText="Desconectar"
        loading={disconnecting}
      />
    </>
  );
}

interface ConnectorCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  loading: boolean;
  message: { type: "success" | "error"; text: string } | null;
  connected: boolean;
  connectedLabel: string;
  connectedSince: string | null;
  connectHref: string;
  connectLabel: string;
  onDisconnect: () => void;
  disconnecting: boolean;
  extra?: React.ReactNode;
}

function ConnectorCard({
  icon,
  title,
  description,
  loading,
  message,
  connected,
  connectedLabel,
  connectedSince,
  connectHref,
  connectLabel,
  onDisconnect,
  disconnecting,
  extra,
}: ConnectorCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-alt text-neutral">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{title}</div>
          <div className="text-xs text-neutral">{description}</div>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-3 py-2 text-xs ${
            message.type === "success"
              ? "border-green-sage bg-green-pale text-green-dark"
              : "border-red-blush bg-red-pale text-red-dark"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-neutral">
          <Loader className="h-3.5 w-3.5 animate-spin" />
          Verificando...
        </div>
      ) : connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-green-dark">
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-medium" />
            <span className="font-medium">{connectedLabel}</span>
            {connectedSince && (
              <span className="text-green-medium">
                · desde {new Date(connectedSince).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
          {extra}
          <Button
            variant="secondary"
            size="sm"
            icon={<Unlink className="h-3.5 w-3.5" />}
            onClick={onDisconnect}
            loading={disconnecting}
          >
            Desconectar
          </Button>
        </div>
      ) : (
        <a href={connectHref}>
          <Button size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />}>
            {connectLabel}
          </Button>
        </a>
      )}
    </div>
  );
}

interface CanalProStatus {
  connected: boolean;
  webhookUrl: string | null;
}

function CanalProCard({
  form,
  update,
}: {
  form: UserSettings;
  update: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
}) {
  const [status, setStatus] = useState<CanalProStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/canal-pro");
      if (res.ok) setStatus((await res.json()) as CanalProStatus);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function activate() {
    setActivating(true);
    try {
      const res = await fetch("/api/settings/canal-pro/activate", {
        method: "POST",
      });
      if (res.ok) {
        const data = (await res.json()) as { token: string; webhookUrl: string };
        setStatus({ connected: true, webhookUrl: data.webhookUrl });
        setMessage({ type: "success", text: "Canal Pro ativado!" });
      } else {
        setMessage({ type: "error", text: "Erro ao ativar Canal Pro." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao ativar Canal Pro." });
    } finally {
      setActivating(false);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/settings/canal-pro/activate", {
        method: "POST",
      });
      if (res.ok) {
        const data = (await res.json()) as { token: string; webhookUrl: string };
        setStatus({ connected: true, webhookUrl: data.webhookUrl });
        setMessage({ type: "success", text: "Nova URL gerada!" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao gerar nova URL." });
    } finally {
      setRegenerating(false);
      setRegenerateModalOpen(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/settings/canal-pro", { method: "DELETE" });
      if (res.ok) {
        setStatus({ connected: false, webhookUrl: null });
        setMessage({ type: "success", text: "Canal Pro desconectado." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao desconectar." });
    } finally {
      setDisconnecting(false);
      setDisconnectModalOpen(false);
    }
  }

  function copyUrl() {
    if (!status?.webhookUrl) return;
    navigator.clipboard.writeText(status.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-alt text-neutral">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              Canal Pro (ZAP / Viva Real / OLX)
            </div>
            <div className="text-xs text-neutral">
              Receba leads dos maiores portais imobiliários do Brasil.
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-xl border px-3 py-2 text-xs ${
              message.type === "success"
                ? "border-green-sage bg-green-pale text-green-dark"
                : "border-red-blush bg-red-pale text-red-dark"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-neutral">
            <Loader className="h-3.5 w-3.5 animate-spin" />
            Verificando...
          </div>
        ) : status?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-green-dark">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-medium" />
              <span className="font-medium">Ativo</span>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-neutral">URL do webhook:</div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={status.webhookUrl ?? ""}
                  className="flex-1 rounded-lg border border-border bg-surface-alt px-2.5 py-1.5 text-xs text-foreground font-mono select-all"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ClipboardCopy className="h-3.5 w-3.5" />}
                  onClick={copyUrl}
                >
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <div className="text-xs text-neutral mt-1">
                Cole esta URL na aba &quot;Recebimento de Leads&quot; do seu
                Canal Pro.
              </div>
            </div>

            <CheckboxField
              variant="switch"
              label="Envio automático via WhatsApp"
              checked={form.canalProAutoOutreach}
              onChange={(checked) => update("canalProAutoOutreach", checked)}
            />

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={() => setRegenerateModalOpen(true)}
                loading={regenerating}
              >
                Gerar nova URL
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Unlink className="h-3.5 w-3.5" />}
                onClick={() => setDisconnectModalOpen(true)}
                loading={disconnecting}
              >
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={activate}
            loading={activating}
          >
            Ativar Canal Pro
          </Button>
        )}
      </div>

      <DeleteConfirmationModal
        open={regenerateModalOpen}
        onClose={() => setRegenerateModalOpen(false)}
        onConfirm={regenerate}
        title="Gerar nova URL"
        description="A URL anterior deixará de funcionar. Você precisará atualizar no Canal Pro."
        confirmText="Gerar nova URL"
        loading={regenerating}
      />
      <DeleteConfirmationModal
        open={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        onConfirm={disconnect}
        title="Desconectar Canal Pro"
        description="Você deixará de receber leads dos portais automaticamente."
        confirmText="Desconectar"
        loading={disconnecting}
      />
    </>
  );
}

export function ConnectorsSection({ form, update }: ConnectorsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <GoogleCalendarCard />
      <FacebookCard form={form} update={update} />
      <CanalProCard form={form} update={update} />
    </div>
  );
}
