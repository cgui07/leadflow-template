import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { parseEvolutionWebhook } from "./webhook-parser";
import { resolveReplyJid, toEvolutionNumber } from "@/lib/whatsapp-resolve";
import type {
  WhatsAppProvider,
  ConnectionOptions,
  ConnectionResult,
  ConnectionInfo,
  ConnectionState,
  SendTextPayload,
  SendMediaPayload,
  SendAudioPTTPayload,
  SendResult,
  PresenceType,
  WhatsAppEvent,
} from "../types";

// ─── Evolution API HTTP client ───

const API_URL = env.EVOLUTION_API_URL;
const API_KEY = env.EVOLUTION_API_KEY;

async function evolutionFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      apikey: API_KEY,
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
    logger.error("Evolution API error", { path, data: JSON.stringify(data).substring(0, 300) });
    const msg =
      (data as Record<string, unknown>)?.message ||
      ((data as Record<string, unknown>)?.response as Record<string, unknown>)?.message;
    throw new Error((msg as string) || `Evolution API error: ${res.status}`);
  }

  return data;
}

function parseJsonResponse(raw: string) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function resolveAndConvert(to: string): string {
  const resolved = resolveReplyJid(to);
  if (!resolved) throw new Error(`Cannot resolve WhatsApp recipient JID: ${to}`);

  const number = toEvolutionNumber(resolved);
  if (!number) throw new Error(`Cannot convert to Evolution number: ${resolved}`);

  return number;
}

function extractMessageId(data: unknown): string | undefined {
  const obj = data as Record<string, unknown>;
  return (
    (obj?.key as Record<string, unknown>)?.id ??
    (obj?.messages as Array<Record<string, unknown>>)?.[0]?.id
  ) as string | undefined;
}

// ─── Evolution State Mapping ───

function mapEvolutionState(state: string | undefined): ConnectionState {
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

// ─── EvolutionProvider ───

export class EvolutionProvider implements WhatsAppProvider {
  readonly providerType = "evolution" as const;

  instanceIdForUser(userId: string): string {
    return `lf-${userId}`;
  }

  // ─── Connection ───

  async createConnection(userId: string, options: ConnectionOptions): Promise<ConnectionResult> {
    const instanceId = this.instanceIdForUser(userId);
    const useQrCode = options.method === "qrcode";

    // Clean up any existing instance
    try { await this.disconnect(instanceId); } catch { /* ignore */ }

    // Create instance
    let qrCode: string | null = null;
    try {
      const result = await evolutionFetch<{
        instance: { instanceName: string };
        qrcode?: { base64: string };
      }>("/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName: instanceId,
          qrcode: useQrCode,
          integration: "WHATSAPP-BAILEYS",
        }),
      });
      qrCode = result.qrcode?.base64 || null;
    } catch (err) {
      // Instance may already exist
      if (!(err instanceof Error) || !/exists|already/i.test(err.message)) {
        throw err;
      }
    }

    // Configure webhook
    await this.setWebhook(instanceId, options.webhookUrl);

    // Get QR if not returned from create
    if (useQrCode && !qrCode) {
      qrCode = await this.getQrCode(instanceId);
    }

    // Get pairing code if requested
    let pairingCode: string | null = null;
    if (options.method === "pairing-code" && options.phoneNumber) {
      const data = await evolutionFetch<{ pairingCode?: string }>(
        `/instance/connect/${instanceId}?number=${encodeURIComponent(options.phoneNumber)}`,
      );
      pairingCode = data.pairingCode || null;
    }

    return {
      status: "connecting",
      instanceId,
      qrCode,
      pairingCode,
    };
  }

  async getConnectionStatus(instanceId: string): Promise<ConnectionInfo> {
    try {
      const data = await evolutionFetch<{
        instance?: { state?: string };
        state?: string;
      }>(`/instance/connectionState/${instanceId}`);
      const state = data.instance?.state || data.state;
      return { state: mapEvolutionState(state), instanceId };
    } catch {
      return { state: "disconnected", instanceId };
    }
  }

  async disconnect(instanceId: string): Promise<void> {
    try { await evolutionFetch(`/instance/logout/${instanceId}`, { method: "DELETE" }); } catch { /* ignore */ }
    try { await evolutionFetch(`/instance/delete/${instanceId}`, { method: "DELETE" }); } catch { /* ignore */ }
  }

  // ─── Messaging ───

  async sendText(instanceId: string, payload: SendTextPayload): Promise<SendResult> {
    const number = resolveAndConvert(payload.to);

    const res = await fetch(`${API_URL}/message/sendText/${instanceId}`, {
      method: "POST",
      headers: { apikey: API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ number, text: payload.text }),
    });

    const data = parseJsonResponse(await res.text());

    if (!res.ok) {
      const message = data?.message || "Failed to send WhatsApp message";
      return { success: false, error: message };
    }

    return { success: true, providerMessageId: extractMessageId(data) };
  }

  async sendMedia(instanceId: string, payload: SendMediaPayload): Promise<SendResult> {
    const number = resolveAndConvert(payload.to);

    const body: Record<string, unknown> = {
      number,
      mediatype: payload.type,
      media: payload.url,
    };
    if (payload.caption) body.caption = payload.caption;
    if (payload.fileName) body.fileName = payload.fileName;
    if (payload.mimetype) body.mimetype = payload.mimetype;

    const res = await fetch(`${API_URL}/message/sendMedia/${instanceId}`, {
      method: "POST",
      headers: { apikey: API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = parseJsonResponse(await res.text());

    if (!res.ok) {
      const message = data?.message || "Failed to send WhatsApp media";
      return { success: false, error: message };
    }

    return { success: true, providerMessageId: extractMessageId(data) };
  }

  async sendAudioPTT(instanceId: string, payload: SendAudioPTTPayload): Promise<SendResult> {
    const number = resolveAndConvert(payload.to);

    const res = await fetch(`${API_URL}/message/sendWhatsAppAudio/${instanceId}`, {
      method: "POST",
      headers: { apikey: API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ number, audio: payload.audioBase64, encoding: true }),
    });

    const data = parseJsonResponse(await res.text());

    if (!res.ok) {
      const message = data?.message || "Failed to send WhatsApp audio PTT";
      return { success: false, error: message };
    }

    return { success: true, providerMessageId: extractMessageId(data) };
  }

  async sendPresence(instanceId: string, to: string, type: PresenceType): Promise<void> {
    const resolved = resolveReplyJid(to);
    if (!resolved) return;
    const number = toEvolutionNumber(resolved);
    if (!number) return;

    try {
      await fetch(`${API_URL}/chat/updatePresence/${instanceId}`, {
        method: "POST",
        headers: { apikey: API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ number, presence: type }),
      });
    } catch {
      // Presence updates are non-critical
    }
  }

  async markAsRead(instanceId: string, messageId: string): Promise<void> {
    await fetch(`${API_URL}/chat/markMessageAsRead/${instanceId}`, {
      method: "PUT",
      headers: { apikey: API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ readMessages: [{ id: messageId }] }),
    });
  }

  // ─── Webhook ───

  parseWebhook(body: unknown): WhatsAppEvent | null {
    return parseEvolutionWebhook(body);
  }

  // ─── Helpers (Evolution-specific, exposed for connect route) ───

  async getQrCode(instanceId: string): Promise<string | null> {
    const data = await evolutionFetch<{ base64?: string }>(`/instance/connect/${instanceId}`);
    return data.base64 || null;
  }

  async setWebhook(instanceId: string, webhookUrl: string): Promise<void> {
    await evolutionFetch(`/webhook/set/${instanceId}`, {
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
}
