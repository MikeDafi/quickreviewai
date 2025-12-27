import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'
import { sql } from '@/lib/db'
import { SubscriptionTier } from '@/lib/constants'

// Admin emails allowed to use this endpoint
const ADMIN_EMAILS = ['spindafi1@gmail.com']

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
  
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return res.status(403).json({ error: 'Forbidden - Admin only' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    // Get user from database
    const { rows: [user] } = await sql`
      SELECT id, email, stripe_customer_id, subscription_tier
      FROM users 
      WHERE email = ${email}
    `

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // If user has a stripe_customer_id, check their subscription
    let stripeCustomerId = user.stripe_customer_id
    let activeSubscription: Stripe.Subscription | null = null

    // If no customer ID, search by email in Stripe
    if (!stripeCustomerId) {
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
      }
    }

    if (stripeCustomerId) {
      // Get active subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
      })

      if (subscriptions.data.length > 0) {
        activeSubscription = subscriptions.data[0]
      }
    }

    // Determine the correct tier
    const correctTier = activeSubscription ? SubscriptionTier.PRO : SubscriptionTier.FREE

    // Update database
    if (activeSubscription) {
      await sql`
        UPDATE users 
        SET 
          stripe_customer_id = ${stripeCustomerId},
          stripe_subscription_id = ${activeSubscription.id},
          subscription_tier = ${correctTier},
          subscription_started_at = COALESCE(subscription_started_at, to_timestamp(${activeSubscription.created})),
          first_subscribed_at = COALESCE(first_subscribed_at, to_timestamp(${activeSubscription.created}))
        WHERE email = ${email}
      `
    } else {
      await sql`
        UPDATE users 
        SET 
          stripe_customer_id = ${stripeCustomerId},
          subscription_tier = ${correctTier}
        WHERE email = ${email}
      `
    }

    return res.status(200).json({
      success: true,
      message: `Subscription synced for ${email}`,
      previousTier: user.subscription_tier,
      newTier: correctTier,
      hasActiveSubscription: !!activeSubscription,
      stripeCustomerId,
      subscriptionId: activeSubscription?.id || null,
    })
  } catch (error) {
    console.error('Sync subscription error:', error)
    return res.status(500).json({ error: 'Failed to sync subscription' })
  }
}

