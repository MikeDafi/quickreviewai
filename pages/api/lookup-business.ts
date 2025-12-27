import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kv } from '@vercel/kv'

const YELP_API_KEY = process.env.YELP_API_KEY
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// Daily limit for Google Places API calls (~$200/month = 390/day)
const GOOGLE_PLACES_DAILY_LIMIT = 390

interface YelpBusiness {
  id: string
  name: string
  url: string
  location: {
    address1: string
    city: string
    state: string
  }
}

interface YelpSearchResponse {
  businesses: YelpBusiness[]
}

interface GooglePlaceCandidate {
  place_id: string
  name: string
  formatted_address: string
}

interface GoogleFindPlaceResponse {
  candidates: GooglePlaceCandidate[]
  status: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  // Require authentication to prevent API abuse
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { name, address } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Business name is required' })
  }

  const results: { yelpUrl?: string; googleUrl?: string } = {}
  let rateLimited = false

  // Yelp lookup
  if (YELP_API_KEY) {
    try {
      const location = address || 'United States'
      const searchParams = new URLSearchParams({
        term: name,
        location: location,
        limit: '1',
      })

      const yelpRes = await fetch(
        `https://api.yelp.com/v3/businesses/search?${searchParams}`,
        {
          headers: {
            Authorization: `Bearer ${YELP_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (yelpRes.ok) {
        const data: YelpSearchResponse = await yelpRes.json()
        if (data.businesses && data.businesses.length > 0) {
          const business = data.businesses[0]
          // Construct the write review URL
          results.yelpUrl = `https://www.yelp.com/writeareview/biz/${business.id}`
        }
      } else if (yelpRes.status === 429) {
        rateLimited = true
        console.error('Yelp API rate limited')
      } else {
        console.error('Yelp API error:', await yelpRes.text())
      }
    } catch (error) {
      console.error('Yelp lookup error:', error)
    }
  }

  // Google Places API lookup (with daily budget cap)
  if (GOOGLE_PLACES_API_KEY) {
    try {
      // Check daily usage limit to stay under $200/month budget
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const usageKey = `places_api_usage:${today}`
      const currentUsage = await kv.get<number>(usageKey) || 0
      
      if (currentUsage >= GOOGLE_PLACES_DAILY_LIMIT) {
        console.warn(`Google Places API daily limit reached: ${currentUsage}/${GOOGLE_PLACES_DAILY_LIMIT}`)
        // Skip Google lookup but continue with Yelp results
      } else {
        // Increment usage counter (expires after 48 hours)
        await kv.incr(usageKey)
        await kv.expire(usageKey, 172800) // 48 hours TTL
        
        const searchQuery = address ? `${name} ${address}` : name
        const searchParams = new URLSearchParams({
          input: searchQuery,
          inputtype: 'textquery',
          fields: 'place_id,name,formatted_address',
          key: GOOGLE_PLACES_API_KEY,
        })

        const googleRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${searchParams}`
        )

        if (googleRes.ok) {
          const data: GoogleFindPlaceResponse = await googleRes.json()
          if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
            const place = data.candidates[0]
            // Construct the Google review URL using place_id
            results.googleUrl = `https://search.google.com/local/writereview?placeid=${place.place_id}`
          } else if (data.status === 'OVER_QUERY_LIMIT') {
            rateLimited = true
            console.error('Google Places API rate limited')
          }
        } else if (googleRes.status === 429) {
          rateLimited = true
          console.error('Google Places API rate limited')
        } else {
          console.error('Google Places API error:', await googleRes.text())
        }
      }
    } catch (error) {
      console.error('Google Places lookup error:', error)
    }
  }

  // If rate limited and no results, return 429
  if (rateLimited && !results.yelpUrl && !results.googleUrl) {
    return res.status(429).json({ error: 'Rate limited by external APIs. Please try again later.' })
  }

  // Fallback to Maps search URL if Places API didn't work
  if (!results.googleUrl && name) {
    const searchQuery = address ? `${name} ${address}` : name
    results.googleUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`
  }

  return res.status(200).json(results)
}

