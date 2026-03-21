"use client";

import { useFetch } from "@/lib/hooks";
import { normalizeTenantSlug } from "@/lib/tenant-slug";
import { useDeferredValue, useMemo, useState } from "react";
import type {
  ActivationLinkSummary,
  CreatePlatformClientResponse,
  PlatformClientRow,
  PlatformClientsResponse,
  RegenerateActivationLinkResponse,
} from "../contracts";

export interface NoticeState {
  tone: "success" | "error";
  message: string;
}

export interface ClientFormState {
  name: string;
  slug: string;
  ownerEmail: string;
  expiresInDays: string;
}

export interface RegenerateFormState {
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

export function usePlatformClients(initialData: PlatformClientsResponse) {
  const { data, error, refetch } = useFetch<PlatformClientsResponse>(
    "/api/admin/clients",
    { initialData, revalidateOnMount: false },
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
  const [deletingClient, setDeletingClient] = useState<PlatformClientRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  function resetCreateForm() {
    setCreateForm(DEFAULT_CLIENT_FORM);
    setSlugWasEdited(false);
  }

  function closeCreateModal() {
    if (creating) return;
    resetCreateForm();
    setShowCreateModal(false);
  }

  function closeRegenerateModal() {
    if (regenerating) return;
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

  function updateCreateField(field: keyof ClientFormState, value: string): void {
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

    setCreateForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCopyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setNotice({ tone: "success", message: "Link de ativação copiado para a área de transferência." });
    } catch {
      setNotice({ tone: "error", message: "Não foi possível copiar o link automaticamente." });
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
      setActivationSummary((payload as CreatePlatformClientResponse).activation);
      setCopiedActivationLink(false);
      setNotice({ tone: "success", message: "Cliente criado. O link de ativação já está pronto para envio." });
      await refetch();
    } finally {
      setCreating(false);
    }
  }

  async function handleRegenerateLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient) return;

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
              : "Não foi possível gerar um novo link.",
        });
        return;
      }

      closeRegenerateModal();
      setActivationSummary((payload as RegenerateActivationLinkResponse).activation);
      setCopiedActivationLink(false);
      setNotice({ tone: "success", message: "Novo link de ativação gerado com sucesso." });
      await refetch();
    } finally {
      setRegenerating(false);
    }
  }

  async function handleDeleteClient() {
    if (!deletingClient) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/clients/${deletingClient.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setNotice({
          tone: "error",
          message: payload?.error || "Não foi possível excluir o cliente.",
        });
        return;
      }

      setDeletingClient(null);
      setNotice({ tone: "success", message: "Cliente excluído permanentemente." });
      await refetch();
    } finally {
      setIsDeleting(false);
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
        setNotice({ tone: "error", message: payload?.error || "Não foi possível atualizar o status." });
        return;
      }

      setNotice({
        tone: "success",
        message:
          client.status === "active"
            ? "Cliente suspenso. O login fica bloqueado até a reativação."
            : "Cliente reativado com sucesso.",
      });
      await refetch();
    } finally {
      setUpdatingClientId(null);
    }
  }

  async function handleCopyActivationSummary() {
    if (!activationSummary) return;

    try {
      await navigator.clipboard.writeText(activationSummary.activationLink);
      setCopiedActivationLink(true);
    } catch {
      setNotice({ tone: "error", message: "Não foi possível copiar o link automaticamente." });
    }
  }

  function closeActivationSummary() {
    setActivationSummary(null);
    setCopiedActivationLink(false);
  }

  return {
    clients,
    tabs,
    filteredClients,
    error,
    notice,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    showCreateModal,
    showRegenerateModal,
    activationSummary,
    createForm,
    regenerateForm,
    setRegenerateForm,
    selectedClient,
    creating,
    regenerating,
    isDeleting,
    deletingClient,
    setDeletingClient,
    updatingClientId,
    copiedActivationLink,
    openCreateModal,
    closeCreateModal,
    openRegenerateModal,
    closeRegenerateModal,
    closeActivationSummary,
    updateCreateField,
    handleCopyLink,
    handleCreateClient,
    handleRegenerateLink,
    handleDeleteClient,
    handleToggleStatus,
    handleCopyActivationSummary,
  };
}
