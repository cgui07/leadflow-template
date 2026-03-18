"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { TextField } from "@/components/forms";
import { SectionContainer } from "@/components/layout/SectionContainer";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

const STATUS_POLL_INTERVAL = 3000;

export function WhatsAppConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPairing, setShowPairing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
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
      } catch {
      } finally {
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

  async function handleRequestPairingCode() {
    setPairingLoading(true);
    setErrorMsg(null);
    setPairingCode(null);

    try {
      const res = await fetch("/api/whatsapp/pairing-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao gerar código de pareamento");
        return;
      }

      setPairingCode(data.pairingCode);
      startPolling();
    } catch {
      setErrorMsg("Erro ao gerar código de pareamento");
    } finally {
      setPairingLoading(false);
    }
  }

  if (loading) {
    return (
      <SectionContainer
        title="WhatsApp"
        icon={<WhatsAppIcon className="h-6 w-6 text-whatsapp" />}
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
      icon={<WhatsAppIcon className="h-6 w-6 text-whatsapp" />}
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
              <div className="text-sm font-medium text-neutral-dark">
                Seu WhatsApp não está conectado
              </div>
              <div className="mt-1 text-sm text-neutral-muted">
                Conecte para enviar e receber mensagens diretamente pela
                plataforma
              </div>
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
                <div className="text-xs text-neutral-muted">
                  Abra o WhatsApp {" > "}Dispositivos conectados{" > "}Conectar
                  dispositivo
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={handleRefreshQr}
                >
                  Atualizar QR Code
                </Button>

                <div className="pt-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-neutral-line" />
                    <span className="text-xs text-neutral-muted">ou</span>
                    <div className="h-px flex-1 bg-neutral-line" />
                  </div>

                  {!showPairing ? (
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setShowPairing(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-70 transition-colors hover:text-primary"
                    >
                      <Phone className="h-4 w-4" />
                      Conectar com número de telefone
                    </Button>
                  ) : pairingCode ? (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-medium text-neutral-dark">
                        Digite este código no seu WhatsApp:
                      </div>
                      <div className="mx-auto w-fit rounded-xl bg-neutral-pale px-6 py-3 font-mono text-2xl font-bold tracking-widest text-neutral-dark">
                        {pairingCode}
                      </div>
                      <div className="text-xs text-neutral-muted">
                        Abra o WhatsApp {" > "} Dispositivos conectados {" > "}{" "}
                        Conectar dispositivo {" > "} Conectar com número
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <TextField
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+55 11 99999-9999"
                        icon={<Phone className="h-4 w-4" />}
                        fieldSize="sm"
                        fullWidth={false}
                        className="w-48"
                      />
                      <Button
                        size="sm"
                        onClick={handleRequestPairingCode}
                        loading={pairingLoading}
                        disabled={!phoneNumber.replace(/\D/g, "").length}
                      >
                        Gerar código
                      </Button>
                    </div>
                  )}
                </div>
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
              <div className="text-sm font-medium text-neutral-dark">
                WhatsApp conectado com sucesso
              </div>
              <div className="mt-1 text-sm text-neutral-muted">
                Mensagens estão sendo enviadas e recebidas automaticamente
              </div>
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

        {errorMsg && (
          <div className="text-center text-sm text-danger">{errorMsg}</div>
        )}
      </div>
    </SectionContainer>
  );
}
