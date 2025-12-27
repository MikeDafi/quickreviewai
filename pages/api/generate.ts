import type { NextApiRequest, NextApiResponse } from 'next'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { kv } from '@vercel/kv'
import { getLandingPage, incrementCopyCount, sql } from '@/lib/db'
import crypto from 'crypto'

// Validate required environment variables at module load
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// Rate limiting config
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60 // 1 hour
const CACHE_TTL_SECONDS = 24 * 60 * 60 // 24 hours for cached reviews

// Hash IP for privacy
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)
}

// Get real client IP - use Vercel's trusted headers (cannot be spoofed)
function getClientIP(req: NextApiRequest): string {
  // x-real-ip is set by Vercel's edge network and is trustworthy
  const realIp = req.headers['x-real-ip'] as string
  if (realIp) return realIp
  
  // x-vercel-forwarded-for is also set by Vercel and trustworthy
  const vercelForwardedFor = req.headers['x-vercel-forwarded-for'] as string
  if (vercelForwardedFor) return vercelForwardedFor.split(',')[0].trim()
  
  // In development or non-Vercel environments, use socket address
  // Do NOT trust x-forwarded-for as it can be spoofed by clients
  return req.socket.remoteAddress || 'unknown'
}

// Rate limits per tier (for regeneration)
const RATE_LIMITS = {
  demo: 3,   // Demo page: 3 per hour
  free: 1,   // Free users: 1 per hour per landing page
  pro: 10,   // Pro users: 10 per hour per landing page
}

// Monthly scan limits per tier
const SCAN_LIMITS = {
  free: 15,      // 15 scans/month for free users
  pro: Infinity, // Unlimited for pro
  business: Infinity,
}

async function checkRateLimit(ip: string, landingId: string, maxRequests: number): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `ratelimit:${ip}:${landingId}`
  
  try {
    // Get current count
    const count = await kv.get<number>(key) || 0
    
    if (count >= maxRequests) {
      // Get TTL to know when it resets
      const ttl = await kv.ttl(key)
      return { allowed: false, remaining: 0, resetIn: Math.max(ttl, 0) * 1000 }
    }
    
    // Increment counter
    const newCount = await kv.incr(key)
    
    // Set expiry only on first request (when count was 0)
    if (newCount === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW_SECONDS)
    }
    
    return { 
      allowed: true, 
      remaining: maxRequests - newCount, 
      resetIn: RATE_LIMIT_WINDOW_SECONDS * 1000 
    }
  } catch (error) {
    // If KV fails, allow the request (fail open)
    console.error('Rate limit check failed:', error)
    return { allowed: true, remaining: maxRequests, resetIn: RATE_LIMIT_WINDOW_SECONDS * 1000 }
  }
}

interface LandingWithStore {
  store_name: string
  business_type: string
  keywords: string[]
  review_expectations?: string[]
}

// Character personas for variety
const CHARACTER_PERSONAS = [
  // Regular customers
  'a regular local customer who visits often',
  'been coming here for years and finally writing a review',
  'a loyal customer who keeps coming back every week',
  'someone who lives nearby and walks here all the time',
  
  // First timers
  'a first-time visitor who was pleasantly surprised',
  'skeptical at first but totally converted now',
  'finally tried this place after walking past it a hundred times',
  'tourist visiting the area who stumbled upon this gem',
  
  // Professionals
  'a busy professional who values efficiency and quality',
  'work nearby and this has become my go-to spot',
  'grabbed lunch here between meetings',
  'remote worker who needed a change of scenery',
  
  // Parents and families
  'a parent with young kids who appreciates kid-friendly places',
  'brought the whole family including picky eaters',
  'mom of three looking for places that work for everyone',
  'grandparent taking grandkids out for a treat',
  
  // Age groups
  'an older customer who appreciates good old-fashioned service',
  'young adult who found this through TikTok actually',
  'college student on a budget',
  'retiree with time to enjoy the little things',
  
  // Social situations
  'someone celebrating a special occasion',
  'brought my date here and wanted to impress them',
  'met up with old friends I hadn\'t seen in months',
  'hosting out-of-town relatives',
  'girls night out with my friends',
  'guys trip and we needed fuel',
  
  // Personalities
  'a non-native English speaker who moved here recently',
  'someone who doesn\'t usually write reviews but felt compelled to',
  'a skeptic who was won over despite low expectations',
  'a foodie/enthusiast who knows quality when I see it',
  'quiet introvert who appreciated the chill atmosphere',
  'someone who\'s tried basically every place in town',
  'picky eater who\'s hard to please',
  'someone with dietary restrictions who usually struggles',
  
  // Situational
  'someone in a rush who was impressed by speed',
  'had a rough day and needed something to cheer me up',
  'recovering from being sick and this hit the spot',
  'jet-lagged traveler who needed exactly this',
  'hungover and desperate for good food',
  'pregnant and dealing with weird cravings',
  'post-workout and starving',
  'killing time before a movie nearby',
  
  // Referral types
  'my coworker wouldn\'t stop talking about this place',
  'my partner dragged me here and I\'m glad they did',
  'saw this on Instagram and had to check it out',
  'Yelp recommended this and for once it was right',
  'read about this in a local blog',
  
  // Quirky/specific
  'night owl who appreciates late hours',
  'morning person who needs early options',
  'someone who judges places by their bathroom cleanliness',
  'former industry worker who knows what good service looks like',
  'someone who\'s lived in 5 different cities and has high standards',
]

