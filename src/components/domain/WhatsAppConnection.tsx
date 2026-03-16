"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { SectionContainer } from "@/components/layout/SectionContainer";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

const STATUS_POLL_INTERVAL = 3000;

export function WhatsAppConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/whatsapp/status");
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "connected") {
          setStatus("connected");
          setQrCode(null);
          stopPolling();
        } else if (data.status === "disconnected") {
          setStatus("disconnected");
          setQrCode(null);
          stopPolling();
        }
      } catch {}
    }, STATUS_POLL_INTERVAL);
  }, [stopPolling]);

  useEffect(() => {
    async function checkInitialStatus() {
      try {
        const res = await fetch("/api/whatsapp/status");
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        setStatus(data.status);

        if (data.status === "connecting") {
          startPolling();
          const qrRes = await fetch("/api/whatsapp/qrcode");

          if (qrRes.ok) {
            const qrData = await qrRes.json();
            if (qrData.qrcode) setQrCode(qrData.qrcode);
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    }

    checkInitialStatus();
    return stopPolling;
  }, [startPolling, stopPolling]);

  async function handleConnect() {
    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/whatsapp/connect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao conectar");
        return;
      }

      if (data.status === "connected") {
        setStatus("connected");
        return;
      }

      setStatus("connecting");
      if (data.qrcode) setQrCode(data.qrcode);
      startPolling();
    } catch {
      setErrorMsg("Erro ao conectar com o WhatsApp");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao desconectar");
        return;
      }

      setStatus("disconnected");
      setQrCode(null);
      stopPolling();
    } catch {
      setErrorMsg("Erro ao desconectar");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRefreshQr() {
    setErrorMsg(null);

    try {
      const res = await fetch("/api/whatsapp/qrcode");
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao atualizar o QR Code");
        return;
      }

      if (data.qrcode) setQrCode(data.qrcode);
    } catch {
      setErrorMsg("Erro ao atualizar o QR Code");
    }
  }

  if (loading) {
    return (
      <SectionContainer
        title="WhatsApp"
        icon={<MessageSquare className="h-5 w-5 text-success" />}
      >
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-line border-t-primary" />
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer
      title="WhatsApp"
      icon={<MessageSquare className="h-5 w-5 text-success" />}
      actions={
        <Badge
          variant={
            status === "connected"
              ? "success"
              : status === "connecting"
                ? "warning"
                : "default"
          }
          dot
        >
          {status === "connected"
            ? "Conectado"
            : status === "connecting"
              ? "Aguardando QR Code"
              : "Desconectado"}
        </Badge>
      }
    >
      <div className="space-y-4">
        {status === "disconnected" && (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-pale">
              <WifiOff className="h-7 w-7 text-neutral" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-dark">
                Seu WhatsApp não está conectado
              </p>
              <p className="mt-1 text-sm text-neutral-muted">
                Conecte para enviar e receber mensagens diretamente pela plataforma
              </p>
            </div>
            <Button onClick={handleConnect} loading={actionLoading}>
              Conectar WhatsApp
            </Button>
          </div>
        )}

        {status === "connecting" && (
          <div className="space-y-4 py-4 text-center">
            {qrCode ? (
              <>
                <p className="text-sm font-medium text-neutral-dark">
                  Escaneie o QR Code com o WhatsApp do seu celular
                </p>
                <div className="flex justify-center">
                  <div className="rounded-xl border border-neutral-border bg-white p-3">
                    <Image
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      width={224}
                      height={224}
                      unoptimized
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-muted">
                  Abra o WhatsApp {" > "}Dispositivos conectados{" > "}Conectar dispositivo
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={handleRefreshQr}
                >
                  Atualizar QR Code
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-line border-t-primary" />
                <p className="text-sm text-neutral-muted">Gerando QR Code...</p>
              </div>
            )}
          </div>
        )}

        {status === "connected" && (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-pale">
              <Wifi className="h-7 w-7 text-green-dark" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-dark">
                WhatsApp conectado com sucesso
              </p>
              <p className="mt-1 text-sm text-neutral-muted">
                Mensagens estão sendo enviadas e recebidas automaticamente
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={handleConnect}
                loading={actionLoading}
              >
                Reconectar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                loading={actionLoading}
                className="text-danger hover:text-red-crimson"
              >
                Desconectar
              </Button>
            </div>
          </div>
        )}

        {errorMsg && <p className="text-center text-sm text-danger">{errorMsg}</p>}
      </div>
    </SectionContainer>
  );
}
