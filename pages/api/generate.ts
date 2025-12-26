import type { NextApiRequest, NextApiResponse } from 'next'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getLandingPage, updateLandingPageCache, incrementViewCount, incrementCopyCount, sql } from '@/lib/db'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface LandingWithStore {
  store_name: string
  business_type: string
  keywords: string[]
  tone: string
  prompt_guidance?: string
}

async function generateReview(landing: LandingWithStore): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const keywordsStr = landing.keywords?.length > 0 
    ? landing.keywords.join(', ') 
    : 'quality service, great experience'

  const prompt = `Generate a genuine, authentic 2-3 sentence positive review for a ${landing.business_type || 'business'} called "${landing.store_name}".

Requirements:
- Include these aspects naturally: ${keywordsStr}
- Tone: ${landing.tone || 'friendly'}
- Sound like a real customer, not AI-generated
- Be specific but not over-the-top
- No hashtags or emojis
${landing.prompt_guidance ? `- Additional context: ${landing.prompt_guidance}` : ''}

Write only the review text, nothing else.`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    return response.text().trim()
  } catch (error) {
    console.error('Gemini API error:', error)
    // Fallback review if API fails
    return `Had a great experience at ${landing.store_name}. The service was excellent and I would definitely recommend them!`
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, regenerate, action, platform } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Landing page ID is required' })
  }

  try {
    // Handle tracking actions (POST requests)
    if (req.method === 'POST') {
      if (action === 'copy') {
        await incrementCopyCount(id)
        return res.status(200).json({ success: true })
      }
      if (action === 'click' && platform) {
        // Update click count in JSON column
        await sql`
          UPDATE landing_pages 
          SET click_counts = click_counts || jsonb_build_object(${platform as string}, COALESCE((click_counts->${platform as string})::int, 0) + 1)
          WHERE id = ${id}
        `
        return res.status(200).json({ success: true })
      }
      return res.status(400).json({ error: 'Invalid action' })
    }

    // GET request - fetch landing page and generate review
    const landing = await getLandingPage(id)
    
    if (!landing) {
      return res.status(404).json({ error: 'Landing page not found' })
    }

    // Increment view count
    await incrementViewCount(id)

    // Check if we have a cached review and it's less than 24 hours old
    const cacheValid = landing.cached_review && landing.cached_at && 
      (Date.now() - new Date(landing.cached_at).getTime()) < 24 * 60 * 60 * 1000

    let review: string

    if (cacheValid && !regenerate) {
      review = landing.cached_review
    } else {
      // Generate new review
      review = await generateReview(landing as LandingWithStore)
      
      // Cache the review
      await updateLandingPageCache(id, review)
    }

    return res.status(200).json({
      landing: {
        id: landing.id,
        store_name: landing.store_name,
        business_type: landing.business_type,
        google_url: landing.google_url,
        yelp_url: landing.yelp_url,
      },
      review,
    })
  } catch (error) {
    console.error('Generate API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