// Reasons for visiting
const VISIT_REASONS = [
  // Work related
  'stopped by on my lunch break',
  'came here after a long day at work',
  'needed coffee before a big meeting',
  'grabbed something quick between appointments',
  'working remotely and needed to get out of the house',
  'celebrating finally finishing a big project',
  'stress eating after a rough day at the office',
  
  // Social
  'my friend recommended this place months ago',
  'came here for a birthday celebration',
  'met up with friends I hadn\'t seen in forever',
  'first date and wanted somewhere casual but good',
  'anniversary dinner with my partner',
  'catching up with an old college roommate',
  'team lunch with coworkers',
  'baby shower for my sister',
  'post-funeral gathering needed comfort food',
  
  // Discovery
  'found it while walking around the neighborhood',
  'saw good reviews online and had to try it',
  'drove past this place every day and finally stopped',
  'Google maps said this was nearby when I was starving',
  'the place I usually go to was closed so tried this instead',
  'taking a different route home and spotted it',
  'Uber driver recommended it actually',
  
  // Repeat visits
  'been coming here for years honestly',
  'this is probably my tenth time here',
  'came back after a great first experience last month',
  'dragged my family here because I couldn\'t stop talking about it',
  'brought friends from out of town to show off the local spots',
  
  // Timing
  'needed something quick before catching a flight',
  'late night craving hit hard',
  'early morning before everyone else woke up',
  'rainy day and needed somewhere cozy',
  'it was hot outside and needed AC and cold drinks',
  'waiting for my car at the shop nearby',
  'killing time before a doctor\'s appointment',
  
  // Circumstantial  
  'treating myself after a long week',
  'reward for hitting the gym this morning',
  'comfort food after a breakup honestly',
  'celebrating getting a new job',
  'needed to get out of the house during renovations',
  'first outing after being sick for a week',
  'wanted to try something new instead of cooking',
  'groceries looked sad so decided to eat out instead',
  
  // Family
  'brought my family here for dinner',
  'kids were begging to go somewhere',
  'needed to entertain visiting in-laws',
  'took my mom out for Mother\'s Day',
  'dad was in town and wanted to show him around',
  'family tradition every Sunday',
  
  // Specific needs
  'needed a place with good wifi to work',
  'looking for somewhere with outdoor seating',
  'wanted to try their new menu items',
  'heard they had vegan options finally',
  'craving specifically what they make here',
  'only place open this late that looked decent',
]

