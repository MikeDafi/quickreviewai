# QuickReviewAI

Turn happy customers into 5-star reviews with AI-generated review suggestions.

## Stack

- **Framework**: Next.js 14 (Pages Router)
- **Styling**: Tailwind CSS + DaisyUI
- **Database**: Vercel Postgres
- **Auth**: NextAuth.js (Google OAuth)
- **AI**: Google Gemini Flash
- **Payments**: Stripe

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/MikeDafi/quickreviewai.git
cd quickreviewai
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```env
# Database (provided by Vercel Postgres)
POSTGRES_URL=

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Gemini (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=

# Stripe (https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### 3. Set Up Database

Run the schema in your Vercel Postgres database:

```sql
-- See schema.sql for full schema
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

1. Push to GitHub
2. Import to Vercel
3. Add Vercel Postgres from Storage tab
4. Set environment variables
5. Deploy

## Features

- **Homepage**: Marketing page with pricing
- **Dashboard**: Manage stores and view analytics
- **Landing Pages**: Public pages for customers to see generated reviews
- **QR Codes**: Generate QR codes for each landing page
- **Analytics**: Track views, copies, and platform clicks

## License

MIT

