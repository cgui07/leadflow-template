"use client";

import Link from "next/link";
import { useFetch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useEffect, useState, use } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { SelectField, TextField } from "@/components/forms";
import { PageContainer } from "@/components/layout/PageContainer";
import { LeadActionsSection } from "./components/LeadActionsSection";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { useFeatureFlag } from "@/components/providers/BrandingProvider";
import {
  getPipelineColorSoftClass,
  getScoreTextClass,
} from "@/lib/ui-colors";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Home,
  Calendar,
  DollarSign,
  Target,
  Clock,
  Send,
} from "lucide-react";

interface LeadDetail {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  score: number;
  source: string;
  value?: number;
  region?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  purpose?: string;
  timeline?: string;
  bedrooms?: number;
  notes?: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  followUpCount: number;
  createdAt: string;
  pipelineStage?: { id: string; name: string; color: string };
  conversation?: {
    id: string;
    status: string;
    messages: Array<{
      id: string;
      direction: string;
      sender: string;
      content: string;
      createdAt: string;
    }>;
  };
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    createdAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    dueAt: string;
  }>;
  leadActions: Array<{
    id: string;
    type: string;
    status: string;
    title: string;
    notes?: string | null;
    origin: string;
    scheduledAt?: string | null;
    reminderAt?: string | null;
    completedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

const statusOptions = [
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Contatado" },
  { value: "qualifying", label: "Qualificando" },
  { value: "qualified", label: "Qualificado" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
  { value: "won", label: "Ganho" },
  { value: "lost", label: "Perdido" },
];

const statusColors: Record<string, string> = {
  new: "bg-info/10 text-info",
  contacted: "bg-gray-ghost text-neutral-dark",
  qualifying: "bg-purple-pale text-secondary",
  qualified: "bg-green-pale text-success",
  proposal: "bg-yellow-pale text-warning",
  negotiation: "bg-orange-pale text-accent",
  won: "bg-green-pale text-green-dark",
  lost: "bg-red-pale text-danger",
};

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: lead, loading, refetch } = useFetch<LeadDetail>(`/api/leads/${id}`);
  const [activeTab, setActiveTab] = useState("profile");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const showLeadActions = useFeatureFlag("leadActions");

  useEffect(() => {
    setPhoneInput(lead?.phone || "");
  }, [lead?.phone]);

  useEffect(() => {
    if (!showLeadActions && activeTab === "actions") {
      setActiveTab("profile");
    }
  }, [activeTab, showLeadActions]);

  if (loading) return <LoadingState variant="skeleton" />;
  if (!lead) {
    return (
      <div className="p-6 text-center text-neutral-muted">
        Lead não encontrado
      </div>
    );
  }

  async function updateStatus(status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refetch();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !lead?.conversation?.id) return;

    setSending(true);
    try {
      await fetch(`/api/conversations/${lead.conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
      setMessage("");
      refetch();
    } finally {
      setSending(false);
    }
  }

  async function savePhone() {
    if (!lead) return;

    const nextPhone = phoneInput.trim();
    if (!nextPhone || nextPhone === lead.phone) return;

    setSavingPhone(true);
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: nextPhone }),
      });
      refetch();
    } finally {
      setSavingPhone(false);
    }
  }

  const scoreColor = getScoreTextClass(lead.score);
  const messages = lead.conversation?.messages?.slice().reverse() || [];
  const needsManualPhone = lead.phone.endsWith("@lid");
  const tabs = [
    { id: "profile", label: "Perfil" },
    showLeadActions
      ? {
          id: "actions",
          label: "Ações",
          count: lead.leadActions.filter((action) => {
            return !["completed", "cancelled"].includes(action.status);
          }).length,
        }
      : null,
    { id: "messages", label: "Mensagens", count: messages.length },
    { id: "activities", label: "Atividades", count: lead.activities.length },
    { id: "tasks", label: "Tarefas", count: lead.tasks.length },
  ].filter(Boolean) as Array<{ id: string; label: string; count?: number }>;

  return (
    <PageContainer
      title=""
      actions={
        <div className="flex gap-2">
          <SelectField
            options={statusOptions}
            value={lead.status}
            onChange={(value) => updateStatus(value)}
            fullWidth={false}
            fieldSize="sm"
          />
          <Button
            variant="danger"
            onClick={async () => {
              if (confirm("Tem certeza que deseja excluir este lead?")) {
                await fetch(`/api/leads/${id}`, { method: "DELETE" });
                router.push("/leads");
              }
            }}
          >
            Excluir
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <Link href="/leads">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
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
                {lead.email && (
                  <div className="flex items-center gap-1">
                    <Mail size={12} />
                    {lead.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-3xl font-bold ${scoreColor}`}>
            {lead.score}
            <div className="inline text-sm font-normal text-neutral-muted">
              /100
            </div>
          </div>
          <div
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[lead.status] || ""} mt-1`}
          >
            {statusOptions.find((status) => status.value === lead.status)?.label}
          </div>
        </div>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "profile" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionContainer title="Perfil do Lead (IA)">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={<MapPin size={16} />} label="Região" value={lead.region} />
              <InfoItem icon={<Home size={16} />} label="Tipo" value={lead.propertyType} />
              <InfoItem
                icon={<DollarSign size={16} />}
                label="Faixa de valor"
                value={
                  lead.priceMax
                    ? `R$ ${Number(lead.priceMin || 0).toLocaleString("pt-BR")} - R$ ${Number(lead.priceMax).toLocaleString("pt-BR")}`
                    : undefined
                }
              />
              <InfoItem icon={<Target size={16} />} label="Finalidade" value={lead.purpose} />
              <InfoItem icon={<Calendar size={16} />} label="Prazo" value={lead.timeline} />
              <InfoItem
                icon={<Home size={16} />}
                label="Quartos"
                value={lead.bedrooms ? `${lead.bedrooms} quartos` : undefined}
              />
            </div>

            {lead.notes && (
              <div className="mt-4 rounded-lg bg-gray-ghost p-3">
                <div className="mb-1 text-xs font-medium text-neutral-muted">
                  Observações da IA
                </div>
                <div className="text-sm text-neutral-dark">{lead.notes}</div>
              </div>
            )}
          </SectionContainer>

          <SectionContainer title="Informações">
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-warning">
                  WhatsApp
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <TextField
                    label={needsManualPhone ? "Telefone real do contato" : "Telefone do contato"}
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Ex: 5511999999999"
                  />
                  <Button
                    onClick={savePhone}
                    loading={savingPhone}
                    disabled={!phoneInput.trim() || phoneInput.trim() === lead.phone}
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

              <div className="flex justify-between">
                <div className="text-neutral-muted">Fonte</div>
                <div className="font-medium">{lead.source}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-neutral-muted">Criado em</div>
                <div className="font-medium">
                  {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="text-neutral-muted">Último contato</div>
                <div className="font-medium">
                  {lead.lastContactAt
                    ? new Date(lead.lastContactAt).toLocaleDateString("pt-BR")
                    : "-"}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="text-neutral-muted">Próximo follow-up</div>
                <div className="font-medium">
                  {lead.nextFollowUpAt
                    ? new Date(lead.nextFollowUpAt).toLocaleString("pt-BR")
                    : "-"}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="text-neutral-muted">Follow-ups enviados</div>
                <div className="font-medium">{lead.followUpCount}</div>
              </div>

              {lead.pipelineStage && (
                <div className="flex justify-between">
                  <div className="text-neutral-muted">Estágio</div>
                  <div
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getPipelineColorSoftClass(lead.pipelineStage.color)}`}
                  >
                    {lead.pipelineStage.name}
                  </div>
                </div>
              )}
            </div>
          </SectionContainer>
        </div>
      )}

      {showLeadActions && activeTab === "actions" && (
        <LeadActionsSection
          leadId={lead.id}
          actions={lead.leadActions}
          onRefetch={refetch}
        />
      )}

      {activeTab === "messages" && (
        <SectionContainer title="Conversa">
          <div className="mb-4 h-96 space-y-3 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-sm text-neutral-muted">
                Nenhuma mensagem ainda
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.direction === "outbound"
                        ? "bg-primary text-white"
                        : "bg-gray-ghost text-neutral-ink"
                    }`}
                  >
                    <div className="mb-0.5 text-[10px] font-semibold opacity-70">
                      {msg.sender === "bot"
                        ? "Bot"
                        : msg.sender === "agent"
                          ? "Você"
                          : "Cliente"}
                    </div>
                    <div>{msg.content}</div>
                    <div className="mt-1 text-[10px] opacity-50">
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2">
            <TextField
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite uma mensagem..."
            />
            <Button
              type="submit"
              loading={sending}
              icon={<Send className="h-4 w-4" />}
            >
              Enviar
            </Button>
          </form>
        </SectionContainer>
      )}

      {activeTab === "activities" && (
        <SectionContainer title="Histórico de Atividades">
          {lead.activities.length === 0 ? (
            <div className="text-sm text-neutral-muted">
              Nenhuma atividade registrada
            </div>
          ) : (
            <div className="space-y-3">
              {lead.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 border-b border-gray-ghost pb-3 text-sm"
                >
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="font-medium text-neutral-dark">
                      {activity.title}
                    </div>
                    {activity.description && (
                      <div className="mt-0.5 text-xs text-neutral-muted">
                        {activity.description}
                      </div>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-xs text-neutral-muted">
                    {new Date(activity.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionContainer>
      )}

      {activeTab === "tasks" && (
        <SectionContainer title="Tarefas Pendentes">
          {lead.tasks.length === 0 ? (
            <div className="text-sm text-neutral-muted">
              Nenhuma tarefa pendente
            </div>
          ) : (
            <div className="space-y-2">
              {lead.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-neutral-border p-3"
                >
                  <Clock size={16} className="text-neutral-muted" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-dark">
                      {task.title}
                    </div>
                    <div className="text-xs text-neutral-muted">
                      {new Date(task.dueAt).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(task.dueAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">
                    {task.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </SectionContainer>
      )}
    </PageContainer>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-lg bg-gray-ghost p-3">
      <div className="mb-1 flex items-center gap-1.5 text-neutral-muted">
        {icon}
        <div className="text-xs">{label}</div>
      </div>
      <div className="text-sm font-medium text-neutral-dark">{value || "-"}</div>
    </div>
  );
}
