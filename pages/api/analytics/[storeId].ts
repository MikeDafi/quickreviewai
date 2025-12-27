import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

// Time period options in days
const TIME_PERIODS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
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

  const { storeId, period = '30d' } = req.query
  
  if (!storeId || typeof storeId !== 'string') {
    return res.status(400).json({ error: 'Store ID is required' })
  }

  const days = TIME_PERIODS[period as keyof typeof TIME_PERIODS] || 30

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

    // Get overall stats for the time period
    const { rows: [overallStats] } = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN was_copied THEN 1 END) as copied_count,
        COUNT(CASE WHEN was_pasted_google THEN 1 END) as pasted_google_count,
        COUNT(CASE WHEN was_pasted_yelp THEN 1 END) as pasted_yelp_count
      FROM review_events
      WHERE store_id = ${storeId}
        AND created_at >= NOW() - INTERVAL '1 day' * ${days}
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
        AND created_at >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY keyword
      ORDER BY usage_count DESC
    `

    // Get review expectation usage stats
    const { rows: expectationStats } = await sql`
      SELECT 
        expectation,
        COUNT(*) as usage_count,
        COUNT(CASE WHEN was_copied THEN 1 END) as copied_count,
        COUNT(CASE WHEN was_pasted_google OR was_pasted_yelp THEN 1 END) as pasted_count
      FROM review_events, unnest(expectations_used) as expectation
      WHERE store_id = ${storeId}
        AND created_at >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY expectation
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
        AND created_at >= NOW() - INTERVAL '1 day' * ${days}
        AND length_type IS NOT NULL
      GROUP BY length_type
      ORDER BY count DESC
    `

    // Get daily breakdown for charts
    const { rows: dailyStats } = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as reviews_generated,
        COUNT(CASE WHEN was_copied THEN 1 END) as copied,
        COUNT(CASE WHEN was_pasted_google OR was_pasted_yelp THEN 1 END) as pasted
      FROM review_events
      WHERE store_id = ${storeId}
        AND created_at >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Get recent reviews that were copied/pasted (the ones that "worked")
    const { rows: successfulReviews } = await sql`
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
        AND created_at >= NOW() - INTERVAL '1 day' * ${days}
        AND (was_pasted_google = true OR was_pasted_yelp = true)
      ORDER BY created_at DESC
      LIMIT 20
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
        AND created_at >= NOW() - INTERVAL '1 day' * ${days}
      ORDER BY created_at DESC
      LIMIT 50
    `

    // Calculate conversion rates
    const totalReviews = parseInt(overallStats?.total_reviews) || 0
    const copiedCount = parseInt(overallStats?.copied_count) || 0
    const pastedGoogle = parseInt(overallStats?.pasted_google_count) || 0
    const pastedYelp = parseInt(overallStats?.pasted_yelp_count) || 0
    const totalPasted = pastedGoogle + pastedYelp

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
      },
      keywordStats: keywordStats.map(k => ({
        keyword: k.keyword,
        usageCount: parseInt(k.usage_count),
        copiedCount: parseInt(k.copied_count),
        pastedCount: parseInt(k.pasted_count),
      })),
      expectationStats: expectationStats.map(e => ({
        expectation: e.expectation,
        usageCount: parseInt(e.usage_count),
        copiedCount: parseInt(e.copied_count),
        pastedCount: parseInt(e.pasted_count),
      })),
      lengthStats: lengthStats.map(l => ({
        lengthType: l.length_type,
        count: parseInt(l.count),
        copiedCount: parseInt(l.copied_count),
      })),
      dailyStats: dailyStats.map(d => ({
        date: d.date,
        reviewsGenerated: parseInt(d.reviews_generated),
        copied: parseInt(d.copied),
        pasted: parseInt(d.pasted),
      })),
      successfulReviews: successfulReviews.map(r => ({
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

