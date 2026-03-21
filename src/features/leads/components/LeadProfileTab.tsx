"use client";

import type { ReactNode } from "react";
import { TextField } from "@/components/forms";
import type { LeadDetail } from "../contracts";
import { Button } from "@/components/ui/Button";
import { getPipelineColorSoftClass } from "@/lib/ui-colors";
import { SectionContainer } from "@/components/layout/SectionContainer";
import {
  Calendar,
  DollarSign,
  Home,
  MapPin,
  Target,
} from "lucide-react";

interface LeadProfileTabProps {
  lead: LeadDetail;
  phoneInput: string;
  onPhoneInputChange: (value: string) => void;
  onSavePhone: () => void;
  savingPhone: boolean;
}

export function LeadProfileTab({
  lead,
  phoneInput,
  onPhoneInputChange,
  onSavePhone,
  savingPhone,
}: LeadProfileTabProps) {
  const needsManualPhone = lead.phone.endsWith("@lid");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SectionContainer title="Perfil do Lead (IA)">
        <div className="grid grid-cols-2 gap-4">
          <InfoItem
            icon={<MapPin size={16} />}
            label="Região"
            value={lead.region}
          />
          <InfoItem
            icon={<Home size={16} />}
            label="Tipo"
            value={lead.propertyType}
          />
          <InfoItem
            icon={<DollarSign size={16} />}
            label="Faixa de valor"
            value={
              lead.priceMax
                ? `R$ ${Number(lead.priceMin || 0).toLocaleString("pt-BR")} - R$ ${Number(lead.priceMax).toLocaleString("pt-BR")}`
                : undefined
            }
          />
          <InfoItem
            icon={<Target size={16} />}
            label="Finalidade"
            value={lead.purpose}
          />
          <InfoItem
            icon={<Calendar size={16} />}
            label="Prazo"
            value={lead.timeline}
          />
          <InfoItem
            icon={<Home size={16} />}
            label="Quartos"
            value={lead.bedrooms ? `${lead.bedrooms} quartos` : undefined}
          />
        </div>

        {lead.notes ? (
          <div className="mt-4 rounded-lg bg-gray-ghost p-3">
            <div className="mb-1 text-xs font-medium text-neutral-muted">
              Observações da IA
            </div>
            <div className="text-sm text-neutral-dark">{lead.notes}</div>
          </div>
        ) : null}
      </SectionContainer>

      <SectionContainer title="Informações">
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-warning-30 bg-warning-5 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-warning">
              WhatsApp
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
              <TextField
                label={
                  needsManualPhone
                    ? "Telefone real do contato"
                    : "Telefone do contato"
                }
                type="text"
                value={phoneInput}
                onChange={(event) => onPhoneInputChange(event.target.value)}
                placeholder="Ex: 5511999999999"
              />
              <Button
                onClick={onSavePhone}
                loading={savingPhone}
                disabled={
                  !phoneInput.trim() || phoneInput.trim() === lead.phone
                }
              >
                Salvar
              </Button>
            </div>
            <div className="mt-2 text-xs text-neutral-muted">
              {needsManualPhone
                ? "Este contato entrou como @lid na Evolution 1.8. Informe o número real do WhatsApp para liberar respostas."
                : "Você pode salvar só os dígitos ou usar o formato 5511999999999@s.whatsapp.net."}
            </div>
          </div>

          <InfoRow label="Fonte" value={lead.source} />
          <InfoRow
            label="Criado em"
            value={new Date(lead.createdAt).toLocaleDateString("pt-BR")}
          />
          <InfoRow
            label="Último contato"
            value={
              lead.lastContactAt
                ? new Date(lead.lastContactAt).toLocaleDateString("pt-BR")
                : "-"
            }
          />
          <InfoRow
            label="Próximo follow-up"
            value={
              lead.nextFollowUpAt
                ? new Date(lead.nextFollowUpAt).toLocaleString("pt-BR")
                : "-"
            }
          />
          <InfoRow
            label="Follow-ups enviados"
            value={String(lead.followUpCount)}
          />

          {lead.pipelineStage ? (
            <div className="flex justify-between">
              <div className="text-neutral-muted">Estágio</div>
              <div
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getPipelineColorSoftClass(lead.pipelineStage.color)}`}
              >
                {lead.pipelineStage.name}
              </div>
            </div>
          ) : null}
        </div>
      </SectionContainer>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-lg bg-gray-ghost p-3">
      <div className="mb-1 flex items-center gap-1.5 text-neutral-muted">
        {icon}
        <div className="text-xs">{label}</div>
      </div>
      <div className="text-sm font-medium text-neutral-dark">
        {value || "-"}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <div className="text-neutral-muted">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
