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
  
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get user's Stripe customer ID
    const { rows: [user] } = await sql`
      SELECT stripe_customer_id FROM users WHERE email = ${session.user.email}
    `

    if (!user?.stripe_customer_id) {
      return res.status(400).json({ 
        error: 'No billing account',
        message: 'You need to subscribe to a plan first to manage billing.'
      })
    }

    // Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXTAUTH_URL}/profile`,
    })

    return res.status(200).json({ url: portalSession.url })
  } catch (error) {
    console.error('Portal session error:', error)
    return res.status(500).json({ error: 'Unable to create billing portal session' })
  }
}

