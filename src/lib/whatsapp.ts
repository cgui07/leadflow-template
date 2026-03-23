// Barrel re-export — original code split into focused modules.
// All existing imports from "@/lib/whatsapp" continue to work.

export {
  isNonEmptyString,
  isGroupJid,
  isLidJid,
  isPhoneNumberJid,
  toPhoneDigits,
  getPhoneIdentity,
  toInputJsonValue,
  LID_SUFFIX,
  PHONE_NUMBER_JID_SUFFIX,
  type MaybeJid,
} from "./whatsapp-jid";

export {
  lidToPnCache,
  rememberMapping,
  type LidMappingEvent,
} from "./whatsapp-mapping";

export {
  type WhatsAppConfig,
  getWhatsAppConfig,
  sendPresenceUpdate,
  sendWhatsAppMessage,
  sendWhatsAppMedia,
  sendWhatsAppAudioPTT,
  markAsRead,
} from "./whatsapp-client";

export {
  normalizePhoneNumberJid,
  resolveReplyJid,
  resolveSendTarget,
  toEvolutionNumber,
} from "./whatsapp-resolve";

export {
  processIncomingMessage,
  pauseConversationOnOwnerMessage,
  sendAndSaveMessage,
  sendAndSaveAudioPTT,
} from "@/features/conversations/incoming-message";
