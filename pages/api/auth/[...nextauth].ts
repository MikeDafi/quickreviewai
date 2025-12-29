import NextAuth from 'next-auth'
import type { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '@/lib/auth'
import { kv } from '@vercel/kv'
import { getClientIP } from '@/lib/ip'

// Auth configuration validation (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('NextAuth Config Check:', {
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  })
}

/** Rate limit window in seconds (15 minutes) */
const AUTH_RATE_LIMIT_WINDOW = 60 * 15

/** Max auth attempts per IP within the window */
const AUTH_RATE_LIMIT_MAX = 10

/**
 * Check auth rate limit using atomic operations.
 * Uses atomic incr to prevent race conditions.
 * 
 * @param ip - Client IP address
 * @returns true if allowed, false if rate limited
 */
async function checkAuthRateLimit(ip: string): Promise<boolean> {
  const key = `auth_ratelimit:${ip}`
  
  try {
    // Atomic increment - returns the NEW value after incrementing
    // This avoids the race condition of get-then-incr
    const newCount = await kv.incr(key)
    
    // Set expiry on first request (when newCount = 1)
    if (newCount === 1) {
      try {
        await kv.expire(key, AUTH_RATE_LIMIT_WINDOW)
      } catch (expireError) {
        // If expire fails, delete key to prevent permanent blocks
        console.error('Auth rate limit expire failed:', expireError)
        await kv.del(key).catch(() => {})
        return true
      }
    }
    
    // Check AFTER incrementing for atomic behavior
    if (newCount > AUTH_RATE_LIMIT_MAX) {
      return false // Rate limited
    }
    
    return true // Allowed
  } catch (error) {
    // Fail open - auth security is handled by Google OAuth
    console.error('Auth rate limit check failed:', error)
    return true
  }
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  // Rate limit sign-in attempts
  if (req.method === 'POST' && req.url?.includes('signin')) {
    const ip = getClientIP(req)
    const allowed = await checkAuthRateLimit(ip)
    
    if (!allowed) {
      return res.status(429).json({ 
        error: 'Too many sign-in attempts. Please try again later.' 
      })
    }
  }
  
  try {
    return await NextAuth(req, res, authOptions)
  } catch (error) {
    console.error('NextAuth error:', error)
    throw error
  }
}
