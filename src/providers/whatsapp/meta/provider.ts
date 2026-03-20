import type {
  WhatsAppProvider,
  ConnectionOptions,
  ConnectionResult,
  ConnectionInfo,
  SendTextPayload,
  SendMediaPayload,
  SendAudioPTTPayload,
  SendResult,
  PresenceType,
  WhatsAppEvent,
} from "../types";

const NOT_IMPLEMENTED = "MetaProvider ainda não implementado";

/**
 * Stub para futura implementação da API oficial do WhatsApp/Meta.
 *
 * Diferenças principais vs Evolution:
 * - Auth: OAuth + Business Verification (não QR code)
 * - Instance: phoneNumberId permanente (não instância Baileys)
 * - Envio: POST graph.facebook.com/v21.0/{phoneNumberId}/messages
 * - Webhook: Hub challenge + HMAC signature verification
 * - Mídia: Upload separado via /media endpoint
 * - Templates: Mensagens fora da janela de 24h exigem templates aprovados
 */
export class MetaProvider implements WhatsAppProvider {
  readonly providerType = "meta" as const;

  instanceIdForUser(_userId: string): string {
    // Meta usa phoneNumberId em vez de instância
    throw new Error(NOT_IMPLEMENTED);
  }

  async createConnection(_userId: string, _options: ConnectionOptions): Promise<ConnectionResult> {
    // Meta: OAuth flow → salvar access token + phoneNumberId
    throw new Error(NOT_IMPLEMENTED);
  }

  async getConnectionStatus(_instanceId: string): Promise<ConnectionInfo> {
    // Meta: GET /v21.0/{phoneNumberId} → verificar se token é válido
    throw new Error(NOT_IMPLEMENTED);
  }

  async disconnect(_instanceId: string): Promise<void> {
    // Meta: Revogar token OAuth
    throw new Error(NOT_IMPLEMENTED);
  }

  async sendText(_instanceId: string, _payload: SendTextPayload): Promise<SendResult> {
    // Meta: POST /v21.0/{phoneNumberId}/messages { type: "text", text: { body } }
    throw new Error(NOT_IMPLEMENTED);
  }

  async sendMedia(_instanceId: string, _payload: SendMediaPayload): Promise<SendResult> {
    // Meta: Upload media → POST /v21.0/{phoneNumberId}/messages { type: "image"|"document", ... }
    throw new Error(NOT_IMPLEMENTED);
  }

  async sendAudioPTT(_instanceId: string, _payload: SendAudioPTTPayload): Promise<SendResult> {
    // Meta: Upload audio → POST /v21.0/{phoneNumberId}/messages { type: "audio" }
    throw new Error(NOT_IMPLEMENTED);
  }

  async sendPresence(_instanceId: string, _to: string, _type: PresenceType): Promise<void> {
    // Meta: Não tem presence API equivalente (mark as read apenas)
  }

  async markAsRead(_instanceId: string, _messageId: string): Promise<void> {
    // Meta: POST /v21.0/{phoneNumberId}/messages { status: "read", message_id }
    throw new Error(NOT_IMPLEMENTED);
  }

  parseWebhook(_body: unknown): WhatsAppEvent | null {
    // Meta: payload diferente, verificar x-hub-signature-256
    throw new Error(NOT_IMPLEMENTED);
  }
}
