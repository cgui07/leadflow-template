"use client";

import type { Column } from "@/types";
import { useFetch } from "@/lib/hooks";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Form, TextField } from "@/components/forms";
import { DataTable } from "@/components/ui/DataTable";
import { normalizeTenantSlug } from "@/lib/tenant-slug";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDeferredValue, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionContainer } from "@/components/layout/SectionContainer";
import {
  Building2,
  Copy,
  KeyRound,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
} from "lucide-react";
import type {
  ActivationLinkSummary,
  CreatePlatformClientResponse,
  PlatformClientAccessState,
  PlatformClientRow,
  PlatformClientsResponse,
  RegenerateActivationLinkResponse,
} from "../contracts";

interface PlatformClientsPageClientProps {
  initialData: PlatformClientsResponse;
}

interface NoticeState {
  tone: "success" | "error";
  message: string;
}

interface ClientFormState {
  name: string;
  slug: string;
  ownerEmail: string;
  expiresInDays: string;
}

interface RegenerateFormState {
  email: string;
  expiresInDays: string;
}

const DEFAULT_CLIENT_FORM: ClientFormState = {
  name: "",
  slug: "",
  ownerEmail: "",
  expiresInDays: "7",
};

const DEFAULT_REGENERATE_FORM: RegenerateFormState = {
  email: "",
  expiresInDays: "7",
};

const accessStateConfig: Record<
  PlatformClientAccessState,
  {
    label: string;
    variant: "default" | "success" | "warning" | "error" | "info" | "purple";
  }
> = {
  pending: { label: "Link pendente", variant: "warning" },
  active: { label: "Ativo", variant: "success" },
  suspended: { label: "Suspenso", variant: "error" },
  setup: { label: "Sem ativacao", variant: "default" },
};

function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "-";
  }

  return new Date(dateValue).toLocaleDateString("pt-BR");
}

function getNoticeClassName(tone: NoticeState["tone"]): string {
  return tone === "success"
    ? "border-green-sage bg-green-pale text-green-forest"
    : "border-red-blush bg-red-pale text-red-dark";
}

