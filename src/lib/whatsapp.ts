import { prisma } from "./db";
import { getEvolutionApiKey } from "./evolution";
import { getDefaultPipelineStageId } from "./pipeline";
import type { Prisma } from "@/generated/prisma/client";

interface WhatsAppConfig {
  phoneId: string;
  token: string;
}

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";

export function getWhatsAppConfig(instanceName: string): WhatsAppConfig {
  return { phoneId: instanceName, token: getEvolutionApiKey() };
}
const LID_SUFFIX = "@lid";
const PHONE_NUMBER_JID_SUFFIX = "@s.whatsapp.net";
const lidToPnCache = new Map<string, string>();

type MaybeJid = string | null | undefined;

interface LidMappingEvent {
  key?: {
    remoteJid?: string;
    remoteJidAlt?: string;
    participant?: string;
    participantAlt?: string;
    senderPn?: string;
    participantPn?: string;
  };
  remoteJid?: string;
  remoteJidAlt?: string;
  participant?: string;
  participantAlt?: string;
  senderPn?: string;
  participantPn?: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const GROUP_JID_SUFFIX = "@g.us";

function isGroupJid(value: MaybeJid) {
  return isNonEmptyString(value) && value.endsWith(GROUP_JID_SUFFIX);
}

function isLidJid(value: MaybeJid) {
  return isNonEmptyString(value) && value.endsWith(LID_SUFFIX);
}

function isPhoneNumberJid(value: MaybeJid) {
  return isNonEmptyString(value) && value.endsWith(PHONE_NUMBER_JID_SUFFIX);
}

function toPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePhoneNumberJid(value: MaybeJid): string | null {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const candidate = value.trim();

  if (isPhoneNumberJid(candidate)) {
    return candidate;
  }

  if (isLidJid(candidate)) {
    return lidToPnCache.get(candidate) || null;
  }

  if (candidate.includes("@")) {
    return null;
  }

  const digits = toPhoneDigits(candidate);
  return digits ? `${digits}${PHONE_NUMBER_JID_SUFFIX}` : null;
}

function getPhoneIdentity(value: MaybeJid) {
  if (!isNonEmptyString(value)) {
    return "";
  }

  const candidate = value.trim();

  if (isPhoneNumberJid(candidate)) {
    return candidate.slice(0, -PHONE_NUMBER_JID_SUFFIX.length);
  }

  return candidate;
}

function toEvolutionNumber(value: MaybeJid) {
  const resolvedJid = resolveReplyJid(value);
  if (!resolvedJid) {
    return null;
  }

  const digits = toPhoneDigits(getPhoneIdentity(resolvedJid));
  return digits || null;
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

function toInputJsonValue(value: Record<string, unknown> | undefined) {
  return value as Prisma.InputJsonValue | undefined;
}

function getMappingCandidates(event: LidMappingEvent) {
  const key = event.key || {};

  const lidCandidates = [
    key.remoteJid,
    key.participant,
    event.remoteJid,
    event.participant,
  ].filter((candidate): candidate is string => isLidJid(candidate));

  const phoneCandidates = [
    key.remoteJidAlt,
    key.participantAlt,
    key.senderPn,
    key.participantPn,
    event.remoteJidAlt,
    event.participantAlt,
    event.senderPn,
    event.participantPn,
  ]
    .map((candidate) => normalizePhoneNumberJid(candidate))
    .filter((candidate): candidate is string => isPhoneNumberJid(candidate));

  return { lidCandidates, phoneCandidates };
}

export function rememberMapping(event: LidMappingEvent | null | undefined) {
  if (!event) {
    return null;
  }

  const key = event.key || {};
  const { lidCandidates, phoneCandidates } = getMappingCandidates(event);
  const pnJid = phoneCandidates[0];

  if (!pnJid || lidCandidates.length === 0) {
    if (lidCandidates.length > 0) {
      console.warn(
        "[whatsapp] LID event received without PN mapping fields:",
        JSON.stringify({
          remoteJid: key.remoteJid ?? event.remoteJid ?? null,
          remoteJidAlt: key.remoteJidAlt ?? event.remoteJidAlt ?? null,
          participant: key.participant ?? event.participant ?? null,
          participantAlt: key.participantAlt ?? event.participantAlt ?? null,
          senderPn: key.senderPn ?? event.senderPn ?? null,
          participantPn: key.participantPn ?? event.participantPn ?? null,
        })
      );
    }

    return null;
  }

  for (const lid of lidCandidates) {
    const previous = lidToPnCache.get(lid);
    lidToPnCache.set(lid, pnJid);

    if (previous !== pnJid) {
      console.log("[whatsapp] Stored LID mapping", lid, "->", pnJid);
    }
  }

  return { lid: lidCandidates[0], pnJid };
}

export { isGroupJid };

export function resolveReplyJid(remoteJid: MaybeJid) {
  return normalizePhoneNumberJid(remoteJid);
}

export function resolveSendTarget(...candidates: MaybeJid[]) {
  for (const candidate of candidates) {
    const resolved = resolveReplyJid(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return null;
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
  console.log("[whatsapp] Sending outbound message", JSON.stringify({ to, resolvedTo, evolutionNumber }));

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
    console.error("WhatsApp send error:", data);
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
  console.log("[whatsapp] Sending media", JSON.stringify({ to, resolvedTo, mediaType }));

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
    console.error("WhatsApp media send error:", data);
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
  console.log("[whatsapp] Sending voice PTT", JSON.stringify({ to, resolvedTo }));

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
    console.error("WhatsApp audio PTT send error:", data);
    const message =
      typeof data === "object" && data && "message" in data && typeof data.message === "string"
        ? data.message
        : "Failed to send WhatsApp audio PTT";
    throw new Error(message);
  }

  return data;
}

export async function sendAndSaveAudioPTT(
  config: WhatsAppConfig,
  conversationId: string,
  recipient: string,
  textContent: string,
  base64Audio: string,
  sender: "bot" | "agent",
) {
  let replyJid = resolveReplyJid(recipient);

  if (!replyJid) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        whatsappChatId: true,
        lead: { select: { phone: true } },
      },
    });

