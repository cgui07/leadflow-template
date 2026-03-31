"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  ExternalLink,
  Loader,
  Megaphone,
  Unlink,
} from "lucide-react";
import type { UserSettings } from "../contracts";
import { CheckboxField } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";

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
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-neutral">{description}</p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-3 py-2 text-xs ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
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
          <div className="flex items-center gap-2 text-xs text-green-700">
            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-600" />
            <span className="font-medium">{connectedLabel}</span>
            {connectedSince && (
              <span className="text-green-600">
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

export function ConnectorsSection({ form, update }: ConnectorsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <GoogleCalendarCard />
      <FacebookCard form={form} update={update} />
    </div>
  );
}
