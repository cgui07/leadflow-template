import { isGroupJid } from "@/lib/whatsapp-jid";
import { rememberMapping } from "@/lib/whatsapp-mapping";
import type {
  WhatsAppEvent,
  IncomingMessageEvent,
  ConnectionChangedEvent,
  ConnectionState,
} from "../types";

const INBOUND_MESSAGE_EVENTS = new Set(["messages.upsert", "MESSAGES_UPSERT"]);

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

function parseMessageContent(message: Record<string, unknown>): {
  text: string;
  mediaType?: string;
  mediaMetadata?: Record<string, unknown>;
} {
  if (!message) return { text: "" };

  const msg = message as Record<string, Record<string, unknown>>;

  if (msg.conversation) {
    return { text: msg.conversation as unknown as string };
  }

  if (msg.extendedTextMessage?.text) {
    return { text: msg.extendedTextMessage.text as string };
  }

  if (msg.audioMessage) {
    const audio = msg.audioMessage;
    return {
      text: "[Áudio recebido]",
      mediaType: "audio",
      mediaMetadata: {
        mediaUrl: audio.url,
        mimetype: audio.mimetype,
        seconds: audio.seconds,
        fileLength: audio.fileLength,
        base64: audio.base64 || (message as Record<string, unknown>).base64,
      },
    };
  }

  if (msg.imageMessage) {
    const image = msg.imageMessage;
    return {
      text: (image.caption as string) || "[Imagem recebida]",
      mediaType: "image",
      mediaMetadata: {
        mediaUrl: image.url,
        mimetype: image.mimetype,
        caption: image.caption,
        width: image.width,
        height: image.height,
        base64: image.base64 || (message as Record<string, unknown>).base64,
      },
    };
  }

  if (msg.videoMessage) {
    const video = msg.videoMessage;
    return {
      text: (video.caption as string) || "[Vídeo recebido]",
      mediaType: "video",
      mediaMetadata: {
        mediaUrl: video.url,
        mimetype: video.mimetype,
        caption: video.caption,
        seconds: video.seconds,
        base64: video.base64 || (message as Record<string, unknown>).base64,
      },
    };
  }

  if (msg.documentMessage) {
    const doc = msg.documentMessage;
    const fileName = (doc.fileName as string) || "documento";
    return {
      text: `[Documento: ${fileName}]`,
      mediaType: "document",
      mediaMetadata: {
        mediaUrl: doc.url,
        mimetype: doc.mimetype,
        fileName: doc.fileName,
        fileLength: doc.fileLength,
        base64: doc.base64 || (message as Record<string, unknown>).base64,
      },
    };
  }

  if (msg.stickerMessage) {
    return {
      text: "[Sticker recebido]",
      mediaType: "sticker",
      mediaMetadata: {
        mediaUrl: (msg.stickerMessage as Record<string, unknown>).url,
        mimetype: (msg.stickerMessage as Record<string, unknown>).mimetype,
      },
    };
  }

  if (msg.contactMessage) {
    return { text: "[Contato recebido]" };
  }

  if (msg.locationMessage) {
    const loc = msg.locationMessage;
    return {
      text: "[Localização recebida]",
      mediaMetadata: {
        latitude: loc.degreesLatitude,
        longitude: loc.degreesLongitude,
        name: loc.name,
        address: loc.address,
      },
    };
  }

  return { text: "" };
}

export function parseEvolutionWebhook(body: unknown): WhatsAppEvent | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;
  const event = payload.event as string;
  const data = payload.data as Record<string, unknown>;
  if (!data) return null;

  // Always remember LID → phone mappings
  rememberMapping(data);

  // Connection update
  if (event === "CONNECTION_UPDATE") {
    const state = (data.state as string) ||
      ((data.instance as Record<string, unknown>)?.state as string);
    return {
      type: "connection_changed",
      state: mapEvolutionState(state),
    } satisfies ConnectionChangedEvent;
  }

  // Message events
  if (!INBOUND_MESSAGE_EVENTS.has(event)) return null;

  const key = data.key as Record<string, unknown> | undefined;
  if (!key) return null;

  const isFromMe = !!key.fromMe;
  const remoteJid = (key.remoteJid as string) || "";
  const isGroup = isGroupJid(remoteJid);
  const messageType = (data.messageType as string) || "conversation";

  const { text, mediaType, mediaMetadata } = parseMessageContent(
    data.message as Record<string, unknown>,
  );

  return {
    type: "incoming_message",
    from: remoteJid,
    messageId: key.id as string,
    text,
    mediaType: mediaType || messageType,
    mediaMetadata,
    timestamp: String(data.messageTimestamp || Date.now()),
    pushName: data.pushName as string | undefined,
    remoteJid,
    remoteJidAlt: (key.remoteJidAlt as string) || (data.remoteJidAlt as string) || null,
    isFromMe,
    isGroup,
    rawData: data,
  } satisfies IncomingMessageEvent;
}
