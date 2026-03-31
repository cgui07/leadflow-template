"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ExternalLink, Loader, Megaphone, Unlink } from "lucide-react";
import type { UserSettings } from "../contracts";
import { CheckboxField } from "@/components/forms";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { Button } from "@/components/ui/Button";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";

interface FacebookPage {
  pageId: string;
  pageName: string | null;
  createdAt: string;
}

interface FacebookStatus {
  connected: boolean;
  pages: FacebookPage[];
}

interface FacebookSettingsSectionProps {
  form: UserSettings;
  saveError: string | null;
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export function FacebookSettingsSection({
  form,
  saveError,
  update,
}: FacebookSettingsSectionProps) {
  const [status, setStatus] = useState<FacebookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get("facebook_connected")) {
      setMessage({ type: "success", text: "Facebook conectado com sucesso!" });
    } else if (params.get("facebook_error")) {
      setMessage({
        type: "error",
        text: `Erro ao conectar: ${params.get("facebook_error")}`,
      });
    }
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/facebook");
      if (res.ok) {
        const data = (await res.json()) as FacebookStatus;
        setStatus(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnectConfirm() {
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
      setDisconnectModalOpen(false);
    }
  }

  return (
    <>
      {saveError && (
        <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionContainer
          title="Facebook / Instagram Ads"
          icon={<Megaphone className="h-5 w-5 text-secondary" />}
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
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-800">
                      Facebook conectado
                    </p>
                    {status.pages.map((page) => (
                      <p key={page.pageId} className="text-xs text-green-700">
                        {page.pageName ?? page.pageId}
                      </p>
                    ))}
                  </div>
                </div>

                <CheckboxField
                  variant="switch"
                  label="Envio automático via WhatsApp"
                  checked={form.facebookAutoOutreach}
                  onChange={(checked) => update("facebookAutoOutreach", checked)}
                />

                <p className="text-xs text-neutral">
                  Quando ativado, novos leads de campanhas recebem automaticamente a mensagem de saudação via WhatsApp.
                </p>

                <Button
                  variant="secondary"
                  icon={<Unlink className="h-4 w-4" />}
                  onClick={() => setDisconnectModalOpen(true)}
                  loading={disconnecting}
                >
                  Desconectar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-neutral">
                  Conecte sua conta Facebook para receber leads automaticamente
                  das suas campanhas de anúncios no Facebook e Instagram.
                </p>

                <a href="/api/settings/facebook/connect">
                  <Button icon={<ExternalLink className="h-4 w-4" />}>
                    Conectar Facebook
                  </Button>
                </a>
              </div>
            )}
          </div>
        </SectionContainer>

        <SectionContainer title="Como funciona">
          <div className="space-y-3 text-sm text-neutral">
            <p>
              1. Clique em <strong>Conectar Facebook</strong> e autorize o acesso
              às suas Páginas
            </p>
            <p>
              2. O sistema configura automaticamente o webhook para receber leads
              das campanhas
            </p>
            <p>
              3. Novos leads de formulários de anúncios aparecem automaticamente
              no seu CRM
            </p>
            <p>
              4. Se o envio automático estiver ativo, o lead recebe uma saudação
              via WhatsApp
            </p>
          </div>
        </SectionContainer>
      </div>

      <DeleteConfirmationModal
        open={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        onConfirm={handleDisconnectConfirm}
        title="Desconectar Facebook"
        description="Deseja desconectar o Facebook? Você deixará de receber leads de campanhas automaticamente."
        confirmText="Desconectar"
        loading={disconnecting}
      />
    </>
  );
}
