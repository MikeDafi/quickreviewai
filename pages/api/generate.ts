import type { NextApiRequest, NextApiResponse } from 'next'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { kv } from '@vercel/kv'
import { getLandingPage, incrementCopyCount, sql } from '@/lib/db'
import { 
  SubscriptionTier, 
  PLAN_LIMITS, 
  DEMO_REGENERATIONS_PER_HOUR,
  RATE_LIMIT,
  Platform,
  VALID_PLATFORMS,
} from '@/lib/constants'
import { getClientIP, hashIP } from '@/lib/ip'
import {
  CHARACTER_PERSONAS,
  VISIT_REASONS,
  EXAMPLE_HUMAN_REVIEWS,
  ULTRA_SHORT_EXAMPLES,
  REVIEW_OPENERS,
  LENGTH_PROFILES,
  REVIEW_QUIRKS,
  KEYWORD_SELECTION,
} from '@/lib/reviewData'

// ============================================
// Environment & Configuration
// ============================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

/** Maximum time to wait for Gemini API response */
const API_TIMEOUT_MS = 15000

/** Maximum retries for Gemini API calls */
const MAX_RETRIES = 3

// ============================================
// Prompt Injection Protection
// ============================================

/** Patterns that could be used for prompt injection attacks */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)/gi,
  /forget\s+(everything|all|what)/gi,
  /new\s+instructions?:/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
  /user\s*:/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /```\s*(system|assistant|user)/gi,
  /role\s*:\s*(system|assistant|user)/gi,
  /pretend\s+(you\s+are|to\s+be|you're)/gi,
  /act\s+as\s+(if|though)/gi,
  /you\s+are\s+now\s+a/gi,
  /from\s+now\s+on/gi,
  /override\s+(your|the|all)/gi,
]

/**
 * Sanitize a string for safe inclusion in AI prompts.
 * Removes prompt injection patterns, control characters, and truncates to max length.
 */
function sanitizeForPrompt(input: string | undefined | null, maxLength: number = 200): string {
  if (!input) return ''
  
  let sanitized = input.trim()
  
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }
  
  sanitized = sanitized
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
    .replace(/"/g, "'") // Replace double quotes with single
    .replace(/`/g, "'") // Replace backticks
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength).trim()
  }
  
  return sanitized
}

/** Sanitize an array of strings (like keywords) */
function sanitizeArrayForPrompt(inputs: string[] | undefined | null, maxPerItem: number = 50): string[] {
  if (!inputs || !Array.isArray(inputs)) return []
  
  return inputs
    .map(item => sanitizeForPrompt(item, maxPerItem))
    .filter(item => item.length > 0)
    .slice(0, 10) // Max 10 items
}

// ============================================
// Utility Functions
// ============================================

/** Wrap a promise with a timeout */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

/** Get regeneration rate limit for a tier */
function getRegenerationLimit(tier: SubscriptionTier | 'demo'): number {
  if (tier === 'demo') return DEMO_REGENERATIONS_PER_HOUR
  return PLAN_LIMITS[tier]?.regenerationsPerHour ?? PLAN_LIMITS[SubscriptionTier.FREE].regenerationsPerHour
}

/** Get monthly scan limit for a tier */
function getScanLimit(tier: SubscriptionTier): number {
  return PLAN_LIMITS[tier]?.scansPerMonth ?? PLAN_LIMITS[SubscriptionTier.FREE].scansPerMonth
}

/** Pick random items from an array */
function pickRandom<T>(arr: readonly T[], count: number): T[] {
  if (arr.length === 0) return []
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

/** Pick one random item from an array */
function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ============================================
// Rate Limiting
// ============================================

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
}

/**
 * Check rate limit using atomic increment in Vercel KV.
 * Uses atomic operations to prevent race conditions.
 */
