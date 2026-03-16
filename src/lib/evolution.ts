const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";

export function instanceNameForUser(userId: string) {
  return `lf-${userId}`;
}

async function evolutionFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${EVOLUTION_API_URL}${path}`, {
    ...options,
    headers: {
      apikey: EVOLUTION_API_KEY,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const text = await res.text();
  let data: T;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text } as T;
  }

  if (!res.ok) {
    console.error(`[evolution] ${path} error:`, data);
    const msg =
      (data as Record<string, unknown>)?.message ||
      ((data as Record<string, unknown>)?.response as Record<string, unknown>)?.message;
    throw new Error((msg as string) || `Evolution API error: ${res.status}`);
  }

  return data;
}

export function getEvolutionApiKey() {
  return EVOLUTION_API_KEY;
}

export function resolveAppUrl(fallbackOrigin?: string) {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || fallbackOrigin;

  if (!appUrl) {
    throw new Error("APP_URL não configurada para o webhook do WhatsApp");
  }

  return appUrl.replace(/\/+$/, "");
}

export function buildWebhookUrl(appUrl: string, webhookToken: string) {
  const url = new URL("/api/whatsapp/webhook", appUrl);
  url.searchParams.set("token", webhookToken);
  return url.toString();
}

interface CreateInstanceResult {
  instance: { instanceName: string; status: string };
  qrcode?: { base64: string; code: string };
}

export async function createInstance(userId: string): Promise<{ instanceName: string; qrcode: string | null }> {
  const instanceName = instanceNameForUser(userId);

  const data = await evolutionFetch<CreateInstanceResult>("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });

  return {
    instanceName,
    qrcode: data.qrcode?.base64 || null,
  };
}

export async function setInstanceWebhook(instanceName: string, webhookUrl: string) {
  return evolutionFetch(`/webhook/set/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: true,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      },
    }),
  });
}

interface ConnectResult {
  base64?: string;
  code?: string;
  pairingCode?: string;
}

export async function getQrCode(instanceName: string): Promise<string | null> {
  const data = await evolutionFetch<ConnectResult>(`/instance/connect/${instanceName}`);
  return data.base64 || null;
}

interface ConnectionStateResult {
  instance?: { state?: string; instanceName?: string };
  state?: string;
}

export type WhatsAppConnectionStatus = "disconnected" | "connecting" | "connected";

export function mapEvolutionState(state: string | undefined): WhatsAppConnectionStatus {
  switch (state) {
    case "open":
      return "connected";
    case "connecting":
      return "connecting";
    case "close":
    default:
      return "disconnected";
  }
}

export async function getConnectionStatus(instanceName: string): Promise<WhatsAppConnectionStatus> {
  try {
    const data = await evolutionFetch<ConnectionStateResult>(
      `/instance/connectionState/${instanceName}`
    );
    const state = data.instance?.state || data.state;
    return mapEvolutionState(state);
  } catch {
    return "disconnected";
  }
}

export async function logoutInstance(instanceName: string) {
  return evolutionFetch(`/instance/logout/${instanceName}`, { method: "DELETE" });
}

export async function deleteInstance(instanceName: string) {
  return evolutionFetch(`/instance/delete/${instanceName}`, { method: "DELETE" });
}
