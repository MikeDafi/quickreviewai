import { sql } from '@vercel/postgres'

export { sql }

// ============ Input Sanitization ============
// Prevents XSS, script injection, and other malicious input

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick=, onerror=, etc.
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<link/gi,
  /<meta/gi,
  /data:/gi,
  /vbscript:/gi,
]

export function sanitizeString(input: string | undefined | null): string | null {
  if (!input) return null
  
  let sanitized = input.trim()
  
  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }
  
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  
  // Limit length to prevent abuse
  return sanitized.slice(0, 500)
}

export function sanitizeUrl(url: string | undefined | null): string | null {
  if (!url) return null
  
  const trimmed = url.trim()
  
  // Only allow http and https URLs
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null
  }
  
  // Check for javascript: or data: embedded in URL
  if (/javascript:|data:|vbscript:/i.test(trimmed)) {
    return null
  }
  
  // Limit length
  return trimmed.slice(0, 2000)
}

export function sanitizeAddress(address: string | undefined | null): string | null {
  if (!address) return null
  
  let sanitized = address.trim()
  
  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }
  
  // Basic HTML entity escape
  sanitized = sanitized
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/"/g, '')
    .replace(/'/g, '')
  
  // Only allow alphanumeric, spaces, commas, periods, hyphens, and # for addresses
  sanitized = sanitized.replace(/[^\w\s,.\-#]/g, '')
  
  // Limit to reasonable address length
  return sanitized.slice(0, 300) || null
}

// Helper to get a user by ID
export async function getUser(id: string) {
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id}`
  return rows[0] || null
}

// Helper to get a user by email
export async function getUserByEmail(email: string) {
  const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`
  return rows[0] || null
}

// Helper to create or update user (for NextAuth)
export async function upsertUser(user: { id: string; email: string; name?: string }) {
  const { rows } = await sql`
    INSERT INTO users (id, email, name)
    VALUES (${user.id}, ${user.email}, ${user.name || null})
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name
    RETURNING *
  `
  return rows[0]
}

// Get stores for a user
export async function getStores(userId: string) {
  const { rows } = await sql`
    SELECT s.*, 
      (SELECT COUNT(*) FROM landing_pages WHERE store_id = s.id) as landing_page_count,
      (SELECT id FROM landing_pages WHERE store_id = s.id ORDER BY created_at LIMIT 1) as landing_page_id
    FROM stores s 
    WHERE s.user_id = ${userId}
    ORDER BY s.created_at DESC
  `
  return rows
}

// Get a single store
export async function getStore(storeId: string, userId: string) {
  const { rows } = await sql`
    SELECT * FROM stores WHERE id = ${storeId} AND user_id = ${userId}
  `
  return rows[0] || null
}

// Helper to convert array to PostgreSQL array literal
function toPostgresArray(arr: string[] | undefined): string | null {
  if (!arr || arr.length === 0) return null
  return `{${arr.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}`
}

// Create a store
export async function createStore(data: {
  userId: string
  name: string
  address?: string
  businessType?: string
  keywords?: string[]
  reviewExpectations?: string[]
  googleUrl?: string
  yelpUrl?: string
}) {
  // Sanitize all inputs
  const safeName = sanitizeString(data.name)
  const safeAddress = sanitizeAddress(data.address)
  const safeBusinessType = sanitizeString(data.businessType)
  const safeGoogleUrl = sanitizeUrl(data.googleUrl)
  const safeYelpUrl = sanitizeUrl(data.yelpUrl)
  const safeKeywords = data.keywords?.map(k => sanitizeString(k)).filter(Boolean) as string[] | undefined
  const safeExpectations = data.reviewExpectations?.map(e => sanitizeString(e)).filter(Boolean) as string[] | undefined
  
  const keywordsArray = toPostgresArray(safeKeywords)
  const expectationsArray = toPostgresArray(safeExpectations)
  
  const { rows } = await sql`
    INSERT INTO stores (user_id, name, address, business_type, keywords, review_expectations, google_url, yelp_url)
    VALUES (
      ${data.userId},
      ${safeName},
      ${safeAddress},
      ${safeBusinessType},
      ${keywordsArray}::text[],
      ${expectationsArray}::text[],
      ${safeGoogleUrl},
      ${safeYelpUrl}
    )
    RETURNING *
  `
  return rows[0]
}

// Update a store
export async function updateStore(storeId: string, userId: string, data: {
  name?: string
  address?: string
  businessType?: string
  keywords?: string[]
  reviewExpectations?: string[]
  googleUrl?: string
  yelpUrl?: string
}) {
  // Sanitize all inputs
  const safeName = sanitizeString(data.name)
  const safeAddress = sanitizeAddress(data.address)
  const safeBusinessType = sanitizeString(data.businessType)
  const safeGoogleUrl = sanitizeUrl(data.googleUrl)
  const safeYelpUrl = sanitizeUrl(data.yelpUrl)
  const safeKeywords = data.keywords?.map(k => sanitizeString(k)).filter(Boolean) as string[] | undefined
  const safeExpectations = data.reviewExpectations?.map(e => sanitizeString(e)).filter(Boolean) as string[] | undefined
  
  const keywordsArray = toPostgresArray(safeKeywords)
  const expectationsArray = toPostgresArray(safeExpectations)
  
  const { rows } = await sql`
    UPDATE stores SET
      name = COALESCE(${safeName}, name),
      address = COALESCE(${safeAddress}, address),
      business_type = COALESCE(${safeBusinessType}, business_type),
      keywords = COALESCE(${keywordsArray}::text[], keywords),
      review_expectations = COALESCE(${expectationsArray}::text[], review_expectations),
      google_url = COALESCE(${safeGoogleUrl}, google_url),
      yelp_url = COALESCE(${safeYelpUrl}, yelp_url)
    WHERE id = ${storeId} AND user_id = ${userId}
    RETURNING *
  `
  return rows[0]
}

// Delete a store
export async function deleteStore(storeId: string, userId: string) {
  await sql`DELETE FROM stores WHERE id = ${storeId} AND user_id = ${userId}`
}

// Get landing page by ID (public)
export async function getLandingPage(id: string) {
  const { rows } = await sql`
    SELECT lp.*, s.name as store_name, s.business_type, s.keywords, 
           s.review_expectations, s.google_url, s.yelp_url
    FROM landing_pages lp
    JOIN stores s ON lp.store_id = s.id
    WHERE lp.id = ${id} AND lp.is_active = true
  `
  return rows[0] || null
}

// Create landing page for a store
export async function createLandingPage(storeId: string) {
  const { rows } = await sql`
    INSERT INTO landing_pages (store_id)
    VALUES (${storeId})
    RETURNING *
  `
  return rows[0]
}

// Update landing page cache
export async function updateLandingPageCache(id: string, review: string) {
  await sql`
    UPDATE landing_pages 
    SET cached_review = ${review}, cached_at = NOW()
    WHERE id = ${id}
  `
}

// Increment view count
export async function incrementViewCount(id: string) {
  await sql`UPDATE landing_pages SET view_count = view_count + 1 WHERE id = ${id}`
}

// Increment copy count
export async function incrementCopyCount(id: string) {
  await sql`UPDATE landing_pages SET copy_count = copy_count + 1 WHERE id = ${id}`
}

// Get landing pages for a store
export async function getLandingPages(storeId: string) {
  const { rows } = await sql`
    SELECT * FROM landing_pages WHERE store_id = ${storeId} ORDER BY created_at DESC
  `
  return rows
}
