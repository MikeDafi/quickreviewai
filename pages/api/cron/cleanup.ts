import type { NextApiRequest, NextApiResponse } from 'next'
import { sql } from '@/lib/db'

// This endpoint is called by Vercel Cron to clean up old review events
// Schedule: Once per day
// Retention: 90 days

const RETENTION_DAYS = 90

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is from Vercel Cron (in production)
  const authHeader = req.headers.authorization
  
  // In development, allow without auth; in production, require CRON_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  try {
    // Delete review events older than 90 days
    const { rowCount } = await sql`
      DELETE FROM review_events
      WHERE created_at < NOW() - INTERVAL '${RETENTION_DAYS} days'
    `

    console.log(`Cleanup: Deleted ${rowCount} review events older than ${RETENTION_DAYS} days`)

    return res.status(200).json({ 
      success: true, 
      deletedCount: rowCount,
      retentionDays: RETENTION_DAYS
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return res.status(500).json({ error: 'Cleanup failed' })
  }
}

