import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ConversationSummary } from "../types";

interface ConversationSummaryPanelProps {
  summary: ConversationSummary | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

const summaryFields: Array<{
  label: string;
  key: keyof ConversationSummary;
}> = [
  { label: "Interesse", key: "interesse" },
  { label: "Regiao", key: "regiao" },
  { label: "Tipo de imovel", key: "tipoImovel" },
  { label: "Faixa de valor", key: "faixaValor" },
  { label: "Prazo de compra", key: "prazoCompra" },
  { label: "Objecoes/Duvidas", key: "objecoes" },
  { label: "Ultima intencao", key: "ultimaIntencao" },
  { label: "Proximo passo", key: "proximoPasso" },
];

export function ConversationSummaryPanel({
  summary,
  loading,
  error,
  onClose,
  onRetry,
}: ConversationSummaryPanelProps) {
  if (!loading && !summary && !error) return null;

  return (
    <div className="border-t border-neutral-border bg-blue-pale p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-ink">
          <Sparkles size={14} className="text-primary" />
          {loading ? "Gerando resumo..." : "Resumo da conversa"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<X size={14} />}
          onClick={onClose}
          aria-label="Fechar resumo"
        />
      </div>

      {loading && (
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-3/4 rounded bg-neutral-border" />
          <div className="h-3 w-1/2 rounded bg-neutral-border" />
          <div className="h-3 w-2/3 rounded bg-neutral-border" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-blush bg-white p-3">
          <div className="text-sm font-semibold text-red-dark">
            Nao foi possivel gerar o resumo.
          </div>
          <div className="mt-1 text-xs text-neutral-steel">{error}</div>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={onRetry}>
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && summary && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {summaryFields.map((field) => (
            <div key={field.key} className="text-xs">
              <span className="font-semibold text-neutral-dark">
                {field.label}:
              </span>{" "}
              <span className="text-neutral-steel">{summary[field.key]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
