# System Overview

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │   /login    │  │  /dashboard │  │  /upgrade   │  │  /r/[id] (Landing)  ││
│  │  (OAuth)    │  │  (Stores)   │  │  (Stripe)   │  │  (Public QR Page)   ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘│
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────────┐ │
│  │  /profile   │  │ /analytics  │  │  Components: StoreCard, QRCodeModal │ │
│  │  (Billing)  │  │  /[storeId] │  │  AddStoreModal, GuidanceModal       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER (Next.js API Routes)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Auth              Stores           Billing           Reviews               │
│  ─────────────     ─────────────    ─────────────     ─────────────        │
│  /api/auth/*       /api/stores      /api/billing      /api/generate        │
│  (NextAuth)        /api/stats       /api/create-      /api/guidance-       │
│                    /api/analytics   checkout          suggestions          │
│                                     /api/cancel-      /api/lookup-         │
│                                     subscription      business             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Vercel Postgres   │  │     Vercel KV       │  │   External APIs     │
│   (Neon)            │  │     (Redis)         │  │                     │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ • users             │  │ • Rate limiting     │  │ • Google Gemini AI  │
│ • stores            │  │ • View count cache  │  │ • Stripe Payments   │
│ • landing_pages     │  │ • Session tokens    │  │ • Google Places API │
│ • review_events     │  │                     │  │ • Yelp Fusion API   │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework (Pages Router) |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Lucide React | Icons |
| qrcode.react | QR code generation |
| jspdf + html2canvas | PDF export |

### Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Serverless functions |
| @vercel/postgres | PostgreSQL client (Neon) |
| @vercel/kv | Redis client for caching |
| NextAuth.js | Authentication |
| Stripe SDK | Payment processing |

### AI & External Services
| Service | Purpose |
|---------|---------|
| Google Gemini 1.5 Flash | AI review generation |
| Google Places API | Auto-lookup store URLs |
| Yelp Fusion API | Auto-lookup store URLs |
| Stripe | Subscriptions & billing |

## Directory Structure

```
quickreviewai/
├── pages/
│   ├── api/                 # API routes (serverless functions)
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── analytics/       # Store analytics
│   │   ├── admin/           # Admin endpoints
│   │   └── cron/            # Scheduled jobs
│   ├── r/                   # Public landing pages
│   │   ├── [id].tsx         # Dynamic QR landing page
│   │   └── demo.tsx         # Demo page
│   ├── analytics/           # Analytics dashboard
│   ├── dashboard.tsx        # Main user dashboard
│   ├── index.tsx            # Homepage
│   ├── login.tsx            # Login page
│   ├── profile.tsx          # User profile & billing
│   └── upgrade.tsx          # Pro upgrade page
├── components/
│   ├── AddStoreModal.tsx    # Add/edit store form
│   ├── GuidanceModal.tsx    # Review guidance editor
│   ├── QRCodeModal.tsx      # QR code display & download
│   └── StoreCard.tsx        # Store card in dashboard
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── constants.ts         # Enums, limits, settings
│   ├── db.ts                # Database queries
│   └── types.ts             # TypeScript interfaces
├── schema.sql               # Complete database schema
└── architecture/            # This documentation
```

## Key Design Decisions

### 1. Pages Router vs App Router
Chose Pages Router for stability and simpler mental model. App Router benefits (RSC, streaming) not critical for this app.

### 2. Serverless-First
All backend logic in API routes - no separate server. Scales automatically with Vercel.

### 3. Vercel KV for Rate Limiting
Using Redis for high-frequency operations (view counting, rate limits) to reduce database load.

### 4. Review Event Tracking
Every generated review creates a `review_event` record for detailed analytics (keywords used, copy/paste tracking).

### 5. Soft Deletes
Users are soft-deleted (`deleted_at` column) to allow data recovery and comply with deletion grace periods.

