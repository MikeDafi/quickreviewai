import { sql } from '@vercel/postgres'

export { sql }

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
      (SELECT COUNT(*) FROM landing_pages WHERE store_id = s.id) as landing_page_count
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
  businessType?: string
  keywords?: string[]
  tone?: string
  promptGuidance?: string
  googleUrl?: string
  yelpUrl?: string
}) {
  const keywordsArray = toPostgresArray(data.keywords)
  const { rows } = await sql`
    INSERT INTO stores (user_id, name, business_type, keywords, tone, prompt_guidance, google_url, yelp_url)
    VALUES (
      ${data.userId},
      ${data.name},
      ${data.businessType || null},
      ${keywordsArray}::text[],
      ${data.tone || 'friendly'},
      ${data.promptGuidance || null},
      ${data.googleUrl || null},
      ${data.yelpUrl || null}
    )
    RETURNING *
  `
  return rows[0]
}

// Update a store
export async function updateStore(storeId: string, userId: string, data: {
  name?: string
  businessType?: string
  keywords?: string[]
  tone?: string
  promptGuidance?: string
  googleUrl?: string
  yelpUrl?: string
}) {
  const keywordsArray = toPostgresArray(data.keywords)
  const { rows } = await sql`
    UPDATE stores SET
      name = COALESCE(${data.name || null}, name),
      business_type = COALESCE(${data.businessType || null}, business_type),
      keywords = COALESCE(${keywordsArray}::text[], keywords),
      tone = COALESCE(${data.tone || null}, tone),
      prompt_guidance = COALESCE(${data.promptGuidance || null}, prompt_guidance),
      google_url = COALESCE(${data.googleUrl || null}, google_url),
      yelp_url = COALESCE(${data.yelpUrl || null}, yelp_url)
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
    SELECT lp.*, s.name as store_name, s.business_type, s.keywords, s.tone, 
           s.prompt_guidance, s.google_url, s.yelp_url
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

