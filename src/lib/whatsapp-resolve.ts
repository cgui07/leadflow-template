import {
  isNonEmptyString,
  isPhoneNumberJid,
  isLidJid,
  toPhoneDigits,
  getPhoneIdentity,
  PHONE_NUMBER_JID_SUFFIX,
  type MaybeJid,
} from "./whatsapp-jid";
import { lidToPnCache } from "./whatsapp-mapping";

export function normalizePhoneNumberJid(value: MaybeJid): string | null {
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

export function toEvolutionNumber(value: MaybeJid) {
  const resolvedJid = resolveReplyJid(value);
  if (!resolvedJid) {
    return null;
  }

  const digits = toPhoneDigits(getPhoneIdentity(resolvedJid));
  return digits || null;
}
