/**
 * Admin Error Notifications
 *
 * Sends email alerts (via Resend) when the app hits a real failure:
 *  - Any API route that returns 5xx (thrown exception or explicit res.status(5xx))
 *  - Silent generation failures (Gemini exhausts retries and serves a fallback
 *    review while returning HTTP 200)
 *
 * Design notes:
 *  - Best-effort: a notification failure must NEVER throw or break the request.
 *  - No-op unless configured: requires RESEND_API_KEY + ALERT_EMAIL_TO, and only
 *    sends in production (VERCEL_ENV === 'production') unless ALERT_FORCE=1. This
 *    keeps local dev and preview deployments from emailing.
 *  - Callers should `await` notifyAdmin: serverless functions may freeze after
 *    returning, so the send must complete within the request lifecycle. It only
 *    runs on real failures, so the added latency is acceptable.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'

export type NotifyLevel = 'error' | 'warn'

export interface NotifyPayload {
  /** Severity of the event */
  level: NotifyLevel
  /** Short origin identifier, e.g. the route name ('generate') */
  source: string
  /** One-line summary used in the email subject */
  subject: string
  /** Human-readable detail */
  message?: string
  /** Arbitrary structured context (stack, path, status, ...) */
  context?: Record<string, unknown>
}

/** Whether alerts are enabled given the current environment. */
function alertsEnabled(force = false): boolean {
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL_TO) return false
  // Only send from production unless explicitly forced (env flag or per-call).
  if (force || process.env.ALERT_FORCE === '1') return true
  return process.env.VERCEL_ENV === 'production'
}

/** Report which required config is present (booleans only — never exposes values). */
export function alertsConfig(): { hasApiKey: boolean; hasRecipient: boolean; from: string; env: string } {
  return {
    hasApiKey: !!process.env.RESEND_API_KEY,
    hasRecipient: !!process.env.ALERT_EMAIL_TO,
    from: process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev',
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
  }
}

function buildEmail(payload: NotifyPayload): { subject: string; text: string } {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown'
  const subject = `[QuickReviewAI][${payload.level}] ${payload.source}: ${payload.subject}`

  const lines = [
    `Level:     ${payload.level}`,
    `Source:    ${payload.source}`,
    `Env:       ${env}`,
    `Time:      ${new Date().toISOString()}`,
    '',
    payload.message ? `Message:\n${payload.message}` : 'Message: (none)',
  ]

  if (payload.context && Object.keys(payload.context).length > 0) {
    let ctx: string
    try {
      ctx = JSON.stringify(payload.context, null, 2)
    } catch {
      ctx = String(payload.context)
    }
    lines.push('', 'Context:', ctx)
  }

  return { subject, text: lines.join('\n') }
}

/**
 * Send an admin alert email. Best-effort and non-throwing.
 * Returns true if an email was sent, false if skipped or failed.
 */
export async function notifyAdmin(payload: NotifyPayload, opts?: { force?: boolean }): Promise<boolean> {
  try {
    if (!alertsEnabled(opts?.force)) return false

    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev'
    const to = process.env.ALERT_EMAIL_TO as string
    const { subject, text } = buildEmail(payload)

    const { error } = await resend.emails.send({ from, to, subject, text })
    if (error) {
      console.error('notifyAdmin: Resend returned an error:', error)
      return false
    }
    return true
  } catch (err) {
    // Never let alerting break the caller.
    console.error('notifyAdmin: failed to send alert:', err)
    return false
  }
}

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => unknown | Promise<unknown>

/** Symbol-ish key used to stash the underlying error on the response object. */
const SERVER_ERROR_KEY = '__serverError'

/**
 * Attach the underlying error to the response so a route that catches its own
 * error (and returns a generic 500) still surfaces the real cause + stack in the
 * admin alert. Call this in a catch block right before `res.status(500)`.
 */
export function reportServerError(res: NextApiResponse, error: unknown): void {
  try {
    ;(res as unknown as Record<string, unknown>)[SERVER_ERROR_KEY] = error
  } catch {
    /* ignore */
  }
}

function readServerError(res: NextApiResponse): unknown {
  return (res as unknown as Record<string, unknown>)[SERVER_ERROR_KEY]
}

/**
 * Wrap a Next.js API route handler so that failures are emailed to the admin:
 *  - a thrown/unhandled exception, or
 *  - any response with status >= 500 (covers explicit `res.status(5xx)` paths).
 *
 * Expected 4xx (auth, rate limits, not found, ...) are intentionally ignored.
 * At most one alert is sent per request. Routes that catch their own errors can
 * call reportServerError(res, err) so the real cause/stack is included.
 */
export function withErrorNotify(handler: ApiHandler, source: string): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    let notified = false

    // Capture the last JSON body so we can include the error message in the alert.
    let lastBody: unknown = null
    const originalJson = res.json.bind(res)
    res.json = ((body: unknown) => {
      lastBody = body
      return originalJson(body as never)
    }) as typeof res.json

    const bodyMessage = (): string | undefined => {
      if (lastBody && typeof lastBody === 'object' && 'error' in (lastBody as Record<string, unknown>)) {
        return String((lastBody as Record<string, unknown>).error)
      }
      return undefined
    }

    try {
      await handler(req, res)
    } catch (err) {
      notified = true
      await notifyAdmin({
        level: 'error',
        source,
        subject: 'Unhandled exception',
        message: err instanceof Error ? err.message : String(err),
        context: {
          path: req.url,
          method: req.method,
          stack: err instanceof Error ? err.stack : undefined,
        },
      })
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' })
      }
      return
    }

    if (!notified && res.statusCode >= 500) {
      // Prefer the real error the route captured over the generic response body.
      const captured = readServerError(res)
      await notifyAdmin({
        level: 'error',
        source,
        subject: `HTTP ${res.statusCode}`,
        message:
          (captured instanceof Error ? captured.message : captured ? String(captured) : undefined) ||
          bodyMessage() ||
          'Server error response',
        context: {
          path: req.url,
          method: req.method,
          status: res.statusCode,
          stack: captured instanceof Error ? captured.stack : undefined,
        },
      })
    }
  }
}
