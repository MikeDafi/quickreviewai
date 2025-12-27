import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'
import { sql } from '@/lib/db'

// Validate required environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required')
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.email || !session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { confirmEmail } = req.body

  // Require email confirmation to prevent accidental deletion
  if (confirmEmail !== session.user.email) {
    return res.status(400).json({ 
      error: 'Email confirmation required',
      message: 'Please enter your email address to confirm account deletion.'
    })
  }

  try {
    // Get user info for cleanup
    const { rows: [user] } = await sql`
      SELECT stripe_subscription_id, stripe_customer_id
      FROM users 
      WHERE email = ${session.user.email}
    `

    // Cancel any active subscription
    if (user?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(user.stripe_subscription_id)
      } catch (error) {
        console.error('Failed to cancel subscription during account deletion:', error)
        // Continue with deletion even if Stripe fails
      }
    }

    // Soft delete the user (set deleted_at, data retained for 7 days)
    await sql`
      UPDATE users 
      SET deleted_at = NOW(), subscription_tier = 'free'
      WHERE id = ${session.user.id}
    `

    return res.status(200).json({ 
      success: true,
      message: 'Account scheduled for deletion. Your data will be permanently removed in 7 days. Sign in again within 7 days to recover your account.'
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return res.status(500).json({ error: 'Failed to delete account' })
  }
}

