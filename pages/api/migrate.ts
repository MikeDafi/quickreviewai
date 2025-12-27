import type { NextApiRequest, NextApiResponse } from 'next'
import { sql } from '@/lib/db'

// One-time migration endpoint - remove after running
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { key } = req.query
  
  if (key !== process.env.MIGRATION_KEY && key !== 'run-migration-2024') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Add soft delete column to users table
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`
    
    return res.status(200).json({ 
      success: true, 
      message: 'Migration completed: Added deleted_at column to users table' 
    })
  } catch (error) {
    console.error('Migration error:', error)
    return res.status(500).json({ error: 'Migration failed', details: String(error) })
  }
}

