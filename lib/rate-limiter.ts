import { NextResponse } from "next/server";
import { logToSystem } from "./logger";

/**
 * Lightweight in-memory sliding-window rate limiter for Next.js API routes.
 *
 * Uses a Map<TKey, WindowEntry[]> per limiter instance. Suitable for single-process
 * deployments (PM2 single instance, Docker single container, etc.). For multi-process
 * deployments, swap this store with an external one (e.g. Redis via @upstash/ratelimit).
 */

type WindowEntry = {
  timestamp: number;
};

type RateLimiterConfig = {
  /** Unique label for this limiter (used in logs and store isolation). */
  name: string;
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Duration of the sliding window in milliseconds. */
  windowMs: number;
  /** Optional: block the request after exceeding limit rather than just warning. */
  blockOnLimit?: boolean;
};

type RateLimiterResult =
  | { allowed: true; remaining: number; reset: number }
  | { allowed: false; retryAfter: number };

// ── Global in-memory store ──────────────────────────────────────────────
const stores = new Map<string, Map<string, WindowEntry[]>>();

function getStore(name: string): Map<string, WindowEntry[]> {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name)!;
}

// ── Periodic cleanup (every 60 seconds) ─────────────────────────────────
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entries] of store) {
        const valid = entries.filter((e) => now - e.timestamp < 24 * 60 * 60 * 1000);
        if (valid.length === 0) {
          store.delete(key);
        } else {
          store.set(key, valid);
        }
      }
    }
  }, 60_000);
}

// ── Factory ─────────────────────────────────────────────────────────────

export function createRateLimiter(config: RateLimiterConfig) {
  const { name, maxRequests, windowMs, blockOnLimit = true } = config;
  const store = getStore(name);

  return async function check(key: string): Promise<RateLimiterResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Retrieve existing entries for this key
    let entries = store.get(key) ?? [];

    // Remove entries outside the current window
    entries = entries.filter((e) => e.timestamp > windowStart);

    if (entries.length >= maxRequests) {
      const oldest = entries[0];
      const retryAfter = Math.ceil((oldest.timestamp + windowMs - now) / 1000);

      if (blockOnLimit) {
        await logToSystem(
          "system",
          "warning",
          `Rate limit exceeded on [${name}] for key "${key}"`,
          `Limit: ${maxRequests} requests per ${windowMs / 1000}s. Retry after ${retryAfter}s.`
        );
      }

      return { allowed: false, retryAfter };
    }

    // Record this request
    entries.push({ timestamp: now });
    store.set(key, entries);

    return {
      allowed: true,
      remaining: maxRequests - entries.length,
      reset: Math.ceil((entries[0].timestamp + windowMs - now) / 1000),
    };
  };
}

// ── Pre-configured limiters ─────────────────────────────────────────────

/** General purpose API limiter — 60 requests per minute per IP. */
export const generalApiLimiter = createRateLimiter({
  name: "general-api",
  maxRequests: 60,
  windowMs: 60_000,
});

/** LINE webhook limiter — 300 requests per minute per IP.
 *  LINE can send many events in bursts, so we keep this generous. */
export const lineWebhookLimiter = createRateLimiter({
  name: "line-webhook",
  maxRequests: 300,
  windowMs: 60_000,
});

/** Cron job limiter — 5 requests per minute per IP.
 *  Cron should not be called frequently by external parties. */
export const cronLimiter = createRateLimiter({
  name: "cron",
  maxRequests: 5,
  windowMs: 60_000,
});

/** Auth limiter — 20 requests per minute per IP.
 *  Protects sign-in/sign-out endpoints from abuse. */
export const authLimiter = createRateLimiter({
  name: "auth",
  maxRequests: 20,
  windowMs: 60_000,
});

// ── Helper ──────────────────────────────────────────────────────────────

/**
 * Extracts a rate-limiting key from a NextRequest.
 * Priority: x-forwarded-for → request.headers.get("x-real-ip") → "unknown"
 */
export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

/**
 * Convenience wrapper: runs the rate limiter and returns a 429 response if blocked.
 * Call this at the top of every API route handler.
 *
 * @example
 * ```ts
 * const rateLimitResult = await applyRateLimit(request, lineWebhookLimiter);
 * if (rateLimitResult) return rateLimitResult; // 429 response
 * ```
 */
export async function applyRateLimit(
  request: Request,
  limiter: ReturnType<typeof createRateLimiter>
): Promise<NextResponse | null> {
  const key = getRateLimitKey(request);
  const result = await limiter(key);

  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfter),
        },
      }
    );
  }

  return null;
}