import type { NextApiRequest, NextApiResponse } from 'next'

const YELP_API_KEY = process.env.YELP_API_KEY

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const { name, address } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Business name is required' })
  }

  const results: { yelpUrl?: string; googleUrl?: string } = {}

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
      } else {
        console.error('Yelp API error:', await yelpRes.text())
      }
    } catch (error) {
      console.error('Yelp lookup error:', error)
    }
  }

  // Google - generate a Maps search URL (free, no API needed)
  // Users can click through to the review page from there
  if (name) {
    const searchQuery = address ? `${name} ${address}` : name
    results.googleUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`
  }

  return res.status(200).json(results)
}

