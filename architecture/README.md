# QuickReviewAI Architecture

System design documentation for QuickReviewAI - an AI-powered review generation platform for local businesses.

## Documentation Index

| Document | Description |
|----------|-------------|
| [System Overview](./system-overview.md) | High-level architecture, tech stack, and component diagram |
| [Database Schema](./database-schema.md) | Entity relationships, tables, and indexes |
| [API Reference](./api-reference.md) | All API endpoints with request/response formats |
| [Data Flow](./data-flow.md) | User journeys and data flow diagrams |
| [Authentication & Billing](./auth-billing.md) | NextAuth.js + Stripe integration |

## Quick Stats

- **Framework**: Next.js 14 (Pages Router)
- **Database**: Vercel Postgres (Neon)
- **Cache**: Vercel KV (Redis)
- **AI**: Google Gemini 1.5 Flash
- **Auth**: NextAuth.js with Google OAuth
- **Payments**: Stripe (Checkout + Customer Portal)
- **Hosting**: Vercel

## Core Features

1. **AI Review Generation** - Human-like reviews with randomized personas, keywords, and expectations
2. **QR Code Landing Pages** - Customers scan → get review → copy → paste to Google/Yelp
3. **Analytics Dashboard** - Track conversions, keyword performance, time patterns
4. **Subscription Management** - Free tier (limited) + Pro tier ($9.99/mo)
5. **Review Guidance** - Pro users can customize what AI emphasizes

