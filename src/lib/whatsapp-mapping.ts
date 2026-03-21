import { normalizePhoneNumberJid } from "./whatsapp-resolve";
import {
  isLidJid,
  isPhoneNumberJid,
  type MaybeJid,
} from "./whatsapp-jid";

export interface LidMappingEvent {
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

export const lidToPnCache = new Map<string, string>();

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
    .map((candidate: MaybeJid) => normalizePhoneNumberJid(candidate))
    .filter((candidate): candidate is string => isPhoneNumberJid(candidate));

  return { lidCandidates, phoneCandidates };
}

export function rememberMapping(event: LidMappingEvent | null | undefined) {
  if (!event) {
    return null;
  }

  const { lidCandidates, phoneCandidates } = getMappingCandidates(event);
  const pnJid = phoneCandidates[0];

  if (!pnJid || lidCandidates.length === 0) {
    return null;
  }

  for (const lid of lidCandidates) {
    lidToPnCache.set(lid, pnJid);
  }

  return { lid: lidCandidates[0], pnJid };
}
