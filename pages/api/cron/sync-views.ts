import type { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '@vercel/kv'
import { sql } from '@/lib/db'

// This endpoint syncs view counts from KV to the database
// Called by Vercel Cron every 10 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development without secret
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  try {
    // Get all view count keys from KV
    const keys = await kv.keys('views:*')
    
    if (keys.length === 0) {
      return res.status(200).json({ message: 'No views to sync', synced: 0 })
    }

    let syncedCount = 0
    const errors: string[] = []

    // Process each key
    for (const key of keys) {
      try {
        // Get and delete the count atomically
        const count = await kv.getdel<number>(key)
        
        if (count && count > 0) {
          // Extract landing page ID from key (format: "views:abc123")
          const landingPageId = key.replace('views:', '')
          
          // Update the database
          await sql`
            UPDATE landing_pages 
            SET view_count = view_count + ${count} 
            WHERE id = ${landingPageId}
          `
          
          syncedCount++
        }
      } catch (error) {
        const errorMsg = `Failed to sync ${key}: ${error}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    return res.status(200).json({
      message: 'View counts synced',
      keysProcessed: keys.length,
      synced: syncedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Sync views error:', error)
    return res.status(500).json({ error: 'Failed to sync view counts' })
  }
}

