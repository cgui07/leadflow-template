import { Button } from "@/components/ui/Button";
import { WifiOff } from "lucide-react";

interface WhatsAppDisconnectedPanelProps {
  onConnect: () => void;
  loading: boolean;
}

export function WhatsAppDisconnectedPanel({ onConnect, loading }: WhatsAppDisconnectedPanelProps) {
  return (
    <div className="space-y-4 py-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-pale">
        <WifiOff className="h-7 w-7 text-neutral" />
      </div>
      <div>
        <div className="text-sm font-medium text-neutral-dark">
          Seu WhatsApp não está conectado
        </div>
        <div className="mt-1 text-sm text-neutral-muted">
          Conecte para enviar e receber mensagens diretamente pela plataforma
        </div>
      </div>
      <Button onClick={onConnect} loading={loading}>
        Conectar WhatsApp
      </Button>
    </div>
  );
}
