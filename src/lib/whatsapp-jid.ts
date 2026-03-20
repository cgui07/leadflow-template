import type { Prisma } from "@/generated/prisma/client";

const LID_SUFFIX = "@lid";
const PHONE_NUMBER_JID_SUFFIX = "@s.whatsapp.net";
const GROUP_JID_SUFFIX = "@g.us";

export type MaybeJid = string | null | undefined;

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isGroupJid(value: MaybeJid) {
  return isNonEmptyString(value) && value.endsWith(GROUP_JID_SUFFIX);
}

export function isLidJid(value: MaybeJid) {
  return isNonEmptyString(value) && value.endsWith(LID_SUFFIX);
}

export function isPhoneNumberJid(value: MaybeJid) {
  return isNonEmptyString(value) && value.endsWith(PHONE_NUMBER_JID_SUFFIX);
}

export function toPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function getPhoneIdentity(value: MaybeJid) {
  if (!isNonEmptyString(value)) {
    return "";
  }

  const candidate = value.trim();

  if (isPhoneNumberJid(candidate)) {
    return candidate.slice(0, -PHONE_NUMBER_JID_SUFFIX.length);
  }

  return candidate;
}

export function toInputJsonValue(value: Record<string, unknown> | undefined) {
  return value as Prisma.InputJsonValue | undefined;
}

export { LID_SUFFIX, PHONE_NUMBER_JID_SUFFIX };
