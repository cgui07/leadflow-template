// ── Media Limits ─────────────────────────────────────────────────────────────
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_AUDIO_SECONDS = 120;

// ── Voice Reply ──────────────────────────────────────────────────────────────
export const MIN_REPLY_LENGTH = 40;
export const AUDIO_COOLDOWN_WINDOW = 3;
export const DEFAULT_VOICE_MONTHLY_LIMIT = 50;

// ── Follow-up ────────────────────────────────────────────────────────────────
export const FOLLOW_UP_PROCESSING_LEASE_MINUTES = 5;
export const FOLLOW_UP_RETRY_DELAY_MINUTES = 30;
export const DEFAULT_FOLLOW_UP_DELAY_HOURS = 24;
export const DEFAULT_MAX_FOLLOW_UPS = 3;

// ── Auth ─────────────────────────────────────────────────────────────────────
export const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour
export const BCRYPT_ROUNDS = 12;
export const JWT_EXPIRY = "7d";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// ── Appointments ─────────────────────────────────────────────────────────────
export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60;

// ── Webhook ──────────────────────────────────────────────────────────────────
export const MAX_WEBHOOK_BODY_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Time Helpers ─────────────────────────────────────────────────────────────
export const MS_PER_MINUTE = 60 * 1000;
export const MS_PER_HOUR = 60 * 60 * 1000;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
