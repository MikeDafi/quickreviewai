import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'
import { SubscriptionTier } from '@/lib/constants'

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

  const { plan, returnUrl } = req.body

  // Only Pro plan is supported
  if (plan !== SubscriptionTier.PRO) {
    return res.status(400).json({ error: 'Invalid plan' })
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID?.trim()

  if (!priceId) {
    console.error('STRIPE price ID not configured for plan:', plan)
    return res.status(500).json({ error: 'Unable to process request' })
  }

  // Sanitize and validate returnUrl (must be relative path starting with /)
  let safeReturnUrl = '/dashboard'
  if (returnUrl && typeof returnUrl === 'string' && returnUrl.startsWith('/')) {
    // Only allow relative paths, no external URLs
    safeReturnUrl = returnUrl
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: session.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // On success, go to the original page with upgraded flag
      success_url: `${process.env.NEXTAUTH_URL}${safeReturnUrl}${safeReturnUrl.includes('?') ? '&' : '?'}upgraded=true`,
      // On cancel, go back to upgrade page with returnUrl preserved
      cancel_url: `${process.env.NEXTAUTH_URL}/upgrade?cancelled=true&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
      metadata: {
        userId: session.user.id || '',
        plan,
      },
    })

    return res.status(200).json({ url: checkoutSession.url })
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error)
    // Don't leak internal error details to client
    return res.status(500).json({ error: 'Unable to process request' })
  }
}

