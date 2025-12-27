import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql, isNewBillingPeriod, resetBillingPeriod } from '@/lib/db'

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
    // Get user info including billing period data
    const { rows: userRows } = await sql`
      SELECT created_at, period_start, period_scans, period_copies
      FROM users WHERE id = ${userId}
    `
    
    const user = userRows[0]
    
    // Check if we need to reset the billing period (monthly from account creation)
    if (user && isNewBillingPeriod(new Date(user.created_at), user.period_start ? new Date(user.period_start) : null)) {
      await resetBillingPeriod(userId)
      // Reset the local values after DB update
      user.period_scans = 0
      user.period_copies = 0
    }
    
    // Get aggregated stats for the user (current stores + period stats from deleted stores)
    const { rows } = await sql`
      SELECT 
        COALESCE(SUM(lp.view_count), 0)::int as current_scans,
        COALESCE(SUM(lp.copy_count), 0)::int as current_copies,
        COUNT(DISTINCT s.id)::int as store_count
      FROM stores s
      LEFT JOIN landing_pages lp ON lp.store_id = s.id
      WHERE s.user_id = ${userId}
    `

    const stats = rows[0] || { current_scans: 0, current_copies: 0, store_count: 0 }
    const periodScans = user?.period_scans || 0
    const periodCopies = user?.period_copies || 0

    // Total for this billing period = current (from active stores) + period (from deleted stores)
    const totalScans = stats.current_scans + periodScans
    const reviewsCopied = stats.current_copies + periodCopies

    // TODO: Get actual subscription tier from user table
    const tier = 'free'
    const scanLimit = tier === 'free' ? 15 : -1  // 15 scans/month for free, unlimited for pro

    return res.status(200).json({
      totalScans,
      reviewsCopied,
      storeCount: stats.store_count,
      tier,
      scanLimit,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

