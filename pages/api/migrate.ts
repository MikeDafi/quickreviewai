import type { NextApiRequest, NextApiResponse } from 'next'
import { sql } from '@/lib/db'

// One-time migration endpoint - remove after running
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple protection - require a secret key
  const { key } = req.query
  
  if (key !== process.env.MIGRATION_KEY && key !== 'run-migration-2024') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Add billing period tracking columns to users table
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS period_scans INT DEFAULT 0`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS period_copies INT DEFAULT 0`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS period_start TIMESTAMP`
    
    return res.status(200).json({ 
      success: true, 
      message: 'Migration completed: Added period_scans, period_copies, and period_start columns to users table' 
    })
  } catch (error) {
    console.error('Migration error:', error)
    return res.status(500).json({ error: 'Migration failed', details: String(error) })
  }
}