// Helper to pick random items from array
function pickRandom<T>(arr: T[], count: number): T[] {
  if (arr.length === 0) return []
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

// Helper to pick one random item
function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Example REAL human reviews to guide the model
const EXAMPLE_HUMAN_REVIEWS = [
  "Ok so I was skeptical but my coworker kept bugging me to try this place. Finally gave in last Tuesday and damn, she was right. Got the chicken sandwich and it was honestly really good. Nothing fancy but just solid food you know?",
  "Came here with my bf for our anniversary. Wasn't sure what to expect but the waiter was super nice and helped us pick out wine. Food took a while but worth the wait imo",
  "3rd time here this month lol. Can't stop thinking about their tacos. My kids are obsessed too which is rare because they're picky af. Parking kinda sucks but whatever",
  "Finally a place that gets it right. I've tried like 5 other spots in the area and this one actually knows what they're doing. The owner remembered my name on my second visit which was cool",
  "Not gonna lie, I almost didn't come in bc it looked empty but so glad I did. Super chill vibe, good music playing, and the coffee was strong without being bitter. New go-to for sure",
  "My mom recommended this place and she's usually wrong about restaurants lmao but this time she nailed it. We shared a few dishes and everything was fresh. Waitress was a little slow but no big deal",
  "Stopped in on a whim while waiting for my car at the shop next door. Pleasantly surprised! Nothing groundbreaking but everything was done well. The soup hit different on a cold day like today",
  "Been meaning to try this spot forever. Finally made it last weekend with some friends. We got way too much food but no regrets. That dessert though... I'm still thinking about it",
]

// Ultra-short examples for very brief reviews
const ULTRA_SHORT_EXAMPLES = [
  "Solid spot. Been here twice now",
  "Finally tried it, not disappointed",
  "My new go-to",
  "The hype is real ngl",
  "Better than expected tbh",
  "Good stuff, fair prices",
  "Came for the reviews, staying for the food",
  "Worth the wait",
  "10/10 would come back",
  "Exactly what I needed",
  "Can't complain",
  "Slaps every time",
  "Pretty decent actually",
  "They know what they're doing here",
]

async function generateReview(landing: LandingWithStore): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  // Pick 1-2 random keywords
  const keywordCount = Math.random() < 0.6 ? 1 : 2
  const selectedKeywords = landing.keywords && landing.keywords.length > 0 
    ? pickRandom(landing.keywords, keywordCount)
    : ['good']
  const keywordsStr = selectedKeywords.join(' and ')

  // Pick 0-1 random expectations (sometimes none)
  const expectationCount = Math.random() < 0.4 ? 0 : 1
  const selectedExpectations = landing.review_expectations && landing.review_expectations.length > 0
    ? pickRandom(landing.review_expectations, expectationCount)
    : []
  const expectationsStr = selectedExpectations.length > 0 ? selectedExpectations[0] : ''

  // Random review length profile (real reviews vary wildly)
  const lengthProfiles = [
    { type: 'ultra-short', instruction: '6-10 words only. Just a quick one-liner reaction.', weight: 1 },
    { type: 'ultra-short', instruction: '6-10 words only. Just a quick one-liner reaction.', weight: 1 },
    { type: 'short', instruction: '1-2 sentences. Brief but gets the point across.', weight: 2 },
    { type: 'short', instruction: '1-2 sentences. Brief but gets the point across.', weight: 2 },
    { type: 'short', instruction: '1-2 sentences. Brief but gets the point across.', weight: 2 },
    { type: 'medium', instruction: '3-4 sentences. Standard review length.', weight: 3 },
    { type: 'medium', instruction: '3-4 sentences. Standard review length.', weight: 3 },
    { type: 'medium', instruction: '3-4 sentences. Standard review length.', weight: 3 },
    { type: 'medium', instruction: '3-4 sentences. Standard review length.', weight: 3 },
    { type: 'long', instruction: '5-6 sentences with some detail.', weight: 2 },
    { type: 'long', instruction: '5-6 sentences with some detail.', weight: 2 },
    { type: 'extended', instruction: '2 short paragraphs. Tell a story about the experience.', weight: 1 },
  ]
  const lengthProfile = pickOne(lengthProfiles)

  // Random character persona
  const persona = pickOne(CHARACTER_PERSONAS)
  
  // Random visit reason
  const visitReason = pickOne(VISIT_REASONS)

  // Random quirks that real people have
  const quirks = []
  if (Math.random() < 0.3) quirks.push('use "lol", "lmao", or "haha" once')
  if (Math.random() < 0.25) quirks.push('use "gonna", "kinda", "gotta", or "wanna"')
  if (Math.random() < 0.2) quirks.push('include a minor typo like "teh", "definately", "resturant", or missing apostrophe')
  if (Math.random() < 0.3) quirks.push('use "..." or "—" mid-thought')
  if (Math.random() < 0.25) quirks.push('abbreviate something like "bf", "bc", "tbh", "imo", or "ngl"')
  if (Math.random() < 0.2) quirks.push('start a sentence with "And" or "But" or "So"')
  if (Math.random() < 0.15) quirks.push('use lowercase "i" instead of "I" once')

  // Pick 2 example reviews to show
  const exampleReviews = pickRandom(EXAMPLE_HUMAN_REVIEWS, 2)

  // Handle multiple business types (comma-separated)
  const businessTypeDisplay = landing.business_type 
    ? landing.business_type.split(',').map(t => t.trim()).join(' / ')
    : 'business'
    
  const prompt = `Write a Google/Yelp review for "${landing.store_name}" (a ${businessTypeDisplay}).

YOU ARE: ${persona}
CONTEXT: ${visitReason}

WORK IN NATURALLY: ${keywordsStr}${expectationsStr ? ` and mention ${expectationsStr}` : ''}

LENGTH: ${lengthProfile.instruction}

${lengthProfile.type === 'ultra-short' ? `ULTRA-SHORT EXAMPLES (match this length):
"${pickRandom(ULTRA_SHORT_EXAMPLES, 3).join('", "')}"` : `HERE ARE REAL HUMAN REVIEWS FOR REFERENCE (match this vibe, NOT the content):
"${exampleReviews[0]}"
"${exampleReviews[1]}"`}

CRITICAL - SOUND HUMAN BY:
${quirks.length > 0 ? quirks.map(q => `• ${q}`).join('\n') : '• Write casually like texting a friend'}
• Use contractions (don't, wasn't, couldn't, it's)
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

Just write the review. No quotes. No "Here's a review:" preamble.`

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1.4, // Even higher for more natural variation
        topP: 0.95,
        topK: 50,
      },
    })
    const response = result.response
    return response.text().trim().replace(/^["']|["']$/g, '') // Remove any wrapping quotes
  } catch (error) {
    console.error('Gemini API error:', error)
    // Fallback review if API fails
    return `Solid spot. Came here last week and was impressed with the ${selectedKeywords[0] || 'vibe'}. Would come back.`
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
      // Generic error - don't confirm whether ID format is valid
      return res.status(404).json({ error: 'Not found' })
    }

    // Check monthly scan limit for the store owner (skip for demo)
    const isDemo = id === 'demo'
    if (!isDemo) {
      const { rows: [scanCheck] } = await sql`
        SELECT 
          COALESCE(u.subscription_tier, 'free') as tier,
          COALESCE(u.period_scans, 0) + COALESCE(SUM(lp.view_count), 0) as total_scans
        FROM landing_pages lp
        JOIN stores s ON lp.store_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE lp.id = ${id}
        GROUP BY u.id, u.subscription_tier, u.period_scans
      `
      
      if (scanCheck) {
        const tier = (scanCheck.tier || 'free') as keyof typeof SCAN_LIMITS
        const limit = SCAN_LIMITS[tier] ?? SCAN_LIMITS.free
        const totalScans = parseInt(scanCheck.total_scans) || 0
        
        if (totalScans >= limit) {
          return res.status(403).json({
            error: 'Scan limit reached',
            message: 'This business has reached their monthly scan limit. Please try again next month.',
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

    // Get visitor's IP address (using trusted headers only)
    const ip = getClientIP(req)
    const ipHash = hashIP(ip)
    
    // Increment view count in KV (batched, syncs to DB every 10 min)
    try {
      await kv.incr(`views:${id}`)
    } catch (error) {
      console.error('View count increment error:', error)
    }

    // Check for IP-specific cached review in Vercel KV
    const cacheKey = `review_cache:${id}:${ipHash}`
    let cachedReview: string | null = null
    
    try {
      cachedReview = await kv.get<string>(cacheKey)
    } catch (error) {
      console.error('Cache read error:', error)
    }

    let review: string

    if (cachedReview && !regenerate) {
      // Use the cached review for this IP
      review = cachedReview
    } else {
      // Rate limit regenerations (using Vercel KV)
      if (regenerate) {
        // Demo page has special handling
        const isDemo = id === 'demo'
        
        let userTier: string = 'free'
        let rateLimit: number = RATE_LIMITS.demo
        
        if (isDemo) {
          // Demo page: 3 per hour for anyone
          rateLimit = RATE_LIMITS.demo
        } else {
          // Get the store owner's subscription tier
          const { rows: tierRows } = await sql`
            SELECT u.subscription_tier 
            FROM landing_pages lp
            JOIN stores s ON lp.store_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE lp.id = ${id}
          `
          userTier = tierRows[0]?.subscription_tier || 'free'
          rateLimit = userTier === 'pro' ? RATE_LIMITS.pro : RATE_LIMITS.free
        }
        
        const rateLimitResult = await checkRateLimit(ip, id, rateLimit)
        
        if (!rateLimitResult.allowed) {
          const minutes = Math.ceil(rateLimitResult.resetIn / 60000)
          
          // Different message for free users
          if (userTier === 'free' && !isDemo) {
            return res.status(429).json({ 
              error: 'Free plan rate limit', 
              message: `Free plan allows 1 regeneration per hour. Upgrade to Pro for 10/hour! Try again in ${minutes} minutes.`,
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
      review = await generateReview(landing as LandingWithStore)
      
      // Cache the review for this specific IP (24 hour TTL)
      try {
        await kv.set(cacheKey, review, { ex: CACHE_TTL_SECONDS })
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
    })
  } catch (error) {
    console.error('Generate API error:', error)
    // Generic error - don't leak internal details
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
