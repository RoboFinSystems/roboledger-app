import { LRUCache } from 'lru-cache'
import type { NextRequest } from 'next/server'
import { getClientIp } from './client-ip'

interface RateLimitOptions {
  uniqueTokenPerInterval?: number // max number of unique tokens per interval
  interval?: number // time window in milliseconds
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

/**
 * Create a rate limiter.
 *
 * Note: state is in-process, so on a multi-instance deployment each instance
 * keeps its own counters and the effective limit is roughly `limit ×
 * instances`. That is acceptable for the abuse-deterrence these limits provide;
 * anything needing a true global limit has to move to a shared store.
 */
export function rateLimit(options?: RateLimitOptions) {
  const interval = options?.interval || 60000 // default 1 minute
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: interval,
    // Keep the window fixed from first request: without this every hit renews
    // the TTL, so a caller who keeps trying never rolls out of their own block.
    noUpdateTTL: true,
  })

  return {
    check: async (
      request: NextRequest,
      limit: number
    ): Promise<RateLimitResult> => {
      const token = getClientIdentifier(request)
      const tokenCount = tokenCache.get(token) || [0]
      const currentUsage = tokenCount[0]
      const remainingTtl = tokenCache.getRemainingTTL(token)
      const reset = new Date(
        Date.now() + (remainingTtl > 0 ? remainingTtl : interval)
      )

      if (currentUsage >= limit) {
        return { success: false, limit, remaining: 0, reset }
      }

      tokenCount[0] = currentUsage + 1
      tokenCache.set(token, tokenCount)

      return {
        success: true,
        limit,
        remaining: limit - (currentUsage + 1),
        reset,
      }
    },
  }
}

/**
 * Bucket key for a caller. Deliberately the client IP alone — mixing in
 * `User-Agent` (or any other caller-supplied header) hands the caller a knob
 * for minting unlimited fresh buckets, which defeats the limit entirely.
 */
function getClientIdentifier(request: NextRequest): string {
  return getClientIp(request) ?? 'unknown'
}

// Pre-configured rate limiters for different endpoints
export const contactRateLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 1000,
})
