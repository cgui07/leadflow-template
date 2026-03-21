import { Copy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import type { ActivationLinkSummary } from "../contracts";

function formatDate(dateValue: string | null): string {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("pt-BR");
}

interface ActivationSummaryModalProps {
  summary: ActivationLinkSummary | null;
  onClose: () => void;
  copied: boolean;
  onCopy: () => void;
}

export function ActivationSummaryModal({
  summary,
  onClose,
  copied,
  onCopy,
}: ActivationSummaryModalProps) {
  return (
    <Modal
      open={Boolean(summary)}
      onClose={onClose}
      title="Link de ativação pronto"
      description="O email de ativação foi enviado ao corretor. Copie o link abaixo caso queira reenviar manualmente."
      size="md"
    >
      {summary ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-ice bg-blue-pale px-4 py-4 text-sm text-blue-navy">
            <div className="font-semibold">{summary.tenantName}</div>
            <div className="mt-1">Email enviado para: {summary.email}</div>
            <div className="mt-1">
              Link válido até {formatDate(summary.expiresAt)}
            </div>
          </div>

          <TextField
            label="Link de ativação"
            value={summary.activationLink}
            readOnly
          />

          <div className="rounded-xl border border-neutral-border bg-neutral-surface px-4 py-4 text-sm text-neutral-dark">
            O corretor vai abrir o link no email, criar a senha e entrar como admin do próprio workspace.
            Depois disso, novos acessos usam login normal ou recuperação de senha.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              type="button"
              icon={<Copy className="h-4 w-4" />}
              onClick={onCopy}
            >
              {copied ? "Copiado!" : "Copiar link"}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
