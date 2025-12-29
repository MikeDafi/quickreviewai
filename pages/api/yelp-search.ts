import type { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '@vercel/kv'

// Rate limiting per IP: 30 searches per hour
// Prevents single users from burning through the daily quota
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds

interface YelpBusiness {
  id: string
  name: string
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
  display_phone: string
  distance: number
  categories: { alias: string; title: string }[]
}

interface YelpSearchResponse {
  businesses: YelpBusiness[]
  total: number
  region: {
    center: {
      latitude: number
      longitude: number
    }
  }
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

  const { term, latitude, longitude, radius = '4000' } = req.query

  if (!term || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing required parameters: term, latitude, longitude' })
  }

  // Rate limiting per IP
  const ip = getClientIP(req)
  const rateLimitKey = `yelp_search:${ip}`

  try {
    const count = await kv.get<number>(rateLimitKey) || 0
    if (count >= RATE_LIMIT_MAX) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many searches. Please try again later or sign up for unlimited access.'
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
    const params = new URLSearchParams({
      term: term as string,
      latitude: latitude as string,
      longitude: longitude as string,
      radius: radius as string, // meters (max 40000)
      limit: '20',
      sort_by: 'best_match', // This is Yelp's ranking algorithm
    })

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

    // Transform the response to only include what we need
    const results = data.businesses.map((business, index) => ({
      rank: index + 1,
      id: business.id,
      name: business.name,
      rating: business.rating,
      reviewCount: business.review_count,
      lat: business.coordinates.latitude,
      lng: business.coordinates.longitude,
      address: business.location.display_address.join(', '),
      categories: business.categories.map(c => c.title),
      distance: Math.round(business.distance), // meters
      yelpUrl: business.url,
      imageUrl: business.image_url,
    }))

    return res.status(200).json({
      results,
      total: data.total,
      center: data.region?.center || { latitude: parseFloat(latitude as string), longitude: parseFloat(longitude as string) },
    })
  } catch (error) {
    console.error('Yelp search error:', error)
    return res.status(500).json({ error: 'Failed to search Yelp' })
  }
}
