// Rate limiter with Upstash Redis (persistent across serverless instances).
// Falls back to in-memory when UPSTASH_REDIS_REST_URL is not configured.

import { env } from "./env";

// --- Upstash setup (lazy singleton) ---
type UpstashLimiter = {
  limit(key: string): Promise<{ success: boolean; reset: number }>;
};

const upstashLimiters = new Map<string, UpstashLimiter>();

async function getUpstashLimiter(
  windowMs: number,
  maxRequests: number,
): Promise<UpstashLimiter | null> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;

  const cacheKey = `${windowMs}:${maxRequests}`;
  if (upstashLimiters.has(cacheKey)) return upstashLimiters.get(cacheKey)!;

  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
    });
    upstashLimiters.set(cacheKey, limiter);
    return limiter;
  } catch {
    return null;
  }
}

// --- In-memory fallback ---
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function memoryCheckRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [k, entry] of store.entries()) {
      if (now >= entry.resetAt) store.delete(k);
    }
    lastCleanup = now;
  }

  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export async function checkRateLimitAsync(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const limiter = await getUpstashLimiter(config.windowMs, config.maxRequests);
  if (limiter) {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      retryAfterMs: Math.max(0, result.reset - Date.now()),
    };
  }
  return memoryCheckRateLimit(key, config);
}

// Sync version (in-memory only) — kept for callers that can't await
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; retryAfterMs: number } {
  return memoryCheckRateLimit(key, config);
}

export function getIp(req: {
  headers: { get(name: string): string | null };
  ip?: string;
}): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
}
