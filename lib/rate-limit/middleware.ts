import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../db/client';
import { v4 as uuidv4 } from 'uuid';

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string;  // Prefix for rate limit key
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // API endpoints
  api: { windowMs: 60 * 1000, maxRequests: 100 },         // 100 req/min
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },    // 10 req/15min
  upload: { windowMs: 60 * 1000, maxRequests: 10 },       // 10 uploads/min
  analytics: { windowMs: 1000, maxRequests: 20 },         // 20 req/sec
  
  // Stricter for sensitive operations
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },    // 5 attempts/15min
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 attempts/hour
};

/**
 * Get client identifier (IP address or API key)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try various headers for real IP (behind proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a hash of user agent + some request info
  const ua = request.headers.get('user-agent') || 'unknown';
  const accept = request.headers.get('accept') || '';
  const identifier = `${ua}-${accept}`;
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ua-${Math.abs(hash).toString(36)}`;
}

/**
 * Check rate limit and return result
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.api
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const identifier = getClientIdentifier(request);
  const endpoint = config.keyPrefix || new URL(request.url).pathname;
  
  const db = getDb();
  const windowStart = new Date(Date.now() - config.windowMs);
  const windowStartStr = windowStart.toISOString();

  try {
    // Clean up old records (older than window)
    await db.execute({
      sql: "DELETE FROM rate_limits WHERE window_start < datetime(?, '-1 hour')",
      args: [windowStartStr],
    });

    // Get current count for this identifier + endpoint
    const result = await db.execute({
      sql: `
        SELECT SUM(request_count) as total
        FROM rate_limits 
        WHERE identifier = ? AND endpoint = ? AND window_start >= ?
      `,
      args: [identifier, endpoint, windowStartStr],
    });

    const currentCount = Number(result.rows[0]?.total || 0);
    const remaining = Math.max(0, config.maxRequests - currentCount - 1);
    const resetAt = new Date(Date.now() + config.windowMs);

    if (currentCount >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetAt };
    }

    // Increment count
    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

    const existing = await db.execute({
      sql: `
        SELECT id, request_count FROM rate_limits 
        WHERE identifier = ? AND endpoint = ? AND window_start >= ?
        LIMIT 1
      `,
      args: [identifier, endpoint, windowStartStr],
    });

    if (existing.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE rate_limits SET request_count = request_count + 1 WHERE id = ?',
        args: [existing.rows[0].id],
      });
    } else {
      await db.execute({
        sql: `
          INSERT INTO rate_limits (id, identifier, endpoint, request_count, window_start)
          VALUES (?, ?, ?, 1, datetime('now'))
        `,
        args: [uuidv4(), identifier, endpoint],
      });
    }

    return { allowed: true, remaining, resetAt };
  } catch (error) {
    // If rate limiting fails, allow the request (fail open)
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date() };
  }
}

/**
 * Rate limit middleware wrapper for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMITS.api
): Promise<NextResponse> {
  const result = await checkRateLimit(request, config);

  if (!result.allowed) {
    return NextResponse.json(
      { 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt.toISOString(),
          'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
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

