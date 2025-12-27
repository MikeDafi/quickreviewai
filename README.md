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
