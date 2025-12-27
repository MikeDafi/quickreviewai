import type { NextApiRequest, NextApiResponse } from 'next'
import { sql } from '@/lib/db'

// This endpoint is called by Vercel Cron to:
// 1. Clean up old review events (90 day retention)
// 2. Permanently delete soft-deleted accounts after 7 days
// Schedule: Once per day

const REVIEW_RETENTION_DAYS = 90
const ACCOUNT_DELETION_DAYS = 7

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
    // 1. Delete review events older than 90 days
    const reviewResult = await sql`
      DELETE FROM review_events
      WHERE created_at < NOW() - INTERVAL '1 day' * ${REVIEW_RETENTION_DAYS}
    `
    const deletedReviewEvents = reviewResult.rowCount || 0

    // 2. Permanently delete soft-deleted accounts after 7 days
    // CASCADE will automatically delete their stores, landing pages, and review events
    const { rows: deletedUsers } = await sql`
      DELETE FROM users 
      WHERE deleted_at IS NOT NULL 
        AND deleted_at < NOW() - INTERVAL '1 day' * ${ACCOUNT_DELETION_DAYS}
      RETURNING id, email
    `
    const deletedAccountCount = deletedUsers.length

    if (deletedReviewEvents > 0) {
      console.log(`Cleanup: Deleted ${deletedReviewEvents} review events older than ${REVIEW_RETENTION_DAYS} days`)
    }
    if (deletedAccountCount > 0) {
      console.log(`Cleanup: Permanently deleted ${deletedAccountCount} accounts:`, deletedUsers.map(u => u.email))
    }

    return res.status(200).json({ 
      success: true, 
      deletedReviewEvents,
      deletedAccounts: deletedAccountCount,
      deletedAccountEmails: deletedUsers.map(u => u.email),
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return res.status(500).json({ error: 'Cleanup failed' })
  }
}

