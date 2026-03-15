import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Mail, Phone, Building2 } from "lucide-react";
import type { Lead, LeadStatus } from "@/types";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const statusConfig: Record<LeadStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "purple" }> = {
  new: { label: "Novo", variant: "info" },
  contacted: { label: "Contatado", variant: "default" },
  qualified: { label: "Qualificado", variant: "purple" },
  proposal: { label: "Proposta", variant: "warning" },
  negotiation: { label: "Negociação", variant: "warning" },
  won: { label: "Ganho", variant: "success" },
  lost: { label: "Perdido", variant: "error" },
};

export function LeadCard({
  lead,
  onClick,
  onEdit,
  onDelete,
  className,
}: LeadCardProps) {
  const status = statusConfig[lead.status];

  const formattedValue = lead.value
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
      }).format(lead.value)
    : null;

  const menuItems = [
    ...(onEdit ? [{ label: "Editar", onClick: onEdit }] : []),
    ...(onDelete ? [{ label: "Excluir", onClick: onDelete, danger: true }] : []),
  ];

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border border-neutral-border p-3 space-y-2.5",
        "hover:border-neutral-line hover:shadow-sm transition-all",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-neutral-ink truncate">
            {lead.name}
          </div>
          {lead.company && (
            <div className="flex items-center gap-1 text-xs text-neutral mt-0.5">
              <Building2 className="h-3 w-3" />
              {lead.company}
            </div>
          )}
        </div>
        {menuItems.length > 0 && <ActionMenu items={menuItems} />}
      </div>
      <div className="space-y-1">
        {lead.email && (
          <div className="flex items-center gap-1.5 text-xs text-neutral truncate">
            <Mail className="h-3 w-3 flex-shrink-0" />
            {lead.email}
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-neutral">
            <Phone className="h-3 w-3 flex-shrink-0" />
            {lead.phone}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-1">
        <Badge variant={status.variant} size="sm" dot>
          {status.label}
        </Badge>
        {formattedValue && (
          <div className="text-xs font-semibold text-neutral-dark">
            {formattedValue}
          </div>
        )}
      </div>
    </div>
  );
}
