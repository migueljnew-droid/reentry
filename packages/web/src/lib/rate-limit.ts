/**
 * Rate limiting with Upstash Redis (Edge-compatible).
 *
 * Tiers:
 * - AI routes (/api/intake/*, /api/plans/generate): 10 req/min per user
 * - Auth routes (/api/auth/*): 5 req/min per IP
 * - General API routes: 60 req/min per user
 *
 * Graceful degradation: if UPSTASH_REDIS_REST_URL is not configured,
 * rate limiting is skipped entirely (dev mode).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitTier = 'ai' | 'auth' | 'general';

type Duration = `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}` | `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`;

const TIER_LIMITS: Record<RateLimitTier, { requests: number; window: Duration }> = {
  ai: { requests: 10, window: '1 m' },
  auth: { requests: 5, window: '1 m' },
  general: { requests: 60, window: '1 m' },
};

let redis: Redis | null = null;
const limiters = new Map<RateLimitTier, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(tier: RateLimitTier): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;

  if (!limiters.has(tier)) {
    const config = TIER_LIMITS[tier];
    limiters.set(
      tier,
      new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(config.requests, config.window),
        prefix: `reentry:ratelimit:${tier}`,
      })
    );
  }

  return limiters.get(tier)!;
}

/**
 * Determine which rate limit tier applies to a given pathname.
 */
export function getTier(pathname: string): RateLimitTier {
  if (
    pathname.startsWith('/api/intake/') ||
    pathname === '/api/plans/generate'
  ) {
    return 'ai';
  }
  if (pathname.startsWith('/api/auth/')) {
    return 'auth';
  }
  return 'general';
}

export interface RateLimitResult {
  /** Whether the request should be allowed */
  allowed: boolean;
  /** Number of remaining requests in the window */
  remaining: number;
  /** Unix timestamp (ms) when the rate limit resets */
  reset: number;
  /** Seconds until the rate limit resets (for Retry-After header) */
  retryAfterSeconds: number;
}

/**
 * Check rate limit for a given identifier and tier.
 *
 * Returns null if rate limiting is not configured (Upstash not available).
 * This allows graceful degradation in development.
 *
 * @param identifier - User ID for authenticated routes, IP for auth routes
 * @param tier - Which rate limit tier to apply
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier
): Promise<RateLimitResult | null> {
  const limiter = getLimiter(tier);
  if (!limiter) {
    // Upstash not configured — skip rate limiting
    return null;
  }

  const result = await limiter.limit(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
    retryAfterSeconds: Math.ceil((result.reset - Date.now()) / 1000),
  };
}
