import type { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '@vercel/kv'

// Rate limit: 30 requests per hour per IP for demo
const RATE_LIMIT_WINDOW = 60 * 60 // 1 hour
const RATE_LIMIT_MAX = 30

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `demo_details:${ip}`
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

  const { place_id } = req.query
  
  if (!place_id || typeof place_id !== 'string') {
    return res.status(400).json({ error: 'place_id is required' })
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
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    url.searchParams.set('place_id', place_id)
    url.searchParams.set('fields', 'name,geometry,types,formatted_address')
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      console.error('Place Details API error:', data.status, data.error_message)
      return res.status(500).json({ error: 'Failed to get place details' })
    }

    const place = data.result
    return res.status(200).json({
      name: place.name,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      types: place.types || [],
      address: place.formatted_address || ''
    })
  } catch (error) {
    console.error('Place details error:', error)
    return res.status(500).json({ error: 'Failed to get place details' })
  }
}

