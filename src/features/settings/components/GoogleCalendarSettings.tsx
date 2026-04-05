"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { Calendar, CheckCircle, ExternalLink, Loader, Unlink } from "lucide-react";

interface CalendarStatus {
  connected: boolean;
  calendarId: string | null;
  connectedAt: string | null;
}

export function GoogleCalendarSettings() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchStatus();

    // Show feedback from OAuth redirect query params
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar_connected")) {
      setMessage({ type: "success", text: "Google Agenda conectado com sucesso!" });
    } else if (params.get("calendar_error")) {
      setMessage({
        type: "error",
        text: `Erro ao conectar: ${params.get("calendar_error")}`,
      });
    }
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/google-calendar");
      if (res.ok) {
        const data = (await res.json()) as CalendarStatus;
        setStatus(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnectClick() {
    setDisconnectModalOpen(true);
  }

  async function handleDisconnectConfirm() {
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
      setDisconnectModalOpen(false);
    }
  }

  return (
    <>
      <SectionContainer
        title="Google Agenda"
        icon={<Calendar className="h-5 w-5 text-secondary" />}
      >
        <div className="space-y-4">
          {message && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-blush bg-red-pale text-red-dark"
              }`}
            >
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-neutral">
              <Loader className="h-4 w-4 animate-spin" />
              Verificando conexão...
            </div>
          ) : status?.connected ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-green-800">
                    Google Agenda conectado
                  </div>
                  <div className="text-xs text-green-700">
                    Agenda: {status.calendarId ?? "primary"}
                  </div>
                  {status.connectedAt && (
                    <div className="text-xs text-green-600">
                      Desde{" "}
                      {new Date(status.connectedAt).toLocaleDateString(
                        "pt-BR",
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="secondary"
                icon={<Unlink className="h-4 w-4" />}
                onClick={handleDisconnectClick}
                loading={disconnecting}
              >
                Desconectar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-neutral">
                Conecte sua conta Google para que a IA possa verificar
                disponibilidade e criar eventos automaticamente ao agendar
                visitas com clientes.
              </div>

              <a href="/api/settings/google-calendar/connect">
                <Button icon={<ExternalLink className="h-4 w-4" />}>
                  Conectar Google Agenda
                </Button>
              </a>
            </div>
          )}
        </div>
      </SectionContainer>

<DeleteConfirmationModal
        open={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        onConfirm={handleDisconnectConfirm}
        title="Desconectar Google Agenda"
        description="Deseja desconectar o Google Agenda? Os agendamentos existentes não serão afetados."
        confirmText="Desconectar"
        loading={disconnecting}
      />
    </>
  );
}
