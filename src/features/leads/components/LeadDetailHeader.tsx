import Link from "next/link";
import type { LeadDetail } from "../contracts";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Mail, Phone } from "lucide-react";

interface StatusOption {
  value: string;
  label: string;
}

interface LeadDetailHeaderProps {
  lead: LeadDetail;
  statusOptions: StatusOption[];
  statusColors: Record<string, string>;
  scoreColor: string;
}

export function LeadDetailHeader({
  lead,
  statusOptions,
  statusColors,
  scoreColor,
}: LeadDetailHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      <Link href="/leads">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
          Voltar
        </Button>
      </Link>

      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xl font-bold text-neutral-ink">{lead.name}</div>
            <div className="mt-0.5 flex items-center gap-3 text-sm text-neutral-muted">
              <div className="flex items-center gap-1">
                <Phone size={12} />
                {lead.phone}
              </div>
              {lead.email ? (
                <div className="flex items-center gap-1">
                  <Mail size={12} />
                  {lead.email}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-3xl font-bold ${scoreColor}`}>
          {lead.score}
          <div className="inline text-sm font-normal text-neutral-muted">/100</div>
        </div>
        <div className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[lead.status] || ""}`}>
          {statusOptions.find((s) => s.value === lead.status)?.label}
        </div>
      </div>
    </div>
  );
}
