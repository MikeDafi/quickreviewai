import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

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
    // Get aggregated stats for the user
    const { rows } = await sql`
      SELECT 
        COALESCE(SUM(lp.view_count), 0)::int as total_scans,
        COALESCE(SUM(lp.copy_count), 0)::int as reviews_copied,
        COUNT(DISTINCT s.id)::int as store_count
      FROM stores s
      LEFT JOIN landing_pages lp ON lp.store_id = s.id
      WHERE s.user_id = ${userId}
    `

    const stats = rows[0] || { total_scans: 0, reviews_copied: 0, store_count: 0 }

    // TODO: Get actual subscription tier from user table
    const tier = 'free'
    const reviewLimit = tier === 'free' ? 50 : tier === 'pro' ? 500 : -1

    return res.status(200).json({
      totalScans: stats.total_scans,
      reviewsCopied: stats.reviews_copied,
      storeCount: stats.store_count,
      tier,
      reviewLimit,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

