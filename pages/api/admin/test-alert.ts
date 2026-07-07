import type { NextApiRequest, NextApiResponse } from 'next'
import { notifyAdmin, alertsConfig, withErrorNotify } from '@/lib/notify'

/**
 * Admin-only endpoint to verify that error alerting is wired up correctly.
 *
 * Usage:
 *   curl -X POST https://<host>/api/admin/test-alert \
 *     -H "Authorization: Bearer $CRON_SECRET"
 *
 * Requires the CRON_SECRET bearer token in production. Sends a sample alert
 * email (forced, so it works even from preview) and reports whether the alert
 * config is complete. Never exposes secret values.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Require the shared cron/admin secret in production.
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const config = alertsConfig()

  if (!config.hasApiKey || !config.hasRecipient) {
    return res.status(200).json({
      sent: false,
      reason: 'Alerting not fully configured',
      config: {
        hasApiKey: config.hasApiKey,
        hasRecipient: config.hasRecipient,
        from: config.from,
        env: config.env,
      },
    })
  }

  const sent = await notifyAdmin(
    {
      level: 'warn',
      source: 'admin/test-alert',
      subject: 'Test alert',
      message: 'This is a test alert confirming admin email notifications are working.',
      context: { triggeredAt: new Date().toISOString(), env: config.env },
    },
    { force: true }
  )

  return res.status(200).json({
    sent,
    config: { hasApiKey: config.hasApiKey, hasRecipient: config.hasRecipient, from: config.from, env: config.env },
  })
}

export default withErrorNotify(handler, 'admin/test-alert')
