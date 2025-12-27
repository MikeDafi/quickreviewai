import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStores, createStore, updateStore, deleteStore, createLandingPage, sql } from '@/lib/db'
import { SubscriptionTier, PLAN_LIMITS, getPlanLimits } from '@/lib/constants'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = session.user.id

  try {
    switch (req.method) {
      case 'GET': {
        const stores = await getStores(userId)
        return res.status(200).json({ stores })
      }

      case 'POST': {
        const { name, address, businessType, keywords, reviewGuidance, googleUrl, yelpUrl } = req.body
        
        if (!name) {
          return res.status(400).json({ error: 'Store name is required' })
        }

        // Check store limit for user's tier
        const { rows: [userInfo] } = await sql`
          SELECT 
            COALESCE(u.subscription_tier, 'free') as tier,
            COUNT(s.id)::int as store_count
          FROM users u
          LEFT JOIN stores s ON s.user_id = u.id
          WHERE u.id = ${userId}
          GROUP BY u.id
        `
        
        const tier = (userInfo?.tier || SubscriptionTier.FREE) as SubscriptionTier
        const planLimits = getPlanLimits(tier)
        const currentCount = userInfo?.store_count || 0
        
        if (currentCount >= planLimits.stores) {
          return res.status(403).json({ 
            error: 'Store limit reached',
            message: tier === SubscriptionTier.FREE 
              ? 'Free plan allows 1 store. Upgrade to Pro for unlimited stores!'
              : 'You have reached your store limit.',
            currentCount,
            limit: planLimits.stores,
          })
        }

        const store = await createStore({
          userId,
          name,
          address,
          businessType,
          keywords,
          reviewGuidance,
          googleUrl,
          yelpUrl,
        })

        // Automatically create a landing page for the store
        const landingPage = await createLandingPage(store.id)

        return res.status(201).json({ store: { ...store, landing_page_id: landingPage.id } })
      }

      case 'PUT': {
        const { id } = req.query
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Store ID is required' })
        }

        const { name, address, businessType, keywords, reviewGuidance, googleUrl, yelpUrl } = req.body
        
        const store = await updateStore(id, userId, {
          name,
          address,
          businessType,
          keywords,
          reviewGuidance,
          googleUrl,
          yelpUrl,
        })

        if (!store) {
          return res.status(404).json({ error: 'Store not found' })
        }

        return res.status(200).json({ store })
      }

      case 'DELETE': {
        const { id } = req.query
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Store ID is required' })
        }

        await deleteStore(id, userId)
        return res.status(200).json({ success: true })
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Stores API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
