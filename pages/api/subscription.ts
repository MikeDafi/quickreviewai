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
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get user subscription info from database
    const { rows: [user] } = await sql`
      SELECT 
        subscription_tier,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_started_at,
        first_subscribed_at,
        created_at
      FROM users 
      WHERE email = ${session.user.email}
    `

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const tier = user.subscription_tier || 'free'
    
    // Base response for free users
    if (tier === 'free' || !user.stripe_subscription_id) {
      return res.status(200).json({
        tier: 'free',
        hasSubscription: false,
        // Check if they were ever a subscriber (affects refund eligibility)
        wasEverSubscribed: !!user.first_subscribed_at,
        accountCreatedAt: user.created_at,
      })
    }

    // For paid users, get subscription details from Stripe
    let subscriptionDetails = null
    let cancelAtPeriodEnd = false
    let currentPeriodEnd: Date | null = null

    if (user.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id)
        cancelAtPeriodEnd = subscription.cancel_at_period_end
        currentPeriodEnd = new Date(subscription.current_period_end * 1000)
        
        subscriptionDetails = {
          status: subscription.status,
          cancelAtPeriodEnd,
          currentPeriodEnd: currentPeriodEnd.toISOString(),
        }
      } catch (error) {
        console.error('Failed to fetch subscription from Stripe:', error)
        // Continue with database info if Stripe fails
      }
    }

    // Calculate if eligible for 3-day refund (first time subscriber within 3 days)
    const isFirstTimeSubscriber = !user.first_subscribed_at || 
      (user.subscription_started_at && 
       new Date(user.subscription_started_at).getTime() === new Date(user.first_subscribed_at).getTime())
    
    const subscriptionAge = user.subscription_started_at 
      ? Date.now() - new Date(user.subscription_started_at).getTime()
      : Infinity
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000
    const eligibleForRefund = isFirstTimeSubscriber && subscriptionAge < threeDaysMs

    // Calculate days as subscriber
    const memberSinceDays = user.subscription_started_at
      ? Math.floor((Date.now() - new Date(user.subscription_started_at).getTime()) / (24 * 60 * 60 * 1000))
      : 0

    return res.status(200).json({
      tier,
      hasSubscription: true,
      subscriptionStartedAt: user.subscription_started_at,
      firstSubscribedAt: user.first_subscribed_at,
      memberSinceDays,
      wasEverSubscribed: true,
      eligibleForRefund,
      refundDeadline: eligibleForRefund && user.subscription_started_at
        ? new Date(new Date(user.subscription_started_at).getTime() + threeDaysMs).toISOString()
        : null,
      cancelAtPeriodEnd,
      currentPeriodEnd: currentPeriodEnd?.toISOString() || null,
      accountCreatedAt: user.created_at,
      ...subscriptionDetails,
    })
  } catch (error) {
    console.error('Subscription API error:', error)
    return res.status(500).json({ error: 'Failed to fetch subscription details' })
  }
}

