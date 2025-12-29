# Fail-Open Rate Limiting Design

## Overview

The application uses a **fail-open** design for rate limiting. When the rate limiting backend (Vercel KV/Redis) is unavailable, requests are **allowed through** rather than blocked.

## Affected Endpoints

### 1. Authentication Rate Limiting
**File:** `pages/api/auth/[...nextauth].ts`

```typescript
// If KV fails, allow the request (fail open)
// Auth security still handled by Google OAuth
console.error('Auth rate limit check failed:', error)
return true
```

**Risk:** During KV outages, credential stuffing attacks become possible.  
**Mitigation:** Google OAuth provides secondary protection.

### 2. Review Generation Rate Limiting
**File:** `pages/api/generate.ts`

```typescript
// If KV fails, allow the request (fail open)
console.error('Rate limit check failed:', error)
return { allowed: true, remaining: maxRequests, resetIn: RATE_LIMIT.WINDOW_SECONDS * 1000 }
```

**Risk:** During KV outages, users can bypass regeneration limits, causing increased API costs.  
**Mitigation:** Gemini API has its own rate limits as a backstop.

## Why Fail-Open?

1. **Availability over security** - A review generation app should prioritize user experience
2. **Secondary protections exist** - OAuth for auth, API quotas for generation
3. **KV outages are rare** - Vercel KV has high availability
4. **Cost is bounded** - Worst case is increased API calls during outage window

## Monitoring Requirements

### Required Alerts

| Alert | Trigger | Severity | Action |
|-------|---------|----------|--------|
| KV Connection Failures | >5 errors in 1 minute | High | Page on-call |
| Rate Limit Bypasses | >100 in 5 minutes | Medium | Investigate |
| Auth Rate Limit Failures | Any error | High | Check KV status |

### Log Patterns to Monitor

```
# Auth rate limit failures
"Auth rate limit check failed"

# Generate rate limit failures  
"Rate limit check failed"

# KV connection issues
"Failed to set rate limit expiry"
```

### Recommended Monitoring Setup

1. **Vercel Logs** - Filter for error patterns above
2. **Vercel KV Dashboard** - Monitor connection health
3. **External Uptime Monitor** - Alert on KV endpoint failures

## Alternative: Fail-Closed Design

If business requirements change to prioritize security over availability:

```typescript
// Fail-closed alternative
async function checkRateLimitStrict(ip: string, landingId: string, maxRequests: number) {
  try {
    // ... rate limit logic
  } catch (error) {
    console.error('Rate limit check failed - blocking request:', error)
    // FAIL CLOSED: Block when we can't verify
    return { allowed: false, remaining: 0, resetIn: 60000 }
  }
}
```

**Trade-offs:**
- ✅ Prevents abuse during outages
- ❌ Blocks legitimate users during outages
- ❌ Poor UX for paying customers

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01 | Fail-open for all rate limits | User experience priority, secondary protections exist |

## Review Schedule

This design should be reviewed:
- Quarterly security reviews
- After any rate limit bypass incident
- When adding new rate-limited endpoints

