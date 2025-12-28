import type { NextApiRequest, NextApiResponse } from 'next'
import { sql } from '@/lib/db'
import { kv } from '@vercel/kv'

const NOTIFICATION_SHOWN_PREFIX = 'feed_notified:'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
  const checkNotification = req.query.checkNotification === 'true'

  // Get client IP for notification tracking
  const forwarded = req.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown'

  try {
    // Only show events where review was copied AND posted (real completions)
    const { rows: recentEvents } = await sql`
      SELECT 
        re.id,
        re.created_at,
        re.was_copied,
        re.was_pasted_google,
        re.was_pasted_yelp,
        s.name as store_name,
        s.business_type,
        SUBSTRING(re.review_text, 1, 100) as review_preview
      FROM review_events re
      JOIN landing_pages lp ON re.landing_page_id = lp.id
      JOIN stores s ON lp.store_id = s.id
      WHERE re.was_copied = true 
        AND (re.was_pasted_google = true OR re.was_pasted_yelp = true)
      ORDER BY re.created_at DESC
      LIMIT ${limit}
    `

    // Get total counts for stats (only copied + posted)
    const { rows: [stats] } = await sql`
      SELECT 
        COUNT(*) as total_posted
      FROM review_events
      WHERE was_copied = true 
        AND (was_pasted_google = true OR was_pasted_yelp = true)
        AND created_at >= NOW() - INTERVAL '24 hours'
    `

    // Get most recent posted event for homepage notification
    const { rows: [mostRecent] } = await sql`
      SELECT 
        re.created_at,
        s.name as store_name,
        s.business_type
      FROM review_events re
      JOIN landing_pages lp ON re.landing_page_id = lp.id
      JOIN stores s ON lp.store_id = s.id
      WHERE re.was_copied = true 
        AND (re.was_pasted_google = true OR re.was_pasted_yelp = true)
      ORDER BY re.created_at DESC
      LIMIT 1
    `

    // Check if this IP has been notified before (for homepage banner)
    let shouldShowNotification = false
    if (checkNotification && mostRecent) {
      try {
        const hasBeenNotified = await kv.get(`${NOTIFICATION_SHOWN_PREFIX}${ip}`)
        if (!hasBeenNotified) {
          shouldShowNotification = true
          // Mark this IP as notified (expires in 30 days)
          await kv.set(`${NOTIFICATION_SHOWN_PREFIX}${ip}`, true, { ex: 60 * 60 * 24 * 30 })
        }
      } catch (kvError) {
        // If KV fails, don't show notification to be safe
        console.error('KV error checking notification status:', kvError)
      }
    }

    return res.status(200).json({
      events: recentEvents.map(event => ({
        id: event.id,
        createdAt: event.created_at,
        wasCopied: event.was_copied,
        wasPastedGoogle: event.was_pasted_google,
        wasPastedYelp: event.was_pasted_yelp,
        storeName: event.store_name,
        businessType: event.business_type,
        reviewPreview: event.review_preview,
      })),
      stats: {
        totalPosted24h: parseInt(stats?.total_posted || '0'),
      },
      mostRecent: mostRecent ? {
        createdAt: mostRecent.created_at,
        storeName: mostRecent.store_name,
        businessType: mostRecent.business_type,
      } : null,
      shouldShowNotification,
    })
  } catch (error) {
    console.error('Global feed API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