async function checkRateLimit(ip: string, landingId: string, maxRequests: number): Promise<RateLimitResult> {
  const key = `ratelimit:${ip}:${landingId}`
  
  try {
    // Atomic increment - returns the NEW value after incrementing
    const newCount = await kv.incr(key)
    
    // Set expiry on first request (when newCount = 1)
    if (newCount === 1) {
      try {
        await kv.expire(key, RATE_LIMIT.WINDOW_SECONDS)
      } catch (expireError) {
        console.error('Failed to set rate limit expiry, deleting key:', expireError)
        await kv.del(key).catch(() => {})
        return { allowed: true, remaining: maxRequests - 1, resetIn: RATE_LIMIT.WINDOW_SECONDS * 1000 }
      }
    }
    
    if (newCount > maxRequests) {
      const ttl = await kv.ttl(key)
      return { allowed: false, remaining: 0, resetIn: Math.max(ttl, 0) * 1000 }
    }
    
    return { 
      allowed: true, 
      remaining: maxRequests - newCount, 
      resetIn: RATE_LIMIT.WINDOW_SECONDS * 1000 
    }
  } catch (error) {
    // Fail open - if KV fails, allow the request
    console.error('Rate limit check failed:', error)
    return { allowed: true, remaining: maxRequests, resetIn: RATE_LIMIT.WINDOW_SECONDS * 1000 }
  }
}

// ============================================
// Keyword Performance Analytics
// ============================================

interface KeywordWeight {
  keyword: string
  weight: number
}

/** Fetch keyword performance stats for weighted selection */
async function getKeywordStats(storeId: string): Promise<KeywordWeight[]> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { rows } = await sql`
      SELECT 
        keyword,
        COUNT(*) as usage_count,
        COUNT(CASE WHEN was_pasted_google OR was_pasted_yelp THEN 1 END) as pasted_count
      FROM review_events, unnest(keywords_used) as keyword
      WHERE store_id = ${storeId}
        AND created_at >= ${thirtyDaysAgo.toISOString()}::timestamp
      GROUP BY keyword
      HAVING COUNT(*) >= 2
    `
    
    return rows.map(r => ({
      keyword: r.keyword,
      // Weight = paste rate (0-1), minimum 0.1 for keywords with data but 0 pastes
      weight: r.usage_count > 0 
        ? Math.max(0.1, parseInt(r.pasted_count) / parseInt(r.usage_count))
        : 0.5
    }))
  } catch (error) {
    console.error('Failed to fetch keyword stats:', error)
    return []
  }
}

/**
 * Pick keywords using weighted random selection based on paste performance.
 * Keywords with higher paste rates are more likely to be selected.
 */
function pickWeightedRandom(keywords: string[], weights: KeywordWeight[], count: number): string[] {
  if (keywords.length === 0) return []
  if (keywords.length <= count) return keywords
  
  const BASELINE_WEIGHT = 1.0
  const NEW_KEYWORD_BONUS = 1.5 // New keywords get higher weight to encourage exploration
  
  const weightMap = new Map<string, number>()
  
  for (const kw of keywords) {
    const stat = weights.find(w => w.keyword.toLowerCase() === kw.toLowerCase())
    if (stat) {
      weightMap.set(kw, stat.weight + BASELINE_WEIGHT)
    } else {
      weightMap.set(kw, BASELINE_WEIGHT * NEW_KEYWORD_BONUS)
    }
  }
  
  const selected: string[] = []
  const remaining = [...keywords]
  
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, kw) => sum + (weightMap.get(kw) || BASELINE_WEIGHT), 0)
    let random = Math.random() * totalWeight
    
    for (let j = 0; j < remaining.length; j++) {
      const kw = remaining[j]
      random -= weightMap.get(kw) || BASELINE_WEIGHT
      
      if (random <= 0) {
        selected.push(kw)
        remaining.splice(j, 1)
        break
      }
    }
  }
  
  return selected
}

// ============================================
// Review Generation
// ============================================

interface LandingWithStore {
  id: string
  store_id: string
  store_name: string
  business_type: string
  keywords: string[]
  review_expectations?: string[]
  google_url?: string
  yelp_url?: string
}

