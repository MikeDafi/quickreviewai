import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql, isNewBillingPeriod, resetBillingPeriod } from '@/lib/db'
import { kv } from '@vercel/kv'
import { SubscriptionTier, getPlanLimits, DEFAULTS } from '@/lib/constants'

// Sync pending view counts from KV to DB for a user's landing pages
async function syncUserViewCounts(userId: string) {
  try {
    // Get all landing page IDs for this user
    const { rows: landingPages } = await sql`
      SELECT lp.id 
      FROM landing_pages lp
      JOIN stores s ON lp.store_id = s.id
      WHERE s.user_id = ${userId}
    `
    
    // Sync each landing page's pending views
    for (const lp of landingPages) {
      const key = `views:${lp.id}`
      const count = await kv.getdel<number>(key)
      
      if (count && count > 0) {
        await sql`
          UPDATE landing_pages 
          SET view_count = view_count + ${count} 
          WHERE id = ${lp.id}
        `
      }
    }
  } catch (error) {
    console.error('Failed to sync view counts:', error)
    // Non-blocking - continue even if sync fails
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = session.user.id

  try {
    // Sync any pending view counts from KV before fetching stats
    await syncUserViewCounts(userId)
    
    // Combined query: get user info + store stats in one query
    const { rows } = await sql`
      SELECT 
        u.created_at,
        u.period_start,
        COALESCE(u.period_scans, 0)::int as period_scans,
        COALESCE(u.period_copies, 0)::int as period_copies,
        u.subscription_tier,
        COALESCE(SUM(lp.view_count), 0)::int as current_scans,
        COALESCE(SUM(lp.copy_count), 0)::int as current_copies,
        COALESCE(SUM(lp.blocked_regenerations), 0)::int as blocked_regenerations,
        COUNT(DISTINCT s.id)::int as store_count
      FROM users u
      LEFT JOIN stores s ON s.user_id = u.id
      LEFT JOIN landing_pages lp ON lp.store_id = s.id
      WHERE u.id = ${userId}
      GROUP BY u.id, u.created_at, u.period_start, u.period_scans, u.period_copies, u.subscription_tier
    `
    
    const data = rows[0]
    
    if (!data) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    let periodScans = data.period_scans
    let periodCopies = data.period_copies
    
    // Check if we need to reset the billing period (monthly from account creation)
    if (isNewBillingPeriod(new Date(data.created_at), data.period_start ? new Date(data.period_start) : null)) {
      await resetBillingPeriod(userId)
      // Reset the local values after DB update
      periodScans = 0
      periodCopies = 0
    }

    // Total for this billing period = current (from active stores) + period (from deleted stores)
    const totalScans = data.current_scans + periodScans
    const reviewsCopied = data.current_copies + periodCopies

    const tier = (data.subscription_tier || SubscriptionTier.FREE) as SubscriptionTier
    const limits = getPlanLimits(tier)
    const scanLimit = limits.scansPerMonth === Infinity ? DEFAULTS.SCAN_LIMIT_DISPLAY : limits.scansPerMonth

    const storeLimit = limits.stores === Infinity ? null : limits.stores

    return res.status(200).json({
      totalScans,
      reviewsCopied,
      blockedRegenerations: data.blocked_regenerations || 0,
      storeCount: data.store_count,
      tier,
      scanLimit,
      storeLimit,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

