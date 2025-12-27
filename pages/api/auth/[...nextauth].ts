import NextAuth from 'next-auth'
import type { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '@/lib/auth'
import { kv } from '@vercel/kv'

// Rate limiting for auth endpoints to prevent credential stuffing
const AUTH_RATE_LIMIT_WINDOW = 60 * 15 // 15 minutes
const AUTH_RATE_LIMIT_MAX = 10 // Max 10 attempts per 15 minutes per IP

async function checkAuthRateLimit(ip: string): Promise<boolean> {
  const key = `auth_ratelimit:${ip}`
  
  try {
    const count = await kv.get<number>(key) || 0
    
    if (count >= AUTH_RATE_LIMIT_MAX) {
      return false // Rate limited
    }
    
    const newCount = await kv.incr(key)
    if (newCount === 1) {
      await kv.expire(key, AUTH_RATE_LIMIT_WINDOW)
    }
    
    return true // Allowed
  } catch (error) {
    // Fail closed for auth - if rate limiting fails, deny request
    console.error('Auth rate limit check failed:', error)
    return false
  }
}

// Get real client IP (Vercel trusted headers)
function getClientIP(req: NextApiRequest): string {
  const realIp = req.headers['x-real-ip'] as string
  if (realIp) return realIp
  
  const vercelForwardedFor = req.headers['x-vercel-forwarded-for'] as string
  if (vercelForwardedFor) return vercelForwardedFor.split(',')[0].trim()
  
  return req.socket.remoteAddress || 'unknown'
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
  
  return NextAuth(req, res, authOptions)
}

