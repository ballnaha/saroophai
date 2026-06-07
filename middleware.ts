import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global middleware: rate limiting for API routes.
 *
 * This middleware applies rate limiting to all /api/* routes:
 *   - /api/auth/*  → 20 req/min/IP (auth limiter)
 *   - /api/line-webhook → 300 req/min/IP (webhook limiter)
 *   - /api/cron/*  → 5 req/min/IP (cron limiter)
 *   - /api/* (fallback) → 60 req/min/IP (general limiter)
 *
 * For production multi-instance deployments, swap the in-memory store
 * in lib/rate-limiter.ts with Redis via @upstash/ratelimit.
 */

// ── Inline sliding-window store for middleware (runs in Edge runtime) ───
//
// Note: The Edge runtime cannot use `@/lib/rate-limiter` directly because
// it imports `logToSystem` which depends on `@/lib/prisma` (MySQL).
// This middleware uses its own lightweight in-memory store.
// The rate limits are duplicated here for the Edge environment.

const stores = new Map<string, Map<string, number[]>>();

function getStore(name: string): Map<string, number[]> {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name)!;
}

function checkRateLimit(
  storeName: string,
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfter?: number } {
  const store = getStore(storeName);
  const now = Date.now();
  const windowStart = now - windowMs;

  let entries = store.get(key) ?? [];
  entries = entries.filter((ts) => ts > windowStart);

  if (entries.length >= maxRequests) {
    const retryAfter = Math.ceil((entries[0]! + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entries.push(now);
  store.set(key, entries);
  return { allowed: true };
}

// ── Periodic cleanup every 120 seconds ──────────────────────────────────
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entries] of store) {
        const valid = entries.filter((ts) => now - ts < 24 * 60 * 60 * 1000);
        if (valid.length === 0) {
          store.delete(key);
        } else {
          store.set(key, valid);
        }
      }
    }
  }, 120_000);
}

function getClientIp(request: NextRequest): string {
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

// ── Route-specific rate limit configs ───────────────────────────────────

type RateLimitConfig = {
  pathPattern: RegExp;
  storeName: string;
  maxRequests: number;
  windowMs: number;
};

const rateLimitConfigs: RateLimitConfig[] = [
  {
    pathPattern: /^\/api\/auth/,
    storeName: "auth",
    maxRequests: 20,
    windowMs: 60_000,
  },
  {
    pathPattern: /^\/api\/line-webhook/,
    storeName: "line-webhook",
    maxRequests: 300,
    windowMs: 60_000,
  },
  {
    pathPattern: /^\/api\/cron/,
    storeName: "cron",
    maxRequests: 5,
    windowMs: 60_000,
  },
  {
    pathPattern: /^\/api\//,
    storeName: "general-api",
    maxRequests: 60,
    windowMs: 60_000,
  },
];

// ── Middleware ──────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  ensureCleanup();

  const ip = getClientIp(request);

  for (const config of rateLimitConfigs) {
    if (config.pathPattern.test(pathname)) {
      const result = checkRateLimit(
        config.storeName,
        ip,
        config.maxRequests,
        config.windowMs,
      );

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
          },
        );
      }

      // Add rate limit info headers for client awareness
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
      response.headers.set("X-RateLimit-Remaining", String(Math.max(0, config.maxRequests - 1)));
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};