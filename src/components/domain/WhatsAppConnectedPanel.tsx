import { RefreshCw, Wifi } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WhatsAppConnectedPanelProps {
  onReconnect: () => void;
  onDisconnect: () => void;
  loading: boolean;
}

export function WhatsAppConnectedPanel({ onReconnect, onDisconnect, loading }: WhatsAppConnectedPanelProps) {
  return (
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
          onClick={onReconnect}
          loading={loading}
        >
          Reconectar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          loading={loading}
          className="text-danger hover:text-red-crimson"
        >
          Desconectar
        </Button>
      </div>
    </div>
  );
}
