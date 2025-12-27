import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

// Parse date range from period parameter (format: "YYYY-MM-DD_YYYY-MM-DD")
function parsePeriod(period: string): { startDate: Date; endDate: Date; days: number } {
  const parts = period.split('_')
  
  if (parts.length === 2) {
    const startDate = new Date(parts[0] + 'T00:00:00')
    const endDate = new Date(parts[1] + 'T23:59:59')
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return { startDate, endDate, days }
  }
  
  // Fallback: last 7 days
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 6)
  startDate.setHours(0, 0, 0, 0)
  return { startDate, endDate, days: 7 }
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

  const { storeId, period = '' } = req.query
  
  if (!storeId || typeof storeId !== 'string') {
    return res.status(400).json({ error: 'Store ID is required' })
  }

  const { startDate, endDate, days } = parsePeriod(period as string)
  const startDateStr = startDate.toISOString()
  const endDateStr = endDate.toISOString()
  
  // Calculate previous period (same duration, immediately before)
  const prevEndDate = new Date(startDate)
  prevEndDate.setSeconds(prevEndDate.getSeconds() - 1)
  const prevStartDate = new Date(prevEndDate)
  prevStartDate.setDate(prevStartDate.getDate() - days + 1)
  prevStartDate.setHours(0, 0, 0, 0)
  const prevStartDateStr = prevStartDate.toISOString()
  const prevEndDateStr = prevEndDate.toISOString()

  try {
    // Verify user owns this store
    const { rows: [store] } = await sql`
      SELECT id, name, keywords, review_expectations 
      FROM stores 
      WHERE id = ${storeId} AND user_id = ${session.user.id}
    `
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' })
    }

    // Get overall stats for the current time period
    const { rows: [overallStats] } = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN was_copied THEN 1 END) as copied_count,
        COUNT(CASE WHEN was_pasted_google THEN 1 END) as pasted_google_count,
        COUNT(CASE WHEN was_pasted_yelp THEN 1 END) as pasted_yelp_count
      FROM review_events
      WHERE store_id = ${storeId}
        AND created_at >= ${startDateStr}::timestamp
        AND created_at <= ${endDateStr}::timestamp
    `

    // Get overall stats for the PREVIOUS time period (for comparison)
    const { rows: [prevStats] } = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN was_copied THEN 1 END) as copied_count,
        COUNT(CASE WHEN was_pasted_google OR was_pasted_yelp THEN 1 END) as pasted_count
      FROM review_events
      WHERE store_id = ${storeId}
        AND created_at >= ${prevStartDateStr}::timestamp
        AND created_at <= ${prevEndDateStr}::timestamp
    `

    // Get keyword usage stats
    const { rows: keywordStats } = await sql`
      SELECT 
        keyword,
        COUNT(*) as usage_count,
        COUNT(CASE WHEN was_copied THEN 1 END) as copied_count,
        COUNT(CASE WHEN was_pasted_google OR was_pasted_yelp THEN 1 END) as pasted_count
      FROM review_events, unnest(keywords_used) as keyword
      WHERE store_id = ${storeId}
        AND created_at >= ${startDateStr}::timestamp
        AND created_at <= ${endDateStr}::timestamp
      GROUP BY keyword
      ORDER BY usage_count DESC
    `

    // Get length type distribution
    const { rows: lengthStats } = await sql`
      SELECT 
        length_type,
        COUNT(*) as count,
        COUNT(CASE WHEN was_copied THEN 1 END) as copied_count
      FROM review_events
      WHERE store_id = ${storeId}
        AND created_at >= ${startDateStr}::timestamp
        AND created_at <= ${endDateStr}::timestamp
        AND length_type IS NOT NULL
      GROUP BY length_type
      ORDER BY count DESC
    `

    // Get hourly distribution (group into 3-hour buckets: 0, 3, 6, 9, 12, 15, 18, 21)
    const { rows: hourlyStats } = await sql`
      SELECT 
        (EXTRACT(HOUR FROM created_at)::int / 3) * 3 as hour_bucket,
        COUNT(*) as count
      FROM review_events
      WHERE store_id = ${storeId}
        AND created_at >= ${startDateStr}::timestamp
        AND created_at <= ${endDateStr}::timestamp
      GROUP BY hour_bucket
      ORDER BY hour_bucket
    `

    // Get day of week distribution
    const { rows: dailyStats } = await sql`
      SELECT 
        EXTRACT(DOW FROM created_at)::int as day_of_week,
        COUNT(*) as generated,
        COUNT(CASE WHEN was_pasted_google OR was_pasted_yelp THEN 1 END) as posted
      FROM review_events
      WHERE store_id = ${storeId}
        AND created_at >= ${startDateStr}::timestamp
        AND created_at <= ${endDateStr}::timestamp
      GROUP BY day_of_week
      ORDER BY day_of_week
    `

    // Get recent reviews (all)
    const { rows: recentReviews } = await sql`
      SELECT 
        id,
        review_text,
        keywords_used,
        expectations_used,
        length_type,
        was_copied,
        was_pasted_google,
        was_pasted_yelp,
        created_at
      FROM review_events
      WHERE store_id = ${storeId}
        AND created_at >= ${startDateStr}::timestamp
        AND created_at <= ${endDateStr}::timestamp
      ORDER BY created_at DESC
      LIMIT 50
    `

    // Calculate conversion rates
    const totalReviews = parseInt(overallStats?.total_reviews) || 0
    const copiedCount = parseInt(overallStats?.copied_count) || 0
    const pastedGoogle = parseInt(overallStats?.pasted_google_count) || 0
    const pastedYelp = parseInt(overallStats?.pasted_yelp_count) || 0
    const totalPasted = pastedGoogle + pastedYelp

    // Previous period stats
    const prevTotalReviews = parseInt(prevStats?.total_reviews) || 0
    const prevCopiedCount = parseInt(prevStats?.copied_count) || 0
    const prevTotalPasted = parseInt(prevStats?.pasted_count) || 0

    // Transform hourly stats to include all 8 buckets
    const hourlyBuckets = [0, 3, 6, 9, 12, 15, 18, 21]
    const hourlyStatsMap = new Map(hourlyStats.map(h => [parseInt(h.hour_bucket), parseInt(h.count)]))
    const formattedHourlyStats = hourlyBuckets.map(hour => ({
      hour,
      count: hourlyStatsMap.get(hour) || 0
    }))

    // Transform daily stats to include all 7 days
    const dailyStatsMap = new Map(dailyStats.map(d => [parseInt(d.day_of_week), { generated: parseInt(d.generated), pasted: parseInt(d.posted) }]))
    const formattedDailyStats = [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => ({
      dayOfWeek,
      generated: dailyStatsMap.get(dayOfWeek)?.generated || 0,
      pasted: dailyStatsMap.get(dayOfWeek)?.pasted || 0
    }))

    return res.status(200).json({
      store: {
        id: store.id,
        name: store.name,
        keywords: store.keywords || [],
        reviewExpectations: store.review_expectations || [],
      },
      period: period,
      days: days,
      summary: {
        totalReviews,
        copiedCount,
        pastedGoogle,
        pastedYelp,
        totalPasted,
        copyRate: totalReviews > 0 ? ((copiedCount / totalReviews) * 100).toFixed(1) : '0',
        pasteRate: copiedCount > 0 ? ((totalPasted / copiedCount) * 100).toFixed(1) : '0',
        conversionRate: totalReviews > 0 ? ((totalPasted / totalReviews) * 100).toFixed(1) : '0',
        // Previous period for comparison
        prevTotalReviews,
        prevCopiedCount,
        prevTotalPasted,
      },
      keywordStats: keywordStats.map(k => ({
        keyword: k.keyword,
        usageCount: parseInt(k.usage_count),
        copiedCount: parseInt(k.copied_count),
        pastedCount: parseInt(k.pasted_count),
      })),
      lengthStats: lengthStats.map(l => ({
        lengthType: l.length_type,
        count: parseInt(l.count),
        copiedCount: parseInt(l.copied_count),
      })),
      hourlyStats: formattedHourlyStats,
      dailyStats: formattedDailyStats,
      recentReviews: recentReviews.map(r => ({
        id: r.id,
        reviewText: r.review_text,
        keywordsUsed: r.keywords_used || [],
        expectationsUsed: r.expectations_used || [],
        lengthType: r.length_type,
        wasCopied: r.was_copied,
        wasPastedGoogle: r.was_pasted_google,
        wasPastedYelp: r.was_pasted_yelp,
        createdAt: r.created_at,
      })),
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}
