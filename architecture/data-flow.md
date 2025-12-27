# Data Flow

## User Journeys

### 1. New User Signup

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │  Login   │     │  Google  │     │ NextAuth │
│  visits  │────►│  Page    │────►│  OAuth   │────►│ Callback │
│  /login  │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
                                                         ▼
                                                  ┌──────────┐
                                                  │  Create  │
                                                  │  User in │
                                                  │    DB    │
                                                  └──────────┘
                                                         │
                                                         ▼
                                                  ┌──────────┐
                                                  │ Redirect │
                                                  │    to    │
                                                  │ Dashboard│
                                                  └──────────┘
```

### 2. Store Creation Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │   Add    │     │  Lookup  │     │  Create  │
│  clicks  │────►│  Store   │────►│  Google/ │────►│  Store + │
│ "Add"    │     │  Modal   │     │  Yelp    │     │ Landing  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                  │
                      │  Auto-fill URLs                  │
                      │  after 3s typing pause           │
                      ▼                                  ▼
               ┌──────────┐                       ┌──────────┐
               │  Google  │                       │  Return  │
               │  Places  │                       │ Landing  │
               │   API    │                       │ Page ID  │
               └──────────┘                       └──────────┘
```

### 3. QR Code Scan → Review Generation

```
Customer Journey:
─────────────────

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Customer │     │  Landing │     │ Generate │     │  Display │
│  scans   │────►│   Page   │────►│  Review  │────►│  Review  │
│   QR     │     │ /r/[id]  │     │   API    │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │                │
                                        │                │
                                        ▼                ▼
                                 ┌──────────┐     ┌──────────┐
                                 │  Gemini  │     │  Create  │
                                 │    AI    │     │  Review  │
                                 │          │     │  Event   │
                                 └──────────┘     └──────────┘

Conversion Tracking:
────────────────────

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  "Copy   │     │  Update  │     │  "Post   │     │  Update  │
│  Review" │────►│was_copied│────►│   on     │────►│was_pasted│
│  button  │     │  = true  │     │  Google" │     │  = true  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
                                        ┌────────────────┘
                                        │ Only if was_copied = true
                                        ▼
                                 ┌──────────┐
                                 │  Opens   │
                                 │  Google  │
                                 │  Review  │
                                 │   Page   │
                                 └──────────┘
```

### 4. AI Review Generation Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                    /api/generate Endpoint                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Check Cache                                                     │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │ IF cached_review exists AND cached_at < 24 hours ago     │   │
│     │    AND NOT regenerate                                     │   │
│     │ THEN return cached_review                                 │   │
│     └──────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼ (cache miss or regenerate)           │
│  2. Rate Limit Check                                                │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │ Check Vercel KV for IP rate limit                        │   │
│     │ Free: 1/hour | Pro: 10/hour                              │   │
│     └──────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  3. Build Prompt                                                    │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │ • Pick 1-2 random keywords                               │   │
│     │ • Pick 1-2 random expectations                           │   │
│     │ • Pick random persona (30+ options)                      │   │
│     │ • Pick random visit reason (20+ options)                 │   │
│     │ • Pick random length (2-5 sentences)                     │   │
│     │ • Add random quirks (lol, typos, slang)                  │   │
│     │ • Include 8 real human review examples                   │   │
│     │ • Add banned phrase list (AI-sounding words)             │   │
│     └──────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  4. Call Gemini AI                                                  │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │ Model: gemini-1.5-flash                                  │   │
│     │ Temperature: 1.4 (high creativity)                       │   │
│     │ TopP: 0.95 | TopK: 40                                    │   │
│     └──────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  5. Store Results                                                   │
│     ┌──────────────────────────────────────────────────────────┐   │
│     │ • Update landing_pages.cached_review                     │   │
│     │ • Create review_events record                            │   │
│     │ • Return review + reviewEventId                          │   │
│     └──────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5. Subscription Upgrade Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │  Upgrade │     │  Stripe  │     │  Stripe  │
│  clicks  │────►│   Page   │────►│ Checkout │────►│ Payment  │
│ "Upgrade"│     │(features)│     │ Session  │     │  Page    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
                                                         ▼
                                                  ┌──────────┐
                                                  │  Webhook │
                                                  │ checkout │
                                                  │.completed│
                                                  └──────────┘
                                                         │
                                                         ▼
                                                  ┌──────────┐
                                                  │  Update  │
                                                  │  user    │
                                                  │tier=pro  │
                                                  └──────────┘
                                                         │
                                                         ▼
                                                  ┌──────────┐
                                                  │ Redirect │
                                                  │    to    │
                                                  │ Dashboard│
                                                  └──────────┘
```

## View Count Tracking (High Frequency)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    View Count Architecture                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Problem: High-frequency writes (every QR scan)                     │
│  Solution: Cache in Vercel KV, batch sync to Postgres               │
│                                                                     │
│  ┌──────────────┐                                                   │
│  │  QR Scan     │                                                   │
│  │  /r/[id]     │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────┐     ┌──────────────┐                             │
│  │  Increment   │────►│  Vercel KV   │  view_count:{id}            │
│  │  KV Counter  │     │  (Redis)     │                             │
│  └──────────────┘     └──────────────┘                             │
│                              │                                      │
│                              │  Cron job (every few minutes)        │
│                              ▼                                      │
│                       ┌──────────────┐                             │
│                       │  Sync to     │                             │
│                       │  Postgres    │                             │
│                       │  (batch)     │                             │
│                       └──────────────┘                             │
│                                                                     │
│  On Dashboard Load:                                                 │
│  ┌──────────────┐                                                   │
│  │  /api/stats  │────► Sync pending KV counts + Query Postgres     │
│  └──────────────┘                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Analytics Data Aggregation

```
Analytics Query Flow (/api/analytics/[storeId]):
────────────────────────────────────────────────

Input: storeId + period (YYYY-MM-DD_YYYY-MM-DD)

┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  1. Summary Stats                                                   │
│     SELECT COUNT(*), COUNT(CASE WHEN was_copied...)                │
│     FROM review_events WHERE store_id = ? AND created_at BETWEEN   │
│                                                                     │
│  2. Previous Period (for comparison)                                │
│     Same query, shifted back by period length                       │
│                                                                     │
│  3. Keyword Performance                                             │
│     SELECT keyword, COUNT(*), COUNT(pasted)                        │
│     FROM review_events, unnest(keywords_used)                       │
│     GROUP BY keyword ORDER BY usage DESC                            │
│                                                                     │
│  4. Length Distribution                                             │
│     SELECT length_type, COUNT(*), COUNT(copied)                    │
│     GROUP BY length_type                                            │
│                                                                     │
│  5. Hourly Patterns                                                 │
│     SELECT EXTRACT(HOUR) / 3 as bucket, COUNT(*)                   │
│     GROUP BY bucket (8 buckets: 0,3,6,9,12,15,18,21)               │
│                                                                     │
│  6. Daily Patterns                                                  │
│     SELECT EXTRACT(DOW), COUNT(generated), COUNT(pasted)           │
│     GROUP BY day_of_week                                            │
│                                                                     │
│  7. Recent Reviews                                                  │
│     SELECT * FROM review_events ORDER BY created_at DESC LIMIT 50  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

