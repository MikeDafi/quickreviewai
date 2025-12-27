import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'
import { sql } from '@/lib/db'
import { SubscriptionTier, BILLING } from '@/lib/constants'

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
  
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { immediate, requestRefund } = req.body

  try {
    // Get user subscription info
    const { rows: [user] } = await sql`
      SELECT 
        stripe_subscription_id,
        subscription_started_at,
        first_subscribed_at
      FROM users 
      WHERE email = ${session.user.email}
    `

    if (!user?.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' })
    }

    // Check refund eligibility (first time subscriber within 3 days)
    const isFirstTimeSubscriber = !user.first_subscribed_at || 
      (user.subscription_started_at && 
       new Date(user.subscription_started_at).getTime() === new Date(user.first_subscribed_at).getTime())
    
    const subscriptionAge = user.subscription_started_at 
      ? Date.now() - new Date(user.subscription_started_at).getTime()
      : Infinity
    const eligibleForRefund = isFirstTimeSubscriber && subscriptionAge < BILLING.REFUND_WINDOW_MS

    if (requestRefund && !eligibleForRefund) {
      return res.status(400).json({ 
        error: 'Not eligible for refund',
        message: 'Refunds are only available within 3 days of your first subscription.'
      })
    }

    // Cancel the subscription
    if (immediate || requestRefund) {
      // Cancel immediately (for refunds or immediate cancellation)
      await stripe.subscriptions.cancel(user.stripe_subscription_id)
      
      // Update user to free tier immediately
      await sql`
        UPDATE users 
        SET subscription_tier = ${SubscriptionTier.FREE}, stripe_subscription_id = NULL
        WHERE email = ${session.user.email}
      `

      // Process refund if requested and eligible
      if (requestRefund && eligibleForRefund) {
        try {
          // Get the latest invoice for this subscription
          const invoices = await stripe.invoices.list({
            subscription: user.stripe_subscription_id,
            limit: 1,
          })
          
          if (invoices.data.length > 0 && invoices.data[0].payment_intent) {
            const paymentIntentId = typeof invoices.data[0].payment_intent === 'string' 
              ? invoices.data[0].payment_intent 
              : invoices.data[0].payment_intent.id
            
            await stripe.refunds.create({
              payment_intent: paymentIntentId,
            })
          }
        } catch (refundError) {
          console.error('Refund failed:', refundError)
          // Subscription is cancelled, but refund failed - log for manual review
          return res.status(200).json({ 
            success: true, 
            cancelled: true,
            refunded: false,
            message: 'Subscription cancelled. Refund is being processed manually.'
          })
        }

        return res.status(200).json({ 
          success: true, 
          cancelled: true, 
          refunded: true,
          message: 'Subscription cancelled and refund processed.'
        })
      }

      return res.status(200).json({ 
        success: true, 
        cancelled: true,
        message: 'Subscription cancelled immediately.'
      })
    } else {
      // Cancel at period end (default behavior)
      await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: true,
      })

      return res.status(200).json({ 
        success: true, 
        cancelAtPeriodEnd: true,
        message: 'Subscription will be cancelled at the end of the billing period.'
      })
    }
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return res.status(500).json({ error: 'Failed to cancel subscription' })
  }
}

