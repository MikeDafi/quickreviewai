import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { kv } from '@vercel/kv'
import { authOptions } from '@/lib/auth'
import { getStores, getStore, createStore, updateStore, deleteStore, createLandingPage, clearQueue, getLandingPageIds, sql } from '@/lib/db'
import { SubscriptionTier, PLAN_LIMITS, getPlanLimits } from '@/lib/constants'
import { withErrorNotify } from '@/lib/notify'

// Fields whose change makes pre-generated reviews stale and requires a queue reset.
// google_url / yelp_url / address don't affect review text, so they don't reset.
function contentFieldsChanged(before: Record<string, unknown>, after: Record<string, unknown>): boolean {
  const arr = (v: unknown) => JSON.stringify(Array.isArray(v) ? v : v ?? null)
  return (
    before.name !== after.name ||
    before.business_type !== after.business_type ||
    arr(before.keywords) !== arr(after.keywords) ||
    arr(before.review_expectations) !== arr(after.review_expectations)
  )
}

// Clear stale per-visitor KV caches for all of a store's landing pages, so
// visitors don't keep seeing reviews generated under the old settings.
async function invalidateStoreCaches(storeId: string): Promise<void> {
  try {
    const landingIds = await getLandingPageIds(storeId)
    for (const lid of landingIds) {
      const patterns = [
        `review_cache:${lid}:*`,
        `review_event:${lid}:*`,
        `review_queue_item:${lid}:*`,
      ]
      for (const pattern of patterns) {
        try {
          const keys = await kv.keys(pattern)
          if (keys.length > 0) {
            await kv.del(...keys)
          }
        } catch (error) {
          console.error('KV cache invalidation error:', error)
        }
      }
    }
  } catch (error) {
    console.error('Failed to invalidate store caches:', error)
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        const { name, address, businessType, keywords, reviewExpectations, googleUrl, yelpUrl } = req.body
        
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
          reviewExpectations,
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

        const { name, address, businessType, keywords, reviewExpectations, googleUrl, yelpUrl } = req.body
        
        // Snapshot content-affecting fields before the update so we can detect
        // whether the pre-generated review queue is now stale.
        const before = await getStore(id, userId)

        const store = await updateStore(id, userId, {
          name,
          address,
          businessType,
          keywords,
          reviewExpectations,
          googleUrl,
          yelpUrl,
        })

        if (!store) {
          return res.status(404).json({ error: 'Store not found' })
        }

        // If content that shapes generated reviews changed, reset the queue:
        // clear buffered reviews and invalidate stale per-visitor caches. The
        // queue refills lazily on the next visitor (keeps this save fast).
        if (before && contentFieldsChanged(before, store)) {
          try {
            await clearQueue(id)
            await invalidateStoreCaches(id)
          } catch (error) {
            console.error('Failed to reset review queue on settings change:', error)
          }
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

export default withErrorNotify(handler, 'stores')