interface ReviewResult {
  review: string
  metadata: {
    keywordsUsed: string[]
    expectationsUsed: string[]
    lengthType: string
    persona: string
  }
}

/** Build the list of quirks to add based on probabilities */
function buildQuirksList(): string[] {
  const quirks: string[] = []
  
  if (Math.random() < REVIEW_QUIRKS.LOL_EXPRESSIONS.probability) {
    quirks.push(REVIEW_QUIRKS.LOL_EXPRESSIONS.instruction)
  }
  if (Math.random() < REVIEW_QUIRKS.CASUAL_CONTRACTIONS.probability) {
    quirks.push(REVIEW_QUIRKS.CASUAL_CONTRACTIONS.instruction)
  }
  if (Math.random() < REVIEW_QUIRKS.MINOR_TYPOS.probability) {
    quirks.push(REVIEW_QUIRKS.MINOR_TYPOS.instruction)
  }
  if (Math.random() < REVIEW_QUIRKS.TRAILING_PUNCTUATION.probability) {
    quirks.push(REVIEW_QUIRKS.TRAILING_PUNCTUATION.instruction)
  }
  if (Math.random() < REVIEW_QUIRKS.ABBREVIATIONS.probability) {
    quirks.push(REVIEW_QUIRKS.ABBREVIATIONS.instruction)
  }
  if (Math.random() < REVIEW_QUIRKS.CONJUNCTION_STARTS.probability) {
    quirks.push(REVIEW_QUIRKS.CONJUNCTION_STARTS.instruction)
  }
  if (Math.random() < REVIEW_QUIRKS.LOWERCASE_I.probability) {
    quirks.push(REVIEW_QUIRKS.LOWERCASE_I.instruction)
  }
  
  return quirks
}

