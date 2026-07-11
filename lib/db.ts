import { sql } from '@vercel/postgres'

export { sql }

/**
 * Run a DB operation with one retry on transient failures.
 *
 * Serverless Postgres (Neon via @vercel/postgres) occasionally throws transient
 * connection/timeout errors under bursty load or cold starts. A single quick
 * retry recovers from the vast majority of these without surfacing a 500.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 150): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }
  throw lastError
}

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
    INSERT INTO users (id, email, name, deleted_at)
    VALUES (${user.id}, ${user.email}, ${user.name || null}, NULL)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      deleted_at = NULL
    RETURNING *
  `
  return rows[0]
}

// Get stores for a user with analytics (optimized with JOINs instead of subqueries)
export async function getStores(userId: string) {
  try {
    // Try query with exceeded_scans column
    const { rows } = await sql`
      SELECT 
        s.*,
        COUNT(lp.id)::int as landing_page_count,
        MIN(lp.id) as landing_page_id,
        COALESCE(SUM(lp.view_count), 0)::int as view_count,
        COALESCE(SUM(lp.copy_count), 0)::int as copy_count,
        COALESCE(SUM(lp.blocked_regenerations), 0)::int as blocked_regenerations,
        COALESCE(SUM(lp.exceeded_scans), 0)::int as exceeded_scans
      FROM stores s
      LEFT JOIN landing_pages lp ON lp.store_id = s.id
      WHERE s.user_id = ${userId}
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `
    return rows
  } catch (error) {
    // Fallback query without exceeded_scans (for databases that haven't been migrated)
    console.warn('getStores: exceeded_scans column may not exist, falling back to query without it', error)
    const { rows } = await sql`
      SELECT 
        s.*,
        COUNT(lp.id)::int as landing_page_count,
        MIN(lp.id) as landing_page_id,
        COALESCE(SUM(lp.view_count), 0)::int as view_count,
        COALESCE(SUM(lp.copy_count), 0)::int as copy_count,
        COALESCE(SUM(lp.blocked_regenerations), 0)::int as blocked_regenerations,
        0 as exceeded_scans
      FROM stores s
      LEFT JOIN landing_pages lp ON lp.store_id = s.id
      WHERE s.user_id = ${userId}
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `
    return rows
  }
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
  googleUrl?: string | null
  yelpUrl?: string | null
}) {
  // Sanitize all inputs
  const safeName = sanitizeString(data.name)
  const safeAddress = sanitizeAddress(data.address)
  const safeBusinessType = sanitizeString(data.businessType)
  const safeKeywords = data.keywords?.map(k => sanitizeString(k)).filter(Boolean) as string[] | undefined
  const safeExpectations = data.reviewExpectations?.map(e => sanitizeString(e)).filter(Boolean) as string[] | undefined
  
  // For URLs: distinguish between "not provided" (undefined) and "explicitly cleared" (null)
  // - undefined: keep existing value (use COALESCE)
  // - null: clear the value (set to NULL)
  // - string: validate and set new value
  const googleUrlProvided = 'googleUrl' in data
  const yelpUrlProvided = 'yelpUrl' in data
  const safeGoogleUrl = googleUrlProvided ? sanitizeUrl(data.googleUrl) : undefined
  const safeYelpUrl = yelpUrlProvided ? sanitizeUrl(data.yelpUrl) : undefined
  
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
      google_url = CASE 
        WHEN ${googleUrlProvided} THEN ${safeGoogleUrl}
        ELSE google_url 
      END,
      yelp_url = CASE 
        WHEN ${yelpUrlProvided} THEN ${safeYelpUrl}
        ELSE yelp_url 
      END
    WHERE id = ${storeId} AND user_id = ${userId}
    RETURNING *
  `
  return rows[0]
}

// Delete a store. Period scan/copy counts are already tracked in real time on
// the user (users.period_scans/period_copies), so deletion must NOT re-add the
// store's lifetime view/copy counts here — that would double-count the current
// period and wrongly pull in prior periods.
export async function deleteStore(storeId: string, userId: string) {
  // SECURITY: First verify ownership before any operations
  const { rows: [store] } = await sql`
    SELECT id FROM stores WHERE id = ${storeId} AND user_id = ${userId}
  `
  
  if (!store) {
    // Store doesn't exist or user doesn't own it - fail silently to prevent enumeration
    return
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

// ============ Review Queue ============
// A per-store buffer of pre-generated reviews. Visitor requests are served from
// this queue (rotating so different visitors get different reviews); a row is
// popped only when copied, and the whole queue is cleared when content settings change.

export interface QueuedReviewInput {
  reviewText: string
  keywordsUsed?: string[]
  expectationsUsed?: string[]
  lengthType?: string
  reviewerContext?: string
}

// A stored row in the review_queue table
export interface QueuedReviewRow {
  id: string
  landing_page_id: string
  store_id: string
  review_text: string
  keywords_used: string[] | null
  expectations_used: string[] | null
  length_type: string | null
  reviewer_context: string | null
  served_count: number
  reserved_until: string | null
  created_at: string
  [key: string]: unknown
}

// Number of reviews currently buffered for a store
export async function getQueueCount(storeId: string): Promise<number> {
  const { rows } = await sql`
    SELECT COUNT(*)::int AS count FROM review_queue WHERE store_id = ${storeId}
  `
  return rows[0]?.count || 0
}

// Insert one or more pre-generated reviews into a store's queue
export async function enqueueReviews(
  landingPageId: string,
  storeId: string,
  reviews: QueuedReviewInput[]
): Promise<number> {
  let inserted = 0
  for (const review of reviews) {
    if (!review.reviewText) continue

    const keywordsJson = JSON.stringify(review.keywordsUsed || [])
    const expectationsJson = JSON.stringify(review.expectationsUsed || [])

    await sql`
      INSERT INTO review_queue (
        landing_page_id, store_id, review_text,
        keywords_used, expectations_used, length_type, reviewer_context
      ) VALUES (
        ${landingPageId},
        ${storeId},
        ${review.reviewText},
        CASE WHEN ${keywordsJson}::text = '[]' THEN NULL
             ELSE (SELECT array_agg(x) FROM json_array_elements_text(${keywordsJson}::json) AS x) END,
        CASE WHEN ${expectationsJson}::text = '[]' THEN NULL
             ELSE (SELECT array_agg(x) FROM json_array_elements_text(${expectationsJson}::json) AS x) END,
        ${review.lengthType || null},
        ${review.reviewerContext || null}
      )
    `
    inserted++
  }
  return inserted
}

// Atomically pick the next AVAILABLE review to serve (least-served, oldest first),
// increment its served_count, and place an exclusive lease on it for
// reservationSeconds so no other viewer is served the same review. Rows whose
// lease is still in the future are skipped; expired leases are treated as
// available. Uses FOR UPDATE SKIP LOCKED so concurrent visitors don't grab the
// same row. Returns null when no review is currently available (empty or all reserved).
export async function getNextQueuedReview(
  storeId: string,
  reservationSeconds: number
): Promise<QueuedReviewRow | null> {
  const { rows } = await sql<QueuedReviewRow>`
    WITH next AS (
      SELECT id FROM review_queue
      WHERE store_id = ${storeId}
        AND (reserved_until IS NULL OR reserved_until < NOW())
      ORDER BY served_count ASC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE review_queue rq
    SET served_count = rq.served_count + 1,
        reserved_until = NOW() + make_interval(secs => ${reservationSeconds})
    FROM next
    WHERE rq.id = next.id
    RETURNING rq.*
  `
  return rows[0] ?? null
}

// Release a viewer's exclusive lease so the review returns to the pool immediately
// (e.g., when the viewer regenerates/cycles to a different review).
export async function releaseQueuedReview(queueItemId: string): Promise<boolean> {
  const { rowCount } = await sql`
    UPDATE review_queue SET reserved_until = NULL WHERE id = ${queueItemId}
  `
  return (rowCount || 0) > 0
}

// Remove a single review from the queue (pop-on-copy)
export async function popQueuedReview(queueItemId: string): Promise<boolean> {
  const { rowCount } = await sql`
    DELETE FROM review_queue WHERE id = ${queueItemId}
  `
  return (rowCount || 0) > 0
}

// Clear a store's entire queue (called when content-affecting settings change)
export async function clearQueue(storeId: string): Promise<number> {
  const { rowCount } = await sql`
    DELETE FROM review_queue WHERE store_id = ${storeId}
  `
  return rowCount || 0
}

// Get the landing page IDs for a store (used to invalidate per-IP KV caches on reset)
export async function getLandingPageIds(storeId: string): Promise<string[]> {
  const { rows } = await sql`
    SELECT id FROM landing_pages WHERE store_id = ${storeId}
  `
  return rows.map((r) => r.id as string)
}
