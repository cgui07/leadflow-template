// ─── Enums & Constants ───

export type ProviderType = "evolution" | "meta";

export type ConnectionState =
  | "connected"
  | "connecting"
  | "disconnected";

export type PresenceType = "composing" | "recording" | "paused";

export type MediaType = "image" | "video" | "audio" | "document" | "sticker";

// ─── Send Payloads ───

export interface SendTextPayload {
  to: string;
  text: string;
}

export interface SendMediaPayload {
  to: string;
  type: MediaType;
  url: string;
  caption?: string;
  fileName?: string;
  mimetype?: string;
}

export interface SendAudioPTTPayload {
  to: string;
  audioBase64: string;
}

export interface SendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

// ─── Connection ───

export interface ConnectionOptions {
  method: "qrcode" | "pairing-code";
  phoneNumber?: string;
  webhookUrl: string;
  webhookToken: string;
}

export interface ConnectionResult {
  status: ConnectionState;
  instanceId: string;
  qrCode?: string | null;
  pairingCode?: string | null;
}

export interface ConnectionInfo {
  state: ConnectionState;
  instanceId: string | null;
}

// ─── Normalized Webhook Events ───

export interface IncomingMessageEvent {
  type: "incoming_message";
  from: string;
  messageId: string;
  text: string;
  mediaType?: string;
  mediaMetadata?: Record<string, unknown>;
  timestamp: string;
  pushName?: string;
  remoteJid: string;
  remoteJidAlt?: string | null;
  isFromMe: boolean;
  isGroup: boolean;
  rawData: unknown;
}

export interface ConnectionChangedEvent {
  type: "connection_changed";
  state: ConnectionState;
}

export type WhatsAppEvent =
  | IncomingMessageEvent
  | ConnectionChangedEvent;

// ─── Provider Interface ───

export interface WhatsAppProvider {
  readonly providerType: ProviderType;

  // Connection management
  createConnection(userId: string, options: ConnectionOptions): Promise<ConnectionResult>;
  getConnectionStatus(instanceId: string): Promise<ConnectionInfo>;
  disconnect(instanceId: string): Promise<void>;

  // Messaging
  sendText(instanceId: string, payload: SendTextPayload): Promise<SendResult>;
  sendMedia(instanceId: string, payload: SendMediaPayload): Promise<SendResult>;
  sendAudioPTT(instanceId: string, payload: SendAudioPTTPayload): Promise<SendResult>;
  sendPresence(instanceId: string, to: string, type: PresenceType): Promise<void>;
  markAsRead(instanceId: string, messageId: string): Promise<void>;

  // Webhook
  parseWebhook(body: unknown): WhatsAppEvent | null;

  // Instance naming
  instanceIdForUser(userId: string): string;
}
