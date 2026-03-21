"use client";

import { Badge } from "@/components/ui/Badge";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useWhatsAppConnection } from "./useWhatsAppConnection";
import { WhatsAppConnectedPanel } from "./WhatsAppConnectedPanel";
import { WhatsAppConnectingPanel } from "./WhatsAppConnectingPanel";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { WhatsAppDisconnectedPanel } from "./WhatsAppDisconnectedPanel";

export function WhatsAppConnection() {
  const {
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
  } = useWhatsAppConnection();

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
          <WhatsAppDisconnectedPanel
            onConnect={handleConnect}
            loading={actionLoading}
          />
        )}

        {status === "connecting" && (
          <WhatsAppConnectingPanel
            qrCode={qrCode}
            showPairing={showPairing}
            pairingCode={pairingCode}
            phoneNumber={phoneNumber}
            pairingLoading={pairingLoading}
            onRefreshQr={handleRefreshQr}
            onShowPairing={() => setShowPairing(true)}
            onPhoneChange={setPhoneNumber}
            onRequestPairingCode={handleRequestPairingCode}
          />
        )}

        {status === "connected" && (
          <WhatsAppConnectedPanel
            onReconnect={handleConnect}
            onDisconnect={handleDisconnect}
            loading={actionLoading}
          />
        )}

        {errorMsg && (
          <div className="text-center text-sm text-danger">{errorMsg}</div>
        )}
      </div>
    </SectionContainer>
  );
}
