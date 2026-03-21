"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

const STATUS_POLL_INTERVAL = 3000;

export function useWhatsAppConnection() {
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

  return {
    status,
    qrCode,
    loading,
    actionLoading,
    errorMsg,
    showPairing,
    setShowPairing,
    phoneNumber,
    setPhoneNumber,
    pairingCode,
    pairingLoading,
    handleConnect,
    handleDisconnect,
    handleRefreshQr,
    handleRequestPairingCode,
  };
}