/** Build the AI prompt for review generation */
function buildPrompt(
  safeStoreName: string,
  businessTypeDisplay: string,
  persona: string,
  visitReason: string,
  keywordsStr: string,
  reviewGuidance: string,
  lengthProfile: typeof LENGTH_PROFILES[number],
  requiredOpener: string,
  quirks: string[],
  exampleReviews: string[]
): string {
  return `Write a Google/Yelp review for "${safeStoreName}" (a ${businessTypeDisplay}).

YOU ARE: ${persona}
CONTEXT: ${visitReason}

WORK IN NATURALLY: ${keywordsStr}${reviewGuidance ? `

OWNER'S GUIDANCE (incorporate naturally): ${reviewGuidance}` : ''}

LENGTH: ${lengthProfile.instruction}

**CRITICAL: START YOUR REVIEW WITH "${requiredOpener}" OR A SIMILAR CASUAL OPENING. DO NOT START WITH "Solid" or the business name.**

${lengthProfile.type === 'ultra-short' ? `ULTRA-SHORT EXAMPLES (match this length and casual vibe):
"${pickRandom(ULTRA_SHORT_EXAMPLES, 4).join('"\n"')}"` : `HERE ARE REAL HUMAN REVIEWS FOR REFERENCE (match this vibe, NOT the content):
"${exampleReviews[0]}"
"${exampleReviews[1]}"`}

CRITICAL - SOUND HUMAN BY:
${quirks.length > 0 ? quirks.map(q => `• ${q}`).join('\n') : '• Write casually like texting a friend'}
• Use contractions (don't, wasn't, couldn't, it's)
• VARY YOUR SENTENCE STRUCTURE - don't start multiple sentences the same way
${lengthProfile.type !== 'ultra-short' ? `• Be specific about ONE thing you liked, not everything
• It's ok to mention something small that wasn't perfect
• Write like you're telling a friend, not writing an essay
• Real people ramble a bit and go off topic` : '• Keep it super casual and brief'}

ABSOLUTE BANNED PHRASES (instant AI detection):
❌ "I recently visited" / "I had the pleasure" / "I recently had the opportunity"
❌ "exceptional" / "impeccable" / "delightful" / "exquisite" / "phenomenal"  
❌ "exceeded expectations" / "went above and beyond" / "top-notch"
❌ "I highly recommend" / "I would definitely recommend" / "I can't recommend enough"
❌ "I will definitely be back" / "I'll be returning" / "can't wait to come back"
❌ "friendly and attentive staff" / "warm and welcoming atmosphere"
❌ "hidden gem" (overused) / "a must-try" / "a treat for the senses"
❌ "from start to finish" / "from the moment we walked in"
❌ Perfect punctuation and grammar throughout
❌ Listing multiple compliments in a row
❌ More than one exclamation point total
❌ Starting with the business name
❌ Starting with "Solid" or similar generic adjective

MORE BANNED AI WORDS (these scream AI-generated):
❌ "delve" / "delve into" / "delved"
❌ "underscore" / "underscores" / "underscored"
❌ "pivotal" / "pivotal role"
❌ "realm" 
❌ "harness" / "harnessing"
❌ "illuminate" / "illuminating"
❌ "facilitate" / "facilitated"
❌ "bolster" / "bolstered"
❌ "streamline" / "streamlined"
❌ "revolutionize" / "revolutionary"
❌ "innovative" / "innovation"
❌ "cutting-edge" / "state-of-the-art"
❌ "game-changing" / "game changer"
❌ "transformative" / "transformed"
❌ "seamless" / "seamlessly"
❌ "scalable"
❌ "leverage" / "leveraging"
❌ "robust"
❌ "comprehensive"
❌ "meticulous" / "meticulously"
❌ "elevate" / "elevated"
❌ "curated"
❌ "bespoke"
❌ "paramount"
❌ "myriad"
❌ "plethora"
❌ "nuanced"
❌ "holistic"
❌ "synergy"
❌ "paradigm"

BANNED TRANSITION PHRASES:
❌ "That being said" / "That said"
❌ "At its core"
❌ "To put it simply"
❌ "This underscores"
❌ "A key takeaway"
❌ "From a broader perspective"
❌ "Generally speaking"
❌ "Broadly speaking"
❌ "Shed light on"
❌ "It's worth noting"
❌ "It goes without saying"
❌ "Needless to say"
❌ "In conclusion"
❌ "All in all"

BANNED HEDGING PHRASES:
❌ "Arguably"
❌ "To some extent"
❌ "tends to"
❌ "It's important to note"

Just write the review. No quotes. No "Here's a review:" preamble.`
}

/** Generate a review using the Gemini AI model */
async function generateReview(landing: LandingWithStore): Promise<ReviewResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  
  // Select keywords (60% chance of 1, 40% chance of 2)
  const keywordCount = Math.random() < KEYWORD_SELECTION.SINGLE_KEYWORD_PROBABILITY ? 1 : 2
  
  let selectedKeywords: string[]
  if (landing.keywords && landing.keywords.length > 0) {
    const keywordStats = await getKeywordStats(landing.store_id)
    
    if (keywordStats.length > 0) {
      selectedKeywords = pickWeightedRandom(landing.keywords, keywordStats, keywordCount)
    } else {
      selectedKeywords = pickRandom(landing.keywords, keywordCount)
    }
  } else {
    selectedKeywords = ['good']
  }
  
  // Sanitize inputs for prompt injection protection
  const sanitizedKeywords = sanitizeArrayForPrompt(selectedKeywords)
  const keywordsStr = sanitizedKeywords.join(' and ') || 'quality'
  
  const rawGuidance = landing.review_expectations?.[0] || ''
  const reviewGuidance = sanitizeForPrompt(rawGuidance, 300)
  const selectedExpectations = rawGuidance ? [rawGuidance] : []
  
  const safeStoreName = sanitizeForPrompt(landing.store_name, 100) || 'this business'
  const safeBusinessType = sanitizeForPrompt(landing.business_type, 100) || 'business'
  
  // Select random elements for variety
  const lengthProfile = pickOne(LENGTH_PROFILES)
  const persona = pickOne(CHARACTER_PERSONAS)
  const visitReason = pickOne(VISIT_REASONS)
  const requiredOpener = pickOne(REVIEW_OPENERS)
  const quirks = buildQuirksList()
  const exampleReviews = pickRandom(EXAMPLE_HUMAN_REVIEWS, 2)
  
  const businessTypeDisplay = safeBusinessType
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .join(' / ') || 'business'
  
  const prompt = buildPrompt(
    safeStoreName,
    businessTypeDisplay,
    persona,
    visitReason,
    keywordsStr,
    reviewGuidance,
    lengthProfile,
    requiredOpener,
    quirks,
    exampleReviews
  )
  
  const metadata = {
    keywordsUsed: selectedKeywords,
    expectationsUsed: selectedExpectations,
    lengthType: lengthProfile.type,
    persona: persona,
  }
  
  // Retry logic with exponential backoff
  let lastError: unknown = null
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await withTimeout(
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1.2, // Balanced: creative but controlled
            topP: 0.95,
            topK: 50,
          },
        }),
        API_TIMEOUT_MS,
        `Gemini API request timed out after ${API_TIMEOUT_MS}ms`
      )
      
      const reviewText = result.response.text().trim().replace(/^["']|["']$/g, '')
      return { review: reviewText, metadata }
    } catch (error: unknown) {
      lastError = error
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      console.warn(`Gemini API attempt ${attempt}/${MAX_RETRIES} failed:`, errorMessage)
      
      // Don't retry on certain errors
      if (errorMessage.includes('API key') || 
          errorMessage.includes('quota') || 
          errorMessage.includes('blocked') ||
          errorMessage.includes('timed out')) {
        break
      }
      
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)))
      }
    }
  }
  
  // Log detailed error after all retries fail
  console.error('Gemini API failed after all retries:', {
    name: lastError instanceof Error ? lastError.name : 'Unknown',
    message: lastError instanceof Error ? lastError.message : String(lastError),
    storeName: landing.store_name,
    keywords: selectedKeywords,
  })
  
  // Return fallback review
  const safeKeyword = sanitizedKeywords[0] || 'experience'
  const fallbacks = [
    `${requiredOpener} I tried this place and the ${safeKeyword} was great. Would come back.`,
    `Finally checked out ${safeStoreName}. Pretty impressed with the ${safeKeyword} tbh.`,
    `Not gonna lie, this place exceeded what I expected. The ${safeKeyword} is legit.`,
    `Been here a few times now. Consistently good ${safeKeyword}. No complaints.`,
    `My friend kept telling me to try this spot. Glad I listened, the ${safeKeyword} was on point.`,
  ]
  return { review: pickOne(fallbacks), metadata }
}

// ============================================
// Tracking Actions (POST Handlers)
// ============================================

interface TrackingResult {
  success: boolean
  counted?: boolean
  error?: string
}

/** Handle copy action tracking */
async function handleCopyAction(
  id: string,
  reviewEventId: string | undefined,
  ip: string
): Promise<TrackingResult> {
  const ipHash = hashIP(ip)
  const copyRateLimitKey = `copy_limit:${ipHash}:${id}`
  
  const alreadyCopied = await kv.get<boolean>(copyRateLimitKey)
  
  if (!alreadyCopied) {
    await incrementCopyCount(id)
    await kv.set(copyRateLimitKey, true, { ex: RATE_LIMIT.WINDOW_SECONDS })
  }
  
  if (reviewEventId) {
    await sql`
      UPDATE review_events 
      SET was_copied = true 
      WHERE id = ${reviewEventId}
    `.catch(() => {}) // Silently fail if table doesn't exist
  }
  
  return { success: true, counted: !alreadyCopied }
}

/** Handle click action tracking (paste to Google/Yelp) */
async function handleClickAction(
  id: string,
  platform: string,
  reviewEventId: string | undefined
): Promise<TrackingResult> {
  if (!VALID_PLATFORMS.includes(platform as Platform)) {
    return { 
      success: false, 
      error: `Invalid platform: ${platform}. Must be one of: ${VALID_PLATFORMS.join(', ')}` 
    }
  }
  
  const platformKey = platform as Platform
  
  // Update click count in JSON column
  await sql`
    UPDATE landing_pages 
    SET click_counts = click_counts || jsonb_build_object(${platformKey}::text, COALESCE((click_counts->${platformKey}::text)::int, 0) + 1)
    WHERE id = ${id}
  `
  
  // Mark as "pasted" only if the review was copied first
  if (reviewEventId && typeof reviewEventId === 'string') {
    try {
      switch (platformKey) {
        case Platform.GOOGLE: {
          const result = await sql`
            UPDATE review_events 
            SET was_pasted_google = true 
            WHERE id = ${reviewEventId} AND was_copied = true
            RETURNING id
          `
          console.log('Updated was_pasted_google:', reviewEventId, 'rows:', result.rowCount)
          break
        }
        case Platform.YELP: {
          const result = await sql`
            UPDATE review_events 
            SET was_pasted_yelp = true 
            WHERE id = ${reviewEventId} AND was_copied = true
            RETURNING id
          `
          console.log('Updated was_pasted_yelp:', reviewEventId, 'rows:', result.rowCount)
          break
        }
      }
    } catch (error) {
      console.error('Failed to update review_events paste tracking:', error)
    }
  }
  
  return { success: true }
}

// ============================================
// Main API Handler
// ============================================

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, regenerate, action, platform } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Landing page ID is required' })
  }

  try {
    // Handle POST tracking actions
    if (req.method === 'POST') {
      const { reviewEventId } = req.body || {}
      const ip = getClientIP(req)
      
      if (action === 'copy') {
        const result = await handleCopyAction(id, reviewEventId, ip)
        return res.status(200).json(result)
      }
      
      if (action === 'click' && platform) {
        const result = await handleClickAction(id, platform as string, reviewEventId)
        if (!result.success) {
          return res.status(400).json({ error: result.error })
        }
        return res.status(200).json(result)
      }
      
      return res.status(400).json({ error: 'Invalid action' })
    }

    // GET request - fetch landing page and generate review
    const landing = await getLandingPage(id)
    
    if (!landing) {
      return res.status(404).json({ error: 'Not found' })
    }

    const isDemo = id === 'demo'
    
    // Check monthly scan limit (skip for demo)
    if (!isDemo) {
      const { rows: [scanCheck] } = await sql`
        SELECT 
          u.id as user_id,
          COALESCE(u.subscription_tier, 'free') as tier,
          COALESCE(u.period_scans, 0) + COALESCE(SUM(lp.view_count), 0) as total_scans
        FROM landing_pages lp
        JOIN stores s ON lp.store_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE lp.id = ${id}
        GROUP BY u.id, u.subscription_tier, u.period_scans
      `
      
      if (scanCheck) {
        const tier = (scanCheck.tier || SubscriptionTier.FREE) as SubscriptionTier
        const limit = getScanLimit(tier)
        const totalScans = parseInt(scanCheck.total_scans) || 0
        
        if (totalScans >= limit) {
          await Promise.all([
            sql`UPDATE users SET exceeded_scans = COALESCE(exceeded_scans, 0) + 1 WHERE id = ${scanCheck.user_id}`,
            sql`UPDATE landing_pages SET exceeded_scans = COALESCE(exceeded_scans, 0) + 1 WHERE id = ${id}`,
          ]).catch(err => console.error('Failed to increment exceeded_scans:', err))
          
          return res.status(403).json({
            error: 'Scan limit reached',
            message: 'No AI generations left this month. Let the owner know!',
            landing: {
              id: landing.id,
              store_name: landing.store_name,
              google_url: landing.google_url,
              yelp_url: landing.yelp_url,
            },
            limitReached: true,
          })
        }
      }
    }

    const ip = getClientIP(req)
    const ipHash = hashIP(ip)
    
    // Increment view count in KV
    try {
      await kv.incr(`views:${id}`)
    } catch (error) {
      console.error('View count increment error:', error)
    }

    // Check for cached review
    const cacheKey = `review_cache:${id}:${ipHash}`
    const eventCacheKey = `review_event:${id}:${ipHash}`
    
    let cachedReview: string | null = null
    let cachedEventId: string | null = null
    
    try {
      cachedReview = await kv.get<string>(cacheKey)
      cachedEventId = await kv.get<string>(eventCacheKey)
    } catch (error) {
      console.error('Cache read error:', error)
    }

    let review: string
    let reviewEventId: string | null = null

    if (cachedReview && !regenerate) {
      review = cachedReview
      reviewEventId = cachedEventId
    } else {
      // Handle regeneration rate limiting
      if (regenerate) {
        let userTier: SubscriptionTier | 'demo' = isDemo ? 'demo' : SubscriptionTier.FREE
        let rateLimit: number = getRegenerationLimit('demo')
        
        if (!isDemo) {
          const { rows: tierRows } = await sql`
            SELECT u.subscription_tier 
            FROM landing_pages lp
            JOIN stores s ON lp.store_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE lp.id = ${id}
          `
          userTier = (tierRows[0]?.subscription_tier || SubscriptionTier.FREE) as SubscriptionTier
          rateLimit = getRegenerationLimit(userTier)
        }
        
        const rateLimitResult = await checkRateLimit(ip, id, rateLimit)
        
        if (!rateLimitResult.allowed) {
          const minutes = Math.ceil(rateLimitResult.resetIn / 60000)
          
          if (userTier === SubscriptionTier.FREE && !isDemo) {
            try {
              await sql`
                UPDATE landing_pages 
                SET blocked_regenerations = COALESCE(blocked_regenerations, 0) + 1
                WHERE id = ${id}
              `
            } catch (error) {
              console.error('Failed to increment blocked_regenerations:', error)
            }
            
            return res.status(429).json({ 
              error: 'Free plan rate limit', 
              message: `Free plan allows 1 review per user. Upgrade to Pro for unlimited regenerations!`,
              resetIn: rateLimitResult.resetIn,
              isPlanLimit: true
            })
          }
          
          return res.status(429).json({ 
            error: 'Rate limit exceeded', 
            message: `Too many regenerations. Try again in ${minutes} minutes.`,
            resetIn: rateLimitResult.resetIn
          })
        }
      }
      
      // Generate new review
      const result = await generateReview(landing as LandingWithStore)
      review = result.review
      
      // Save review event for analytics (skip demo)
      if (!isDemo && landing.store_id) {
        try {
          const keywordsJson = JSON.stringify(result.metadata.keywordsUsed || [])
          const expectationsJson = JSON.stringify(result.metadata.expectationsUsed || [])
          
          const { rows: [event] } = await sql`
            INSERT INTO review_events (
              landing_page_id, 
              store_id, 
              review_text, 
              keywords_used, 
              expectations_used, 
              length_type, 
              persona, 
              ip_hash
            ) VALUES (
              ${id},
              ${landing.store_id},
              ${review},
              CASE WHEN ${keywordsJson}::text = '[]' THEN NULL 
                   ELSE (SELECT array_agg(x) FROM json_array_elements_text(${keywordsJson}::json) AS x) END,
              CASE WHEN ${expectationsJson}::text = '[]' THEN NULL 
                   ELSE (SELECT array_agg(x) FROM json_array_elements_text(${expectationsJson}::json) AS x) END,
              ${result.metadata.lengthType},
              ${result.metadata.persona},
              ${ipHash}
            )
            RETURNING id
          `
          reviewEventId = event?.id || null
          
          if (reviewEventId) {
            await kv.set(eventCacheKey, reviewEventId, { ex: RATE_LIMIT.CACHE_TTL_SECONDS })
          }
        } catch (error) {
          console.error('Failed to save review event:', error)
        }
      }
      
      // Cache the review
      try {
        await kv.set(cacheKey, review, { ex: RATE_LIMIT.CACHE_TTL_SECONDS })
      } catch (error) {
        console.error('Cache write error:', error)
      }
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
      reviewEventId,
    })
  } catch (error) {
    console.error('Generate API error:', error)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
