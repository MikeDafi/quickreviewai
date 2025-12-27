import type { NextApiRequest, NextApiResponse } from 'next'
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

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable: NodeJS.ReadableStream) {
  const chunks: Buffer[] = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  const sig = req.headers['stripe-signature']
  
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' })
  }

  // Fail fast if webhook secret is not configured - never accept unverified webhooks
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('CRITICAL: STRIPE_WEBHOOK_SECRET is not configured')
    return res.status(500).json({ error: 'Webhook endpoint not configured' })
  }

  let event: Stripe.Event

  try {
    const buf = await buffer(req)
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return res.status(400).json({ error: `Webhook Error: ${message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        
        // Get the subscription to determine the tier
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        
        // Map price IDs to tiers (you'll need to set these up in Stripe)
        let tier = 'pro'
        if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) {
          tier = 'business'
        }

        // Update user subscription
        await sql`
          UPDATE users 
          SET stripe_customer_id = ${customerId}, subscription_tier = ${tier}
          WHERE email = ${session.customer_email}
        `
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        if (subscription.status === 'active') {
          const priceId = subscription.items.data[0]?.price.id
          let tier = 'pro'
          if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) {
            tier = 'business'
          }
          
          await sql`
            UPDATE users 
            SET subscription_tier = ${tier}
            WHERE stripe_customer_id = ${customerId}
          `
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        await sql`
          UPDATE users 
          SET subscription_tier = 'free'
          WHERE stripe_customer_id = ${customerId}
        `
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }
}

