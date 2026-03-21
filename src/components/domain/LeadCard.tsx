import { memo } from "react";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Mail, MapPin, Phone } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import {
  LEAD_STATUS_BADGE_VARIANTS,
  LEAD_STATUS_LABELS,
} from "@/lib/lead-status";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const LeadCard = memo(function LeadCard({
  lead,
  onClick,
  onEdit,
  onDelete,
  className,
}: LeadCardProps) {
  const formattedValue = lead.value
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
      }).format(lead.value)
    : null;

  const menuItems = [
    ...(onEdit ? [{ label: "Editar", onClick: onEdit }] : []),
    ...(onDelete
      ? [{ label: "Excluir", onClick: onDelete, danger: true }]
      : []),
  ];

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border border-neutral-border p-3 space-y-2.5",
        "hover:border-neutral-line hover:shadow-sm transition-all",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-neutral-ink truncate">
            {lead.name}
          </div>
          {lead.region && (
            <div className="flex items-center gap-1 text-xs text-neutral mt-0.5">
              <MapPin className="h-3 w-3" />
              {lead.region}
            </div>
          )}
        </div>
        {menuItems.length > 0 && <ActionMenu items={menuItems} />}
      </div>
      <div className="space-y-1">
        {lead.email && (
          <div className="flex items-center gap-1.5 text-xs text-neutral truncate">
            <Mail className="h-3 w-3 shrink-0" />
            {lead.email}
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-neutral">
            <Phone className="h-3 w-3 shrink-0" />
            {lead.phone}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-1">
        <Badge variant={LEAD_STATUS_BADGE_VARIANTS[lead.status]} size="sm" dot>
          {LEAD_STATUS_LABELS[lead.status]}
        </Badge>
        {formattedValue && (
          <div className="text-xs font-semibold text-neutral-dark">
            {formattedValue}
          </div>
        )}
      </div>
    </div>
  );
});
