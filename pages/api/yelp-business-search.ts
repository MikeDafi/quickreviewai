import type { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '@vercel/kv'

// Rate limiting per IP: 30 searches per hour
// Prevents single users from burning through the daily quota
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds

interface YelpBusiness {
  id: string
  name: string
  alias: string
  image_url: string
  url: string
  review_count: number
  rating: number
  coordinates: {
    latitude: number
    longitude: number
  }
  location: {
    address1: string
    city: string
    state: string
    zip_code: string
    display_address: string[]
  }
  phone: string
  categories: { alias: string; title: string }[]
}

interface YelpSearchResponse {
  businesses: YelpBusiness[]
  total: number
}

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, location, latitude, longitude } = req.query

  if (!name) {
    return res.status(400).json({ error: 'Missing required parameter: name' })
  }

  // Rate limiting per IP
  const ip = getClientIP(req)
  const rateLimitKey = `yelp_biz_search:${ip}`

  try {
    const count = await kv.get<number>(rateLimitKey) || 0
    if (count >= RATE_LIMIT_MAX) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many searches. Please try again later.'
      })
    }
    await kv.incr(rateLimitKey)
    if (count === 0) {
      await kv.expire(rateLimitKey, RATE_LIMIT_WINDOW)
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Continue without rate limiting if KV fails
  }

  const apiKey = process.env.YELP_API_KEY
  if (!apiKey) {
    console.error('YELP_API_KEY not configured')
    return res.status(500).json({ error: 'Yelp API not configured' })
  }

  try {
    // Build search params - search by business name
    const params = new URLSearchParams({
      term: name as string,
      limit: '5', // Only need a few matches
      sort_by: 'best_match',
    })
    
    // Priority: 1) coordinates from user's browser, 2) location string, 3) fallback to US
    if (latitude && longitude) {
      // Use user's actual location for better local results
      params.append('latitude', latitude as string)
      params.append('longitude', longitude as string)
      params.append('radius', '40000') // 40km (~25 miles) to find nearby businesses
    } else if (location) {
      params.append('location', location as string)
    } else {
      // Fallback - user should include city in search query
      params.append('location', 'United States')
    }

    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Yelp API error:', response.status, errorText)
      return res.status(response.status).json({ error: 'Yelp API error', details: errorText })
    }

    const data: YelpSearchResponse = await response.json()

    // Transform to simpler format
    const businesses = data.businesses.map((biz) => ({
      id: biz.id,
      name: biz.name,
      alias: biz.alias,
      lat: biz.coordinates.latitude,
      lng: biz.coordinates.longitude,
      address: biz.location.display_address.join(', '),
      city: biz.location.city,
      state: biz.location.state,
      rating: biz.rating,
      reviewCount: biz.review_count,
      categories: biz.categories.map(c => c.title),
      imageUrl: biz.image_url,
      yelpUrl: biz.url,
    }))

    return res.status(200).json({ businesses })
  } catch (error) {
    console.error('Yelp business search error:', error)
    return res.status(500).json({ error: 'Failed to search Yelp' })
  }
}
