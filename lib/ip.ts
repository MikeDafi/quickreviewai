/**
 * IP Address Utilities
 * 
 * Shared utilities for handling client IP addresses.
 * Used across API routes for rate limiting and analytics.
 */

import type { NextApiRequest } from 'next'
import crypto from 'crypto'

/**
 * Hash an IP address for privacy-safe storage.
 * Uses SHA-256 and truncates to 16 characters for storage efficiency.
 * 
 * @param ip - Raw IP address
 * @returns Truncated SHA-256 hash of the IP
 */
export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)
}

/**
 * Get the real client IP address from a request.
 * 
 * Security note: Only trusts Vercel's internal headers, which cannot be spoofed
 * by end users. Does NOT trust x-forwarded-for as it can be manipulated.
 * 
 * Priority order:
 * 1. x-real-ip - Set by Vercel's edge network
 * 2. x-vercel-forwarded-for - Vercel's trusted forwarded header
 * 3. socket.remoteAddress - Fallback for local development
 * 
 * @param req - Next.js API request object
 * @returns The client's IP address or 'unknown' if unavailable
 */
export function getClientIP(req: NextApiRequest): string {
  // x-real-ip is set by Vercel's edge network and is trustworthy
  const realIp = req.headers['x-real-ip'] as string
  if (realIp) return realIp
  
  // x-vercel-forwarded-for is also set by Vercel and trustworthy
  const vercelForwardedFor = req.headers['x-vercel-forwarded-for'] as string
  if (vercelForwardedFor) return vercelForwardedFor.split(',')[0].trim()
  
  // In development or non-Vercel environments, use socket address
  // Do NOT trust x-forwarded-for as it can be spoofed by clients
  return req.socket.remoteAddress || 'unknown'
}

/**
 * Derive a per-viewer identity key for cache/queue reservation.
 *
 * Prefers a client-supplied token (a random id persisted in the visitor's
 * localStorage) so that multiple distinct viewers behind the same IP
 * (shared Wi-Fi / NAT) each get their own reserved review. Falls back to the
 * hashed IP when no valid token is provided (e.g. no-JS clients or the very
 * first request before the token is set).
 *
 * IMPORTANT: use this ONLY for per-viewer cache/queue identity. Abuse rate
 * limits must remain keyed on the real IP (hashIP), because a client can rotate
 * its token freely and would otherwise trivially bypass those limits.
 *
 * @param clientId - Raw client token from the query string or request body
 * @param ipHash - Fallback hashed IP
 * @returns A namespaced viewer key (`c:<token>`) or the hashed IP fallback
 */
export function getViewerKey(clientId: string | string[] | undefined, ipHash: string): string {
  const raw = Array.isArray(clientId) ? clientId[0] : clientId
  if (raw) {
    const sanitized = raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64)
    if (sanitized.length >= 8) return `c:${sanitized}`
  }
  return ipHash
}

