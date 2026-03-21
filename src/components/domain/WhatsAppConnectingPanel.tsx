import Image from "next/image";
import { TextField } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { Phone, RefreshCw } from "lucide-react";

interface WhatsAppConnectingPanelProps {
  qrCode: string | null;
  showPairing: boolean;
  pairingCode: string | null;
  phoneNumber: string;
  pairingLoading: boolean;
  onRefreshQr: () => void;
  onShowPairing: () => void;
  onPhoneChange: (v: string) => void;
  onRequestPairingCode: () => void;
}

export function WhatsAppConnectingPanel({
  qrCode,
  showPairing,
  pairingCode,
  phoneNumber,
  pairingLoading,
  onRefreshQr,
  onShowPairing,
  onPhoneChange,
  onRequestPairingCode,
}: WhatsAppConnectingPanelProps) {
  return (
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
            onClick={onRefreshQr}
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
                onClick={onShowPairing}
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
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  icon={<Phone className="h-4 w-4" />}
                  fieldSize="sm"
                  fullWidth={false}
                  className="w-48"
                />
                <Button
                  size="sm"
                  onClick={onRequestPairingCode}
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
  );
}
