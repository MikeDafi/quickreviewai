import type { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '@vercel/kv'

// Rate limit: 50 requests per hour per IP for demo
const RATE_LIMIT_WINDOW = 60 * 60 // 1 hour
const RATE_LIMIT_MAX = 50

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `demo_places:${ip}`
  try {
    const count = await kv.get<number>(key) || 0
    if (count >= RATE_LIMIT_MAX) return false
    
    const newCount = await kv.incr(key)
    if (newCount === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW)
    }
    return true
  } catch (error) {
    // Fail open for demo
    console.error('Rate limit check failed:', error)
    return true
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { input } = req.query
  
  if (!input || typeof input !== 'string' || input.length < 3) {
    return res.status(400).json({ error: 'Input must be at least 3 characters' })
  }

  // Rate limit check
  const forwarded = req.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown'
  
  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API not configured' })
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    url.searchParams.set('input', input)
    url.searchParams.set('types', 'establishment')
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message)
      return res.status(500).json({ error: 'Failed to search places' })
    }

    return res.status(200).json({
      predictions: data.predictions || []
    })
  } catch (error) {
    console.error('Places autocomplete error:', error)
    return res.status(500).json({ error: 'Failed to search places' })
  }
}

