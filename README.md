# QuickReviewAI

Have Your Google Business Show Up Everywhere. When customers search for 'best pizza downtown' or 'fast friendly service', we want Google to find those keywords in your business' reviews. Start ranking for searches you never showed up for.


## Links

| Environment | URL |
|-------------|-----|
| **Production** | https://quickreviewai.com |
| **Local Dev** | http://localhost:3000 |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Stripe Dashboard** | https://dashboard.stripe.com |
| **Google Cloud Console** | https://console.cloud.google.com |

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (Pages Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Vercel Postgres (Neon) |
| Cache | Vercel KV (Redis) |
| Auth | NextAuth.js (Google OAuth) |
| AI | Google Gemini 1.5 Flash |
| Payments | Stripe |
| Hosting | Vercel |

## Architecture Documentation

See the [`architecture/`](./architecture/) folder for detailed system design docs:

- [**System Overview**](./architecture/system-overview.md) - Architecture diagram, tech stack, directory structure
- [**Database Schema**](./architecture/database-schema.md) - ER diagram, tables, indexes
- [**API Reference**](./architecture/api-reference.md) - All endpoints with request/response formats
- [**Data Flow**](./architecture/data-flow.md) - User journeys and data flow diagrams
- [**Auth & Billing**](./architecture/auth-billing.md) - NextAuth + Stripe integration

---

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Vercel CLI (`npm i -g vercel`)
- Stripe CLI (for webhook testing)

### 1. Clone and Install

```bash
git clone https://github.com/MikeDafi/quickreviewai.git
cd quickreviewai
npm install
```

### 2. Link to Vercel Project

```bash
vercel link
```

### 3. Pull Environment Variables

```bash
npm run env:pull
# or: vercel env pull .env.local
```

This pulls all env vars from Vercel, including:
- Database credentials (POSTGRES_URL)
- API keys (GEMINI_API_KEY, STRIPE_SECRET_KEY)
- OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 5. (Optional) Test Stripe Webhooks

In a separate terminal:

```bash
npm run stripe:listen
# or: stripe listen --forward-to localhost:3000/api/billing
```

**Test card:** `4242 4242 4242 4242` (any future expiry, any CVC)

---

## Production Deployment

### Option A: Git Push (Recommended)

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

Vercel automatically deploys on push to `main`.

### Option B: Manual Deploy

```bash
npm run deploy:prod
# or: vercel --prod
```

### Environment Variables (Production)

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Database (auto-set by Vercel Postgres)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Vercel KV (auto-set by Vercel KV)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# NextAuth
NEXTAUTH_SECRET=          # Generate: openssl rand -base64 32
NEXTAUTH_URL=https://quickreviewai.com

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Gemini AI
GEMINI_API_KEY=

# Google Places API (for URL auto-lookup)
GOOGLE_PLACES_API_KEY=

# Yelp Fusion API (for URL auto-lookup)
YELP_API_KEY=

# Stripe
STRIPE_SECRET_KEY=        # sk_live_xxx for production
STRIPE_WEBHOOK_SECRET=    # whsec_xxx
STRIPE_PRO_PRICE_ID=      # price_xxx

# Admin Error Alerts (Resend email)
RESEND_API_KEY=           # Resend API key (send-only key is fine)
ALERT_EMAIL_TO=           # where alert emails are sent (admin inbox)
ALERT_EMAIL_FROM=         # optional; defaults to onboarding@resend.dev
# ALERT_FORCE=1           # optional; send alerts outside production (testing only)
```

### Admin Error Alerts

The app emails an admin on real failures:

- Any API route that returns **5xx** (thrown exception or explicit 5xx response).
- **Silent generation failures** — when Gemini exhausts retries and serves a
  hardcoded fallback review while still returning HTTP 200.

Expected 4xx (401 auth, 403 plan/scan limits, 404, 429 rate limits, 405) are
intentionally not alerted.

**Setup:**

1. Create a [Resend](https://resend.com) account and API key → set `RESEND_API_KEY`.
2. Set `ALERT_EMAIL_TO` to your admin inbox.
3. Sender address (`ALERT_EMAIL_FROM`):
   - **Quick start:** leave unset → uses `onboarding@resend.dev`. Note: without a
     verified domain, Resend only delivers to the email your Resend account is
     registered under, so set `ALERT_EMAIL_TO` to that address.
   - **Production:** verify your domain in Resend and set e.g.
     `ALERT_EMAIL_FROM=alerts@quickreviewai.com` to send to any recipient.

Alerts are **disabled unless configured** and only fire when
`VERCEL_ENV=production` (set `ALERT_FORCE=1` to test elsewhere). A missing key or
recipient makes alerting a safe no-op.

**Verify delivery:**

```bash
curl -X POST https://quickreviewai.com/api/admin/test-alert \
  -H "Authorization: Bearer $CRON_SECRET"
# → { "sent": true, "config": { ... } }  and an email arrives
```

---

## Database Setup

### Initial Setup (New Project)

1. Create Vercel Postgres from Vercel Dashboard → Storage → Create Database
2. Run the schema:

```bash
# Copy schema.sql contents and run in Vercel Postgres Query tab
# Or use psql:
psql $POSTGRES_URL -f schema.sql
```

### Migrations (existing database)

When new tables are added to `schema.sql`, apply them to a live database without
dropping data. The `review_queue` table (pre-generated review buffer per store)
ships with an idempotent `CREATE TABLE IF NOT EXISTS` migration snippet at the
bottom of `schema.sql` — copy that snippet into the Vercel Postgres Query tab (or
run it via `psql $POSTGRES_URL`) to add it to an existing deployment.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run env:pull` | Pull env vars from Vercel |
| `npm run stripe:listen` | Forward Stripe webhooks locally |
| `npm run deploy:prod` | Deploy to production |

---

## Project Structure

```
quickreviewai/
├── pages/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── analytics/    # Store analytics
│   │   ├── admin/        # Admin tools
│   │   └── cron/         # Scheduled jobs
│   ├── r/                # Public landing pages
│   ├── analytics/        # Analytics dashboard
│   ├── dashboard.tsx     # Main dashboard
│   ├── index.tsx         # Homepage
│   ├── login.tsx         # Login page
│   ├── profile.tsx       # User profile
│   └── upgrade.tsx       # Upgrade page
├── components/           # React components
├── lib/                  # Utilities
│   ├── auth.ts           # NextAuth config
│   ├── constants.ts      # Enums & limits
│   ├── db.ts             # Database queries
│   └── types.ts          # TypeScript types
├── architecture/         # System design docs
├── schema.sql            # Full DB schema
└── public/               # Static assets
```

---

## Features

| Feature | Free | Pro ($9.99/mo) |
|---------|------|----------------|
| Stores | 1 | Unlimited |
| QR Scans/month | 15 | Unlimited |
| Regenerations/hour | 1 | 10 |
| Review Guidance | ❌ | ✅ |
| Analytics Dashboard | ❌ | ✅ |
| URL Auto-lookup | ✅ | ✅ |

---

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf .next node_modules/.cache
npm run dev
```

### Database connection issues
```bash
# Verify env vars are loaded
npm run env:pull
# Check connection
psql $POSTGRES_URL -c "SELECT 1"
```

### Stripe webhooks not working locally
```bash
# Make sure Stripe CLI is running
npm run stripe:listen
# Check the webhook secret matches STRIPE_WEBHOOK_SECRET
```

---

## License

MIT
