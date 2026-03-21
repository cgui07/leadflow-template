"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Copy, KeyRound, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import type { PlatformClientAccessState, PlatformClientRow } from "../contracts";

const accessStateConfig: Record<
  PlatformClientAccessState,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "purple" }
> = {
  pending: { label: "Link pendente", variant: "warning" },
  active: { label: "Ativo", variant: "success" },
  suspended: { label: "Suspenso", variant: "error" },
  setup: { label: "Sem ativação", variant: "default" },
};

function formatDate(dateValue: string | null): string {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("pt-BR");
}

interface ClientCardProps {
  client: PlatformClientRow;
  updatingClientId: string | null;
  regenerating: boolean;
  selectedClientId: string | null;
  onCopyLink: (link: string) => void;
  onRegenerate: (client: PlatformClientRow) => void;
  onToggleStatus: (client: PlatformClientRow) => void;
  onDelete: (client: PlatformClientRow) => void;
}

export function ClientCard({
  client,
  updatingClientId,
  regenerating,
  selectedClientId,
  onCopyLink,
  onRegenerate,
  onToggleStatus,
  onDelete,
}: ClientCardProps) {
  const stateConfig = accessStateConfig[client.accessState];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-neutral-ink truncate">{client.name}</div>
          <div className="text-xs text-neutral-muted mt-0.5">/{client.slug}</div>
        </div>
        <Badge variant={stateConfig.variant} size="sm" dot>
          {stateConfig.label}
        </Badge>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-neutral shrink-0">Acesso</span>
          <div className="text-right min-w-0">
            <div className="text-sm font-medium text-neutral-dark truncate">
              {client.ownerName || "Aguardando ativação"}
            </div>
            <div className="text-xs text-neutral-muted truncate">
              {client.ownerEmail || client.activationEmail || "-"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-neutral">Status</span>
          <span className="text-xs text-neutral-muted text-right">
            {client.accessState === "pending"
              ? `Expira em ${formatDate(client.activationExpiresAt)}`
              : client.accessState === "active"
                ? `Ativado em ${formatDate(client.activatedAt)}`
                : client.accessState === "suspended"
                  ? "Bloqueado até reativação"
                  : "Gere um link para liberar"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-neutral">Criado em</span>
          <span className="text-xs text-neutral-muted">{formatDate(client.createdAt)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-pale pt-3">
        {client.usersCount === 0 && client.activationLink ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Copy className="h-3.5 w-3.5" />}
            onClick={() => onCopyLink(client.activationLink!)}
          >
            Copiar link
          </Button>
        ) : null}

        {client.usersCount === 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<KeyRound className="h-3.5 w-3.5" />}
            loading={regenerating && selectedClientId === client.id}
            onClick={() => onRegenerate(client)}
          >
            {client.activationLink ? "Novo link" : "Gerar link"}
          </Button>
        ) : null}

        <Button
          type="button"
          variant={client.status === "active" ? "ghost" : "outline"}
          size="sm"
          icon={
            client.status === "active" ? (
              <PauseCircle className="h-3.5 w-3.5" />
            ) : (
              <PlayCircle className="h-3.5 w-3.5" />
            )
          }
          loading={updatingClientId === client.id}
          onClick={() => onToggleStatus(client)}
        >
          {client.status === "active" ? "Suspender" : "Reativar"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}
          onClick={() => onDelete(client)}
          className="ml-auto"
        />
      </div>
    </Card>
  );
}