    replyJid = resolveSendTarget(
      recipient,
      conversation?.whatsappChatId,
      conversation?.lead?.phone,
    );
  }

  if (!replyJid) {
    console.warn("[whatsapp] Skipping audio PTT because recipient could not be resolved:", recipient);
    return null;
  }

  const waResponse = await sendWhatsAppAudioPTT(config, replyJid, base64Audio);
  const waData = waResponse as Record<string, unknown>;
  const waMessageId =
    (waData.key as Record<string, unknown>)?.id ??
    (waData.messages as Array<Record<string, unknown>>)?.[0]?.id;

  const message = await prisma.message.create({
    data: {
      conversationId,
      direction: "outbound",
      sender,
      content: textContent,
      type: "audio",
      status: "sent",
      whatsappMsgId: waMessageId as string | undefined,
      metadata: toInputJsonValue({ sentAsVoice: true, voiceProvider: "elevenlabs" }),
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return message;
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

export async function processIncomingMessage(userId: string, message: {
  from: string;
  id: string;
  text?: string;
  type: string;
  timestamp: string;
  pushName?: string;
  metadata?: Record<string, unknown>;
}) {
  const remoteJid = message.from;
  const resolvedReplyJid = resolveReplyJid(remoteJid);
  const phone = resolvedReplyJid
    ? getPhoneIdentity(resolvedReplyJid)
    : toPhoneDigits(remoteJid) || remoteJid;
  const contactName = message.pushName || phone;
  const content = message.text || "";

  let lead = await prisma.lead.findFirst({
    where: { userId, conversation: { whatsappChatId: remoteJid } },
    include: { conversation: true },
  });

  if (!lead && resolvedReplyJid) {
    lead = await prisma.lead.findFirst({
      where: { userId, phone },
      include: { conversation: true },
    });
  }

  if (!lead) {
    const defaultPipelineStageId = await getDefaultPipelineStageId(userId);

    lead = await prisma.lead.create({
      data: {
        userId,
        name: contactName,
        phone,
        source: "whatsapp",
        status: "new",
        pipelineStageId: defaultPipelineStageId,
        conversation: { create: { whatsappChatId: remoteJid } },
      },
      include: { conversation: true },
    });

    await prisma.activity.create({
      data: {
        userId,
        leadId: lead.id,
        type: "message",
        title: "Novo lead via WhatsApp",
        description: `${contactName} enviou a primeira mensagem`,
      },
    });
  }

  const conversation = lead.conversation!;

  if (resolvedReplyJid) {
    const updates: Array<Promise<unknown>> = [];

    if (lead.phone !== phone) {
      updates.push(
        prisma.lead.update({
          where: { id: lead.id },
          data: { phone },
        })
      );
    }

    if (conversation.whatsappChatId !== remoteJid) {
      updates.push(
        prisma.conversation.update({
          where: { id: conversation.id },
          data: { whatsappChatId: remoteJid },
        })
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }

  if (message.id) {
    const existing = await prisma.message.findFirst({
      where: { conversationId: conversation.id, whatsappMsgId: message.id },
    });
    if (existing) {
      return { lead, conversation, message: existing };
    }
  }

  const savedMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      sender: "lead",
      content,
      type: message.type === "conversation" || message.type === "extendedTextMessage" ? "text" : message.type,
      status: "delivered",
      whatsappMsgId: message.id,
      metadata: toInputJsonValue(message.metadata),
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
      status: conversation.status === "closed" ? "active" : conversation.status,
    },
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      lastContactAt: new Date(),
      followUpCount: 0,
    },
  });

  return { lead, conversation, message: savedMessage };
}

export async function sendAndSaveMessage(
  config: WhatsAppConfig,
  conversationId: string,
  recipient: string,
  content: string,
  sender: "bot" | "agent",
  media?: {
    type: "image" | "video" | "audio" | "document";
    url: string;
    caption?: string;
    fileName?: string;
    mimetype?: string;
  }
) {
  let replyJid = resolveReplyJid(recipient);

  if (!replyJid) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        whatsappChatId: true,
        lead: {
          select: {
            phone: true,
          },
        },
      },
    });

    replyJid = resolveSendTarget(
      recipient,
      conversation?.whatsappChatId,
      conversation?.lead?.phone
    );
  }

  if (!replyJid) {
    console.warn("[whatsapp] Skipping outbound message because recipient could not be resolved:", recipient);
    return null;
  }

  let waResponse;
  if (media) {
    waResponse = await sendWhatsAppMedia(config, replyJid, media.type, media.url, {
      caption: media.caption || content,
      fileName: media.fileName,
      mimetype: media.mimetype,
    });
  } else {
    waResponse = await sendWhatsAppMessage(config, replyJid, content);
  }
  const waMessageId = waResponse.key?.id ?? waResponse.messages?.[0]?.id;

  const message = await prisma.message.create({
    data: {
      conversationId,
      direction: "outbound",
      sender,
      content: media?.caption || content,
      type: media?.type || "text",
      status: "sent",
      whatsappMsgId: waMessageId,
      metadata: toInputJsonValue(
        media
          ? {
              mediaUrl: media.url,
              mimetype: media.mimetype,
              fileName: media.fileName,
            }
          : undefined,
      ),
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return message;
}
