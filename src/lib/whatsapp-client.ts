import { getEvolutionApiKey } from "./evolution";
import { env } from "./env";
import { resolveReplyJid, toEvolutionNumber } from "./whatsapp-resolve";

export interface WhatsAppConfig {
  phoneId: string;
  token: string;
}

const EVOLUTION_API_URL = env.EVOLUTION_API_URL;

export function getWhatsAppConfig(instanceName: string): WhatsAppConfig {
  return { phoneId: instanceName, token: getEvolutionApiKey() };
}

function parseJsonResponse(raw: string) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

export async function sendPresenceUpdate(
  config: WhatsAppConfig,
  to: string,
  presence: "composing" | "recording",
) {
  const resolvedTo = resolveReplyJid(to);
  if (!resolvedTo) return;

  const evolutionNumber = toEvolutionNumber(resolvedTo);
  if (!evolutionNumber) return;

  const url = `${EVOLUTION_API_URL}/chat/updatePresence/${config.phoneId}`;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        apikey: config.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: evolutionNumber,
        presence,
      }),
    });
  } catch {
    // Presence updates are non-critical
  }
}

export async function sendWhatsAppMessage(config: WhatsAppConfig, to: string, text: string) {
  const resolvedTo = resolveReplyJid(to);
  if (!resolvedTo) {
    throw new Error(`Cannot resolve WhatsApp recipient JID: ${to}`);
  }

  const evolutionNumber = toEvolutionNumber(resolvedTo);
  if (!evolutionNumber) {
    throw new Error(`Cannot convert WhatsApp recipient into Evolution number: ${resolvedTo}`);
  }

  const url = `${EVOLUTION_API_URL}/message/sendText/${config.phoneId}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: config.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      number: evolutionNumber,
      text,
    }),
  });

  const raw = await res.text();
  const data = parseJsonResponse(raw);

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data && typeof data.message === "string"
        ? data.message
        : "Failed to send WhatsApp message";
    throw new Error(message);
  }

  return data;
}

export async function sendWhatsAppMedia(
  config: WhatsAppConfig,
  to: string,
  mediaType: "image" | "video" | "audio" | "document",
  mediaUrl: string,
  options?: { caption?: string; fileName?: string; mimetype?: string }
) {
  const resolvedTo = resolveReplyJid(to);
  if (!resolvedTo) {
    throw new Error(`Cannot resolve WhatsApp recipient JID: ${to}`);
  }

  const evolutionNumber = toEvolutionNumber(resolvedTo);
  if (!evolutionNumber) {
    throw new Error(`Cannot convert WhatsApp recipient into Evolution number: ${resolvedTo}`);
  }

  const url = `${EVOLUTION_API_URL}/message/sendMedia/${config.phoneId}`;

  const body: Record<string, unknown> = {
    number: evolutionNumber,
    mediatype: mediaType,
    media: mediaUrl,
  };

  if (options?.caption) body.caption = options.caption;
  if (options?.fileName) body.fileName = options.fileName;
  if (options?.mimetype) body.mimetype = options.mimetype;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: config.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  const data = parseJsonResponse(raw);

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data && typeof data.message === "string"
        ? data.message
        : "Failed to send WhatsApp media";
    throw new Error(message);
  }

  return data;
}

export async function sendWhatsAppAudioPTT(
  config: WhatsAppConfig,
  to: string,
  base64Audio: string,
): Promise<unknown> {
  const resolvedTo = resolveReplyJid(to);
  if (!resolvedTo) {
    throw new Error(`Cannot resolve WhatsApp recipient JID: ${to}`);
  }

  const evolutionNumber = toEvolutionNumber(resolvedTo);
  if (!evolutionNumber) {
    throw new Error(`Cannot convert WhatsApp recipient into Evolution number: ${resolvedTo}`);
  }

  const url = `${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${config.phoneId}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: config.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      number: evolutionNumber,
      audio: base64Audio,
      encoding: true,
    }),
  });

  const raw = await res.text();
  const data = parseJsonResponse(raw);

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data && typeof data.message === "string"
        ? data.message
        : "Failed to send WhatsApp audio PTT";
    throw new Error(message);
  }

  return data;
}

export async function markAsRead(config: WhatsAppConfig, messageId: string) {
  const url = `${EVOLUTION_API_URL}/chat/markMessageAsRead/${config.phoneId}`;

  await fetch(url, {
    method: "PUT",
    headers: {
      apikey: config.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      readMessages: [{ id: messageId }],
    }),
  });
}