export function PlatformClientsPageClient({
  initialData,
}: PlatformClientsPageClientProps) {
  const { data, error, refetch } = useFetch<PlatformClientsResponse>(
    "/api/admin/clients",
    {
      initialData,
      revalidateOnMount: false,
    },
  );
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [activationSummary, setActivationSummary] =
    useState<ActivationLinkSummary | null>(null);
  const [createForm, setCreateForm] =
    useState<ClientFormState>(DEFAULT_CLIENT_FORM);
  const [regenerateForm, setRegenerateForm] = useState<RegenerateFormState>(
    DEFAULT_REGENERATE_FORM,
  );
  const [selectedClient, setSelectedClient] =
    useState<PlatformClientRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [updatingClientId, setUpdatingClientId] = useState<string | null>(null);
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [copiedActivationLink, setCopiedActivationLink] = useState(false);

  const clients = useMemo(() => data?.clients ?? [], [data]);
  const tabs = useMemo(() => {
    const counts = clients.reduce<Record<string, number>>((acc, client) => {
      acc[client.accessState] = (acc[client.accessState] || 0) + 1;
      return acc;
    }, {});

    return [
      { id: "all", label: "Todos", count: clients.length },
      { id: "pending", label: "Pendentes", count: counts.pending || 0 },
      { id: "active", label: "Ativos", count: counts.active || 0 },
      { id: "suspended", label: "Suspensos", count: counts.suspended || 0 },
      { id: "setup", label: "Sem ativação", count: counts.setup || 0 },
    ];
  }, [clients]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus =
        statusFilter === "all" || client.accessState === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        client.name.toLowerCase().includes(normalizedSearch) ||
        client.slug.toLowerCase().includes(normalizedSearch) ||
        (client.ownerEmail ?? "").toLowerCase().includes(normalizedSearch) ||
        (client.activationEmail ?? "").toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [clients, deferredSearch, statusFilter]);

  const columns: Column<PlatformClientRow>[] = [
    {
      key: "name",
      label: "Cliente",
      sortable: true,
      className: "min-w-[220px]",
      render: (_, row) => (
        <div>
          <div className="font-semibold text-neutral-ink">{row.name}</div>
          <div className="text-xs text-neutral-muted">/{row.slug}</div>
        </div>
      ),
    },
    {
      key: "ownerEmail",
      label: "Acesso principal",
      className: "min-w-[220px]",
      render: (_, row) => (
        <div>
          <div className="font-medium text-neutral-dark">
            {row.ownerName || "Aguardando ativacao"}
          </div>
          <div className="text-xs text-neutral-muted">
            {row.ownerEmail || row.activationEmail || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "accessState",
      label: "Status",
      className: "min-w-[190px]",
      render: (_, row) => (
        <div className="space-y-1">
          <Badge
            variant={accessStateConfig[row.accessState].variant}
            size="sm"
            dot
          >
            {accessStateConfig[row.accessState].label}
          </Badge>
          <div className="text-xs text-neutral-muted">
            {row.accessState === "pending"
              ? `Expira em ${formatDate(row.activationExpiresAt)}`
              : row.accessState === "active"
                ? `Ativado em ${formatDate(row.activatedAt)}`
                : row.accessState === "suspended"
                  ? "Login bloqueado ate reativacao"
                  : "Gere um novo link para liberar o acesso"}
          </div>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Criado em",
      sortable: true,
      render: (value) => formatDate(value as string),
    },
    {
      key: "actions",
      label: "Ações",
      className: "min-w-[260px]",
      render: (_, row) => (
        <div className="flex flex-wrap justify-end gap-2">
          {row.usersCount === 0 ? (
            row.activationLink ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Copy className="h-3.5 w-3.5" />}
                onClick={() => void handleCopyLink(row.activationLink!)}
              >
                Copiar link
              </Button>
            ) : null
          ) : null}

          {row.usersCount === 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<KeyRound className="h-3.5 w-3.5" />}
              loading={regenerating && selectedClient?.id === row.id}
              onClick={() => openRegenerateModal(row)}
            >
              {row.activationLink ? "Novo link" : "Gerar link"}
            </Button>
          ) : null}

          <Button
            type="button"
            variant={row.status === "active" ? "ghost" : "outline"}
            size="sm"
            icon={
              row.status === "active" ? (
                <PauseCircle className="h-3.5 w-3.5" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )
            }
            loading={updatingClientId === row.id}
            onClick={() => void handleToggleStatus(row)}
          >
            {row.status === "active" ? "Suspender" : "Reativar"}
          </Button>
        </div>
      ),
    },
  ];

  function resetCreateForm() {
    setCreateForm(DEFAULT_CLIENT_FORM);
    setSlugWasEdited(false);
  }

  function closeCreateModal() {
    if (creating) {
      return;
    }

    resetCreateForm();
    setShowCreateModal(false);
  }

  function closeRegenerateModal() {
    if (regenerating) {
      return;
    }

    setSelectedClient(null);
    setRegenerateForm(DEFAULT_REGENERATE_FORM);
    setShowRegenerateModal(false);
  }

  function openCreateModal() {
    setNotice(null);
    setShowCreateModal(true);
  }

  function openRegenerateModal(client: PlatformClientRow) {
    setNotice(null);
    setSelectedClient(client);
    setRegenerateForm({
      email: client.activationEmail || client.ownerEmail || "",
      expiresInDays: "7",
    });
    setShowRegenerateModal(true);
  }

  function updateCreateField(
    field: keyof ClientFormState,
    value: string,
  ): void {
    if (field === "name") {
      setCreateForm((current) => ({
        ...current,
        name: value,
        slug: slugWasEdited ? current.slug : normalizeTenantSlug(value),
      }));
      return;
    }

    if (field === "slug") {
      setSlugWasEdited(true);
      setCreateForm((current) => ({
        ...current,
        slug: normalizeTenantSlug(value),
      }));
      return;
    }

    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCopyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setNotice({
        tone: "success",
        message: "Link de ativação copiado para a área de transferência.",
      });
    } catch {
      setNotice({
        tone: "error",
        message: "Não foi possível copiar o link automaticamente.",
      });
    }
  }

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setCreating(true);

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          slug: createForm.slug,
          ownerEmail: createForm.ownerEmail,
          expiresInDays: Number(createForm.expiresInDays),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | CreatePlatformClientResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        setNotice({
          tone: "error",
          message:
            payload && "error" in payload && payload.error
              ? payload.error
              : "Não foi possível cadastrar o cliente.",
        });
        return;
      }

      resetCreateForm();
      setShowCreateModal(false);
      setActivationSummary(
        (payload as CreatePlatformClientResponse).activation,
      );
      setCopiedActivationLink(false);
      setNotice({
        tone: "success",
        message:
          "Cliente criado. O link de ativação já está pronto para envio.",
      });
      await refetch();
    } finally {
      setCreating(false);
    }
  }

  async function handleRegenerateLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClient) {
      return;
    }

    setNotice(null);
    setRegenerating(true);

    try {
      const response = await fetch(
        `/api/admin/clients/${selectedClient.id}/activation-link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: regenerateForm.email,
            expiresInDays: Number(regenerateForm.expiresInDays),
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | RegenerateActivationLinkResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        setNotice({
          tone: "error",
          message:
            payload && "error" in payload && payload.error
              ? payload.error
              : "ão foi possível gerar um novo link.",
        });
        return;
      }

      closeRegenerateModal();
      setActivationSummary(
        (payload as RegenerateActivationLinkResponse).activation,
      );
      setCopiedActivationLink(false);
      setNotice({
        tone: "success",
        message: "Novo link de ativação gerado com sucesso.",
      });
      await refetch();
    } finally {
      setRegenerating(false);
    }
  }

  async function handleToggleStatus(client: PlatformClientRow) {
    setNotice(null);
    setUpdatingClientId(client.id);

    try {
      const response = await fetch(`/api/admin/clients/${client.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: client.status === "active" ? "inactive" : "active",
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        client?: PlatformClientRow;
        error?: string;
      } | null;

      if (!response.ok) {
        setNotice({
          tone: "error",
          message: payload?.error || "Não foi possível atualizar o status.",
        });
        return;
      }

      setNotice({
        tone: "success",
        message:
          client.status === "active"
            ? "Cliente suspenso. O login fica bloqueado ate reativação."
            : "Cliente reativado com sucesso.",
      });
      await refetch();
    } finally {
      setUpdatingClientId(null);
    }
  }

  async function handleCopyActivationSummary() {
    if (!activationSummary) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activationSummary.activationLink);
      setCopiedActivationLink(true);
    } catch {
      setNotice({
        tone: "error",
        message: "Não foi possível copiar o link automaticamente.",
      });
    }
  }

  return (
    <PageContainer
      title="Clientes"
      subtitle="Crie o workspace do corretor, gere o link de ativação e controle o acesso mensal."
      actions={
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
          Novo cliente
        </Button>
      }
    >
      {notice ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${getNoticeClassName(notice.tone)}`}
        >
          {notice.message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-blush bg-red-pale px-4 py-3 text-sm text-red-dark">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="w-full max-w-md">
          <TextField
            icon={<Search className="h-4 w-4" />}
            placeholder="Buscar por cliente, slug ou email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <SectionContainer
          title="Carteira de clientes"
          description="Acompanhe quem ja ativou a conta, quem ainda precisa receber o link e quem esta suspenso."
          noPadding
        >
          <Tabs
            tabs={tabs}
            activeTab={statusFilter}
            onTabChange={setStatusFilter}
            className="px-6 pt-2"
          />

          <div className="px-6 pb-6 pt-4">
            {filteredClients.length === 0 && clients.length > 0 ? (
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="Nenhum cliente encontrado"
                description="Ajuste os filtros ou a busca para localizar outro workspace."
              />
            ) : clients.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-6 w-6" />}
                title="Nenhum cliente cadastrado"
                description="Comece criando o primeiro workspace e envie o link de ativacao assim que o pagamento for confirmado."
                action={
                  <Button
                    icon={<Plus className="h-4 w-4" />}
                    onClick={openCreateModal}
                  >
                    Criar primeiro cliente
                  </Button>
                }
              />
            ) : (
              <DataTable columns={columns} data={filteredClients} rowKey="id" />
            )}
          </div>
        </SectionContainer>
      </div>

      <Modal
        open={showCreateModal}
        onClose={closeCreateModal}
        title="Novo cliente"
        description="Crie o workspace do corretor e ja deixe o link de ativação pronto."
        size="md"
      >
        <Form onSubmit={handleCreateClient} className="space-y-4">
          <TextField
            label="Nome do cliente"
            value={createForm.name}
            onChange={(event) => updateCreateField("name", event.target.value)}
            placeholder="Ex: João Silva Imoveis"
            required
          />
          <TextField
            label="Slug do workspace"
            value={createForm.slug}
            onChange={(event) => updateCreateField("slug", event.target.value)}
            placeholder="joão-silva-imoveis"
            hint="Esse identificador ajuda a organizar sua operação."
            required
          />
          <TextField
            label="Email de ativação"
            type="email"
            value={createForm.ownerEmail}
            onChange={(event) =>
              updateCreateField("ownerEmail", event.target.value)
            }
            placeholder="corretor@email.com"
            hint="Esse email fica travado na tela de cadastro do cliente."
            required
          />
          <TextField
            label="Validade do link em dias"
            type="number"
            min={1}
            max={30}
            value={createForm.expiresInDays}
            onChange={(event) =>
              updateCreateField("expiresInDays", event.target.value)
            }
            required
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeCreateModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
              Criar cliente
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={showRegenerateModal}
        onClose={closeRegenerateModal}
        title="Gerar novo link"
        description="Use este fluxo quando o corretor nao ativou a conta a tempo ou quando o email precisa mudar."
        size="md"
      >
        <Form onSubmit={handleRegenerateLink} className="space-y-4">
          <TextField
            label="Email de ativacao"
            type="email"
            value={regenerateForm.email}
            onChange={(event) =>
              setRegenerateForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            required
          />
          <TextField
            label="Validade do novo link em dias"
            type="number"
            min={1}
            max={30}
            value={regenerateForm.expiresInDays}
            onChange={(event) =>
              setRegenerateForm((current) => ({
                ...current,
                expiresInDays: event.target.value,
              }))
            }
            required
          />

          <div className="rounded-xl border border-neutral-border bg-neutral-surface px-4 py-3 text-sm text-neutral-dark">
            O link anterior sera encerrado automaticamente. Assim voce evita
            dois acessos pendentes para o mesmo cliente.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeRegenerateModal}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={regenerating}>
              Gerar link
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={Boolean(activationSummary)}
        onClose={() => {
          setActivationSummary(null);
          setCopiedActivationLink(false);
        }}
        title="Link de ativacao pronto"
        description="Envie esse link ao corretor para que ele conclua o cadastro e defina a senha."
        size="md"
      >
        {activationSummary ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-ice bg-blue-pale px-4 py-4 text-sm text-blue-navy">
              <div className="font-semibold">
                {activationSummary.tenantName}
              </div>
              <div className="mt-1">
                Email liberado: {activationSummary.email}
              </div>
              <div className="mt-1">
                Link válido até {formatDate(activationSummary.expiresAt)}
              </div>
            </div>

            <TextField
              label="Link de ativação"
              value={activationSummary.activationLink}
              readOnly
            />

            <div className="rounded-xl border border-neutral-border bg-neutral-surface px-4 py-4 text-sm text-neutral-dark">
              O corretor vai abrir esse link, criar a senha e entrar como admin
              do proprio workspace. Depois disso, novos acessos devem usar login
              normal ou recuperacao de senha.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActivationSummary(null);
                  setCopiedActivationLink(false);
                }}
              >
                Fechar
              </Button>
              <Button
                type="button"
                icon={<Copy className="h-4 w-4" />}
                onClick={() => void handleCopyActivationSummary()}
              >
                {copiedActivationLink ? "Copiado!" : "Copiar link"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </PageContainer>
  );
}
