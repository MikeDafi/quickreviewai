import type { NextApiRequest, NextApiResponse } from 'next'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { kv } from '@vercel/kv'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TIME } from '@/lib/constants'
import crypto from 'crypto'

// Validate required environment variables at module load
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// Cache duration: 24 hours
const CACHE_TTL_SECONDS = TIME.DAY_SECONDS

// Generate a cache key based on business type and location
function generateCacheKey(businessTypes: string[], city: string): string {
  const normalizedTypes = businessTypes.map(t => t.toLowerCase().trim()).sort().join('|')
  const normalizedCity = city.toLowerCase().trim()
  const hash = crypto.createHash('sha256').update(`${normalizedTypes}:${normalizedCity}`).digest('hex').substring(0, 16)
  return `guidance_suggestions:${hash}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  // Require authentication
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { businessTypes, city, storeName } = req.body

  if (!businessTypes || !Array.isArray(businessTypes) || businessTypes.length === 0) {
    return res.status(400).json({ error: 'Business types are required' })
  }

  try {
    // Generate cache key based on business type and city (not store-specific for better cache hits)
    const cacheKey = generateCacheKey(businessTypes, city || '')
    
    // Check cache first
    const cached = await kv.get<string[]>(cacheKey)
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return res.status(200).json({ suggestions: cached, cached: true })
    }

    // Generate new suggestions with AI
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const businessTypeStr = businessTypes.join(' / ')
    const locationContext = city ? ` located in ${city}` : ''
    
    const prompt = `Generate 4 short, specific review guidance suggestions for a ${businessTypeStr}${locationContext}.

These suggestions tell the AI what to emphasize when generating customer reviews.

Rules:
- Each suggestion should be 10-20 words
- Be specific and actionable
- Focus on different aspects: service, quality, atmosphere, unique features
- Sound natural, like a business owner describing what makes them special
- Don't use generic phrases like "great service" - be specific
${storeName ? `- The business is called "${storeName}"` : ''}

Return ONLY a JSON array of 4 strings, no other text:
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim()
    
    // Parse the JSON array from response
    let suggestions: string[] = []
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('Failed to parse suggestions:', parseError)
      // Fallback: generate generic suggestions based on business type
      suggestions = generateFallbackSuggestions(businessTypes[0])
    }

    // Validate and clean suggestions
    suggestions = suggestions
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
      .map(s => s.trim())
      .slice(0, 4)

    // If we don't have enough, add fallbacks
    if (suggestions.length < 4) {
      const fallbacks = generateFallbackSuggestions(businessTypes[0])
      suggestions = [...suggestions, ...fallbacks].slice(0, 4)
    }

    // Cache for 24 hours
    await kv.set(cacheKey, suggestions, { ex: CACHE_TTL_SECONDS })

    return res.status(200).json({ suggestions, cached: false })
  } catch (error) {
    console.error('Guidance suggestions error:', error)
    // Return fallback suggestions on error
    const fallbacks = generateFallbackSuggestions(businessTypes[0] || 'business')
    return res.status(200).json({ suggestions: fallbacks, cached: false, fallback: true })
  }
}

function generateFallbackSuggestions(businessType: string): string[] {
  const type = businessType.toLowerCase()
  
  if (type.includes('restaurant') || type.includes('cafe') || type.includes('pizzeria') || type.includes('food')) {
    return [
      'Highlight our fresh, locally-sourced ingredients and homemade recipes',
      'Mention the warm, welcoming atmosphere and attentive service',
      'Focus on our signature dishes and what makes them unique',
      'Talk about our commitment to quality and consistency'
    ]
  }
  
  if (type.includes('salon') || type.includes('spa') || type.includes('barber')) {
    return [
      'Emphasize our skilled stylists and personalized consultations',
      'Mention the relaxing atmosphere and attention to detail',
      'Highlight our use of premium products and techniques',
      'Focus on how we help clients feel confident and refreshed'
    ]
  }
  
  if (type.includes('dental') || type.includes('medical') || type.includes('doctor')) {
    return [
      'Highlight our gentle approach and patient comfort',
      'Mention our modern equipment and efficient appointments',
      'Focus on our friendly, knowledgeable staff',
      'Emphasize our commitment to thorough, quality care'
    ]
  }
  
  // Generic fallbacks
  return [
    'Highlight what makes our service exceptional and personalized',
    'Mention our friendly, knowledgeable team and attention to detail',
    'Focus on the quality and value we provide to every customer',
    'Emphasize our commitment to customer satisfaction'
  ]
}

