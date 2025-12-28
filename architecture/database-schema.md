# Database Schema

## Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│       users         │       │       stores        │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │──┐    │ id (PK)             │
│ email (UNIQUE)      │  │    │ user_id (FK)        │──┐
│ name                │  └───►│ name                │  │
│ stripe_customer_id  │       │ address             │  │
│ stripe_subscription │       │ business_type       │  │
│ subscription_tier   │       │ keywords[]          │  │
│ subscription_start  │       │ review_expectations │  │
│ first_subscribed_at │       │ google_url          │  │
│ period_scans        │       │ yelp_url            │  │
│ period_copies       │       │ created_at          │  │
│ exceeded_scans      │       └─────────────────────┘  │
│ period_start        │                                │
│ deleted_at          │                  │             │
│ created_at          │                  │             │
└─────────────────────┘                  │             │
                                         ▼             │
                       ┌─────────────────────┐         │
                       │   landing_pages     │         │
                       ├─────────────────────┤         │
                       │ id (PK)             │         │
                       │ store_id (FK)       │◄────────┘
                       │ cached_review       │         │
                       │ cached_at           │         │
                       │ view_count          │         │
                       │ copy_count          │         │
                       │ blocked_regenerations│        │
                       │ click_counts (JSONB)│         │
                       │ is_active           │         │
                       │ created_at          │         │
                       └─────────────────────┘         │
                                  │                    │
                                  ▼                    │
                       ┌─────────────────────┐         │
                       │   review_events     │         │
                       ├─────────────────────┤         │
                       │ id (PK)             │         │
                       │ landing_page_id (FK)│         │
                       │ store_id (FK)       │◄────────┘
                       │ review_text         │
                       │ keywords_used[]     │
                       │ expectations_used[] │
                       │ length_type         │
                       │ persona             │
                       │ was_copied          │
                       │ was_pasted_google   │
                       │ was_pasted_yelp     │
                       │ ip_hash             │
                       │ created_at          │
                       └─────────────────────┘
```

## Tables

### users
Primary user account table with subscription and billing info.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | NextAuth user ID |
| `email` | TEXT UNIQUE | User email |
| `name` | TEXT | Display name |
| `stripe_customer_id` | TEXT | Stripe customer ID |
| `stripe_subscription_id` | TEXT | Active subscription ID |
| `subscription_tier` | TEXT | 'free' or 'pro' |
| `subscription_started_at` | TIMESTAMP | Current subscription start |
| `first_subscribed_at` | TIMESTAMP | First ever subscription (refund eligibility) |
| `period_scans` | INT | Scans used this billing period |
| `period_copies` | INT | Copies this billing period |
| `exceeded_scans` | INT | QR scans that hit the limit (no AI review) |
| `period_start` | TIMESTAMP | Billing period start date |
| `deleted_at` | TIMESTAMP | Soft delete timestamp |
| `created_at` | TIMESTAMP | Account creation |

### stores
Business locations managed by users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK | Owner user |
| `name` | TEXT | Business name |
| `address` | TEXT | Full address |
| `business_type` | TEXT | Comma-separated types |
| `keywords` | TEXT[] | SEO keywords array |
| `review_expectations` | TEXT[] | Review guidance (first element) |
| `google_url` | TEXT | Google review link |
| `yelp_url` | TEXT | Yelp review link |
| `created_at` | TIMESTAMP | Creation date |

### landing_pages
QR code landing pages (one per store).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID (used in QR URL) |
| `store_id` | TEXT FK | Parent store |
| `cached_review` | TEXT | Last generated review |
| `cached_at` | TIMESTAMP | Cache timestamp |
| `view_count` | INT | Total QR scans |
| `copy_count` | INT | Total copies |
| `blocked_regenerations` | INT | Free user blocks |
| `click_counts` | JSONB | `{"google": N, "yelp": M}` |
| `is_active` | BOOLEAN | Active status |
| `created_at` | TIMESTAMP | Creation date |

### review_events
Analytics tracking for each generated review.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `landing_page_id` | TEXT FK | Parent landing page |
| `store_id` | TEXT FK | Parent store |
| `review_text` | TEXT | Generated review content |
| `keywords_used` | TEXT[] | Keywords included |
| `expectations_used` | TEXT[] | Expectations included |
| `length_type` | TEXT | ultra-short/short/medium/long/extended |
| `persona` | TEXT | Character persona used |
| `was_copied` | BOOLEAN | User clicked copy |
| `was_pasted_google` | BOOLEAN | User clicked Google (after copy) |
| `was_pasted_yelp` | BOOLEAN | User clicked Yelp (after copy) |
| `ip_hash` | TEXT | SHA256 hash of IP (privacy) |
| `created_at` | TIMESTAMP | Generation time |

## Indexes

```sql
-- Foreign key lookups
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_landing_pages_store_id ON landing_pages(store_id);
CREATE INDEX idx_review_events_store_id ON review_events(store_id);
CREATE INDEX idx_review_events_landing_page_id ON review_events(landing_page_id);

-- Time-based queries
CREATE INDEX idx_review_events_created_at ON review_events(created_at);

-- Analytics queries (store + time range)
CREATE INDEX idx_review_events_store_time ON review_events(store_id, created_at DESC);
```

## Enums (Application-Level)

```typescript
enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
}

enum Platform {
  GOOGLE = 'google',
  YELP = 'yelp',
}

enum ReviewLengthType {
  ULTRA_SHORT = 'ultra-short',
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
  EXTENDED = 'extended',
}
```

## Plan Limits

| Limit | Free | Pro |
|-------|------|-----|
| Stores | 1 | Unlimited |
| Scans/month | 15 | Unlimited |
| Regenerations/hour | 1 | 10 |
| Review Guidance | ❌ | ✅ |
| Analytics | ❌ | ✅ |

