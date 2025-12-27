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
// Also restores soft-deleted accounts when user signs in again
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

// Get stores for a user with analytics (optimized with JOINs instead of subqueries)
export async function getStores(userId: string) {
  const { rows } = await sql`
    SELECT 
      s.*,
      COUNT(lp.id)::int as landing_page_count,
      MIN(lp.id) as landing_page_id,
      COALESCE(SUM(lp.view_count), 0)::int as view_count,
      COALESCE(SUM(lp.copy_count), 0)::int as copy_count
    FROM stores s
    LEFT JOIN landing_pages lp ON lp.store_id = s.id
    WHERE s.user_id = ${userId}
    GROUP BY s.id
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

// Helper to convert array to JSON string for PostgreSQL
// Using JSON instead of manual PostgreSQL array literal to prevent injection
function toJsonArray(arr: string[] | undefined): string | null {
  if (!arr || arr.length === 0) return null
  // JSON.stringify properly escapes all special characters
  return JSON.stringify(arr)
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
  
  const keywordsJson = toJsonArray(safeKeywords)
  const expectationsJson = toJsonArray(safeExpectations)
  
  // Use PostgreSQL's array() function with json_array_elements_text for safe conversion
  // This avoids manual string interpolation that could lead to SQL injection
  const { rows } = await sql`
    INSERT INTO stores (user_id, name, address, business_type, keywords, review_expectations, google_url, yelp_url)
    VALUES (
      ${data.userId},
      ${safeName},
      ${safeAddress},
      ${safeBusinessType},
      CASE WHEN ${keywordsJson}::text IS NULL THEN NULL 
           ELSE (SELECT array_agg(x) FROM json_array_elements_text(${keywordsJson}::json) AS x) END,
      CASE WHEN ${expectationsJson}::text IS NULL THEN NULL 
           ELSE (SELECT array_agg(x) FROM json_array_elements_text(${expectationsJson}::json) AS x) END,
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
  
  const keywordsJson = toJsonArray(safeKeywords)
  const expectationsJson = toJsonArray(safeExpectations)
  
  // Use PostgreSQL's array() function with json_array_elements_text for safe conversion
  const { rows } = await sql`
    UPDATE stores SET
      name = COALESCE(${safeName}, name),
      address = COALESCE(${safeAddress}, address),
      business_type = COALESCE(${safeBusinessType}, business_type),
      keywords = COALESCE(
        CASE WHEN ${keywordsJson}::text IS NULL THEN NULL 
             ELSE (SELECT array_agg(x) FROM json_array_elements_text(${keywordsJson}::json) AS x) END,
        keywords
      ),
      review_expectations = COALESCE(
        CASE WHEN ${expectationsJson}::text IS NULL THEN NULL 
             ELSE (SELECT array_agg(x) FROM json_array_elements_text(${expectationsJson}::json) AS x) END,
        review_expectations
      ),
      google_url = COALESCE(${safeGoogleUrl}, google_url),
      yelp_url = COALESCE(${safeYelpUrl}, yelp_url)
    WHERE id = ${storeId} AND user_id = ${userId}
    RETURNING *
  `
  return rows[0]
}

// Delete a store (preserves scan/copy counts in user's current billing period)
export async function deleteStore(storeId: string, userId: string) {
  // First, get the scan/copy counts from landing pages for this store
  const { rows: statsRows } = await sql`
    SELECT 
      COALESCE(SUM(view_count), 0)::int as scans,
      COALESCE(SUM(copy_count), 0)::int as copies
    FROM landing_pages 
    WHERE store_id = ${storeId}
  `
  
  const scans = statsRows[0]?.scans || 0
  const copies = statsRows[0]?.copies || 0
  
  // Add these counts to the user's current period totals before deleting
  // This ensures deleted store scans still count toward monthly limit
  if (scans > 0 || copies > 0) {
    await sql`
      UPDATE users 
      SET 
        period_scans = COALESCE(period_scans, 0) + ${scans},
        period_copies = COALESCE(period_copies, 0) + ${copies}
      WHERE id = ${userId}
    `
  }
  
  // Delete the landing pages first (they reference the store)
  await sql`DELETE FROM landing_pages WHERE store_id = ${storeId}`
  
  // Then delete the store
  await sql`DELETE FROM stores WHERE id = ${storeId} AND user_id = ${userId}`
}

// Helper to calculate if we're in a new billing period (monthly from account creation)
export function isNewBillingPeriod(accountCreatedAt: Date, periodStart: Date | null): boolean {
  const now = new Date()
  
  // If no period start recorded, we need to initialize it
  if (!periodStart) return true
  
  // Get the day of month when account was created (billing anchor)
  const billingDay = accountCreatedAt.getDate()
  
  // Calculate the start of the current billing period
  let currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), billingDay)
  
  // If we haven't reached the billing day this month yet, go back a month
  if (now < currentPeriodStart) {
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, billingDay)
  }
  
  // Handle edge case: if billing day doesn't exist in a month (e.g., 31st in February)
  // The Date constructor handles this by rolling to the next month, so we cap it
  const lastDayOfMonth = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, 0).getDate()
  if (billingDay > lastDayOfMonth) {
    currentPeriodStart = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth(), lastDayOfMonth)
  }
  
  // If the recorded period start is before the current period start, it's a new period
  return periodStart < currentPeriodStart
}

// Reset user's billing period stats
export async function resetBillingPeriod(userId: string) {
  await sql`
    UPDATE users 
    SET 
      period_scans = 0,
      period_copies = 0,
      period_start = NOW()
    WHERE id = ${userId}
  `
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
