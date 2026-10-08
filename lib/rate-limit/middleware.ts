import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getDb } from '../db/client';

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string;  // Bucket name; defaults to the request path
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // API endpoints
  api: { windowMs: 60 * 1000, maxRequests: 100 },         // 100 req/min
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },    // 10 req/15min
  upload: { windowMs: 60 * 1000, maxRequests: 10 },       // 10 uploads/min
  analytics: { windowMs: 60 * 1000, maxRequests: 60 },    // 60 events/min

  // Stricter for sensitive operations
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },    // 5 attempts/15min
  register: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 attempts/hour
  sendCode: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 emails/hour
  verifyCode: { windowMs: 10 * 60 * 1000, maxRequests: 5 }, // 5 guesses per code lifetime

  // Public AI endpoints (each call costs money)
  aiChat: { windowMs: 60 * 1000, maxRequests: 15 },       // 15 msgs/min
  tts: { windowMs: 60 * 1000, maxRequests: 30 },          // 30 clips/min
};

/**
 * Get client identifier (IP address)
 */
export function getClientIdentifier(request: NextRequest): string {
  // Set by Netlify's edge and not spoofable by the client, unlike x-forwarded-for
  const netlifyIp = request.headers.get('x-nf-client-connection-ip');
  if (netlifyIp) {
    return netlifyIp.trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return 'unknown';
}

/**
 * Check rate limit and return result.
 * Uses fixed windows stored in the rate_limits table so limits hold across serverless
 * instances. `identifier` overrides the client IP, e.g. to limit per email address.
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.api,
  identifier: string = getClientIdentifier(request)
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const endpoint = config.keyPrefix || new URL(request.url).pathname;

  const windowStartMs = Math.floor(Date.now() / config.windowMs) * config.windowMs;
  const resetAt = new Date(windowStartMs + config.windowMs);
  // SQLite datetime format so cleanup can compare against datetime('now')
  const windowStart = new Date(windowStartMs).toISOString().slice(0, 19).replace('T', ' ');
  // Deterministic row id per (identifier, endpoint, window) so one upsert does the counting
  const id = createHash('sha256').update(`${identifier}|${endpoint}|${windowStartMs}`).digest('hex');

  const db = getDb();

  try {
    const result = await db.execute({
      sql: `
        INSERT INTO rate_limits (id, identifier, endpoint, request_count, window_start)
        VALUES (?, ?, ?, 1, ?)
        ON CONFLICT(id) DO UPDATE SET request_count = request_count + 1
        RETURNING request_count
      `,
      args: [id, identifier, endpoint, windowStart],
    });

    // Occasionally clear out expired windows (longest window is 1 hour)
    if (Math.random() < 0.01) {
      db.execute("DELETE FROM rate_limits WHERE window_start < datetime('now', '-1 day')")
        .catch((error) => console.error('Rate limit cleanup failed:', error));
    }

    const count = Number(result.rows[0]?.request_count || 1);
    return {
      allowed: count <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count),
      resetAt,
    };
  } catch (error) {
    // If rate limiting fails, allow the request (fail open)
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: config.maxRequests, resetAt };
  }
}

/**
 * Build the 429 response for a failed rate limit check
 */
export function rateLimitResponse(
  config: RateLimitConfig,
  resetAt: Date
): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
  return NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetAt.toISOString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

/**
 * Rate limit middleware wrapper for API routes
 */
export async function withRateLimit<T extends Response>(
  request: NextRequest,
  handler: () => Promise<T>,
  config: RateLimitConfig = RATE_LIMITS.api
): Promise<T | NextResponse> {
  const result = await checkRateLimit(request, config);

  if (!result.allowed) {
    return rateLimitResponse(config, result.resetAt);
  }

  const response = await handler();

  // Add rate limit headers to response
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

  return response;
}

/**
 * Higher-order function to create rate-limited API handlers
 */
export function rateLimited<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  config: RateLimitConfig = RATE_LIMITS.api
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    return withRateLimit(request, () => handler(request, ...args), config);
  };
}
