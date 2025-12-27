# API Reference

## Authentication

All authenticated endpoints require a valid NextAuth session.

### Auth Endpoints (NextAuth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | GET | Initiate OAuth login |
| `/api/auth/signout` | POST | Sign out |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/callback/google` | GET | OAuth callback |

---

## Store Management

### GET /api/stores
Get all stores for authenticated user.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Tony's Pizza",
    "address": "123 Main St, City, ST 12345",
    "businessType": "Pizzeria, Italian",
    "keywords": ["best pizza", "authentic"],
    "reviewExpectations": ["Mention fresh ingredients"],
    "googleUrl": "https://...",
    "yelpUrl": "https://...",
    "landing_page_id": "uuid",
    "viewCount": 150,
    "copyCount": 89,
    "blockedRegenerations": 5
  }
]
```

### POST /api/stores
Create a new store.

**Request:**
```json
{
  "name": "Tony's Pizza",
  "address": "123 Main St",
  "businessType": "Pizzeria",
  "keywords": ["best pizza"],
  "reviewExpectations": ["Mention quality"],
  "googleUrl": "https://...",
  "yelpUrl": "https://..."
}
```

### PUT /api/stores?id={storeId}
Update an existing store.

### DELETE /api/stores?id={storeId}
Delete a store and its landing page.

---

## Review Generation

### GET /api/generate?id={landingPageId}
Generate a review for a landing page.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Landing page ID |
| `regenerate` | boolean | Force new generation |

**Response:**
```json
{
  "landing": {
    "id": "uuid",
    "store_name": "Tony's Pizza",
    "business_type": "Pizzeria",
    "google_url": "https://...",
    "yelp_url": "https://..."
  },
  "review": "Finally tried this place after...",
  "reviewEventId": "uuid"
}
```

### POST /api/generate?id={landingPageId}&action=copy
Track when user copies review.

**Request:**
```json
{
  "reviewEventId": "uuid"
}
```

### POST /api/generate?id={landingPageId}&action=click&platform=google|yelp
Track when user clicks platform link (only counted if copied first).

---

## Analytics

### GET /api/analytics/{storeId}?period={dateRange}
Get analytics for a store.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `period` | string | Date range: `YYYY-MM-DD_YYYY-MM-DD` |

**Response:**
```json
{
  "store": { "id": "", "name": "", "keywords": [] },
  "period": "2024-12-01_2024-12-31",
  "days": 31,
  "summary": {
    "totalReviews": 624,
    "copiedCount": 356,
    "pastedGoogle": 180,
    "pastedYelp": 87,
    "totalPasted": 267,
    "copyRate": "57.1",
    "pasteRate": "75.0",
    "conversionRate": "42.8"
  },
  "keywordStats": [...],
  "lengthStats": [...],
  "hourlyStats": [...],
  "dailyStats": [...],
  "recentReviews": [...]
}
```

### GET /api/stats
Get dashboard stats for authenticated user.

**Response:**
```json
{
  "totalScans": 450,
  "reviewsCopied": 234,
  "blockedRegenerations": 12,
  "storeCount": 3,
  "tier": "pro",
  "scanLimit": null,
  "periodStart": "2024-12-01T00:00:00Z"
}
```

---

## Billing

### GET /api/subscription
Get current subscription status.

**Response:**
```json
{
  "tier": "pro",
  "status": "active",
  "customerId": "cus_xxx",
  "subscriptionId": "sub_xxx",
  "currentPeriodEnd": "2025-01-15T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "eligibleForRefund": true,
  "daysUntilRefundExpires": 2
}
```

### POST /api/create-checkout
Create Stripe checkout session.

**Request:**
```json
{
  "tier": "pro",
  "returnUrl": "/dashboard"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/cancel-subscription
Cancel subscription (with optional refund).

**Request:**
```json
{
  "requestRefund": true
}
```

### POST /api/create-portal-session
Create Stripe customer portal session.

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### POST /api/billing (Webhook)
Stripe webhook endpoint for payment events.

**Events handled:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

## Utilities

### POST /api/lookup-business
Auto-lookup Google/Yelp review URLs.

**Request:**
```json
{
  "name": "Tony's Pizza",
  "address": "123 Main St, City, ST"
}
```

**Response:**
```json
{
  "googleUrl": "https://search.google.com/local/writereview?placeid=xxx",
  "yelpUrl": "https://www.yelp.com/writeareview/biz/xxx"
}
```

### POST /api/guidance-suggestions
Get AI-generated review guidance suggestions.

**Request:**
```json
{
  "businessTypes": ["Pizzeria"],
  "city": "New York",
  "storeName": "Tony's Pizza",
  "keywords": ["best pizza"]
}
```

**Response:**
```json
{
  "suggestions": [
    "Highlight our wood-fired oven and authentic recipes",
    "Mention the cozy family atmosphere",
    "Emphasize fast delivery times"
  ]
}
```

---

## Admin

### POST /api/admin/sync-subscription
Manually sync user subscription from Stripe.

**Request:**
```json
{
  "email": "user@example.com"
}
```

---

## Cron Jobs

### GET /api/cron/cleanup
Clean up soft-deleted users (runs daily).

### GET /api/cron/sync-views
Sync view counts from KV cache to database.

