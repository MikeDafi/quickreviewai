import { kv } from '@vercel/kv'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // milliseconds
}

/**
 * Generic rate limiter using Vercel KV atomic increment.
 * Fails open — if KV is unavailable, the request is allowed.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const count = await kv.incr(key)

    if (count === 1) {
      await kv.expire(key, windowSeconds)
    }

    if (count > max) {
      const ttl = await kv.ttl(key)
      return {
        allowed: false,
        remaining: 0,
        resetIn: (ttl > 0 ? ttl : windowSeconds) * 1000,
      }
    }

    return {
      allowed: true,
      remaining: max - count,
      resetIn: 0,
    }
  } catch {
    // Fail open — allow request if KV is down
    return { allowed: true, remaining: max, resetIn: 0 }
  }
}
