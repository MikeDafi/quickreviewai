# Authentication & Billing

## Authentication Flow (NextAuth.js)

### Configuration

```typescript
// lib/auth.ts
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account", // Force account picker
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Create or update user in database
      await upsertUser(user.id, user.email, user.name);
      return true;
    },
    async session({ session, token }) {
      // Add user ID to session
      session.user.id = token.sub;
      return session;
    },
  },
};
```

### Session Management

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │     │   NextAuth   │     │   Database   │
│   Cookie     │────►│   Session    │────►│    User      │
│  (JWT/DB)    │     │   Callback   │     │   Record     │
└──────────────┘     └──────────────┘     └──────────────┘

Protected Route Check:
─────────────────────
1. useSession() hook checks for valid session
2. If unauthenticated → redirect to /login
3. If authenticated → render protected content
```

### Environment Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# NextAuth
NEXTAUTH_URL=https://quickreviewai.com
NEXTAUTH_SECRET=xxx  # Random 32+ character string
```

---

## Billing System (Stripe)

### Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 1 store, 15 scans/mo, 1 regen/hr |
| Pro | $9.99/mo | Unlimited stores, scans, 10 regens/hr, analytics, guidance |

### Stripe Products Setup

```
Stripe Dashboard:
─────────────────
Product: QuickReviewAI Pro
  └─ Price: $9.99/month (recurring)
     └─ Price ID: price_xxx (used in checkout)
```

### Checkout Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Checkout Sequence                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User clicks "Upgrade to Pro"                                 │
│     └─► /upgrade page loads                                      │
│                                                                  │
│  2. User clicks "Continue to Stripe"                             │
│     └─► POST /api/create-checkout                                │
│         {                                                        │
│           tier: "pro",                                           │
│           returnUrl: "/dashboard"                                │
│         }                                                        │
│                                                                  │
│  3. Server creates Stripe Checkout Session                       │
│     └─► stripe.checkout.sessions.create({                        │
│           customer_email: user.email,                            │
│           line_items: [{ price: PRICE_ID }],                     │
│           mode: 'subscription',                                  │
│           success_url: returnUrl + '?success=true',              │
│           cancel_url: returnUrl + '?canceled=true',              │
│           metadata: { userId, tier }                             │
│         })                                                       │
│                                                                  │
│  4. Redirect to Stripe Checkout                                  │
│     └─► https://checkout.stripe.com/pay/xxx                      │
│                                                                  │
│  5. User completes payment                                       │
│     └─► Stripe sends webhook to /api/billing                     │
│                                                                  │
│  6. Webhook updates user                                         │
│     └─► UPDATE users SET                                         │
│           subscription_tier = 'pro',                             │
│           stripe_customer_id = xxx,                              │
│           stripe_subscription_id = xxx,                          │
│           subscription_started_at = NOW()                        │
│                                                                  │
│  7. User redirected to success_url                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Webhook Events

```typescript
// /api/billing.ts
switch (event.type) {
  case 'checkout.session.completed':
    // New subscription created
    // Update user: tier=pro, stripe_customer_id, stripe_subscription_id
    break;
    
  case 'customer.subscription.updated':
    // Subscription changed (upgrade/downgrade/renewal)
    // Update user tier based on new status
    break;
    
  case 'customer.subscription.deleted':
    // Subscription canceled
    // Update user: tier=free, clear subscription IDs
    break;
    
  case 'invoice.paid':
    // Successful renewal payment
    // Reset period counters
    break;
    
  case 'invoice.payment_failed':
    // Payment failed
    // Could downgrade or send notification
    break;
}
```

### Refund Policy

```
┌──────────────────────────────────────────────────────────────────┐
│                    Refund Eligibility                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Conditions for automatic refund:                                │
│  1. first_subscribed_at must be set (user subscribed before)     │
│  2. Time since first_subscribed_at < 3 days                      │
│  3. This is user's first ever subscription                       │
│                                                                  │
│  ┌─────────────┐                                                 │
│  │ User clicks │                                                 │
│  │  "Cancel"   │                                                 │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────┐                            │
│  │ Check first_subscribed_at      │                            │
│  │ vs NOW() < 3 days?             │                            │
│  └──────┬────────────┬────────────┘                            │
│         │            │                                          │
│      Yes│            │No                                        │
│         ▼            ▼                                          │
│  ┌───────────┐  ┌───────────────┐                              │
│  │  Show     │  │ Cancel at     │                              │
│  │  Refund   │  │ period end    │                              │
│  │  Option   │  │ (no refund)   │                              │
│  └───────────┘  └───────────────┘                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Customer Portal

```typescript
// /api/create-portal-session.ts
const session = await stripe.billingPortal.sessions.create({
  customer: user.stripe_customer_id,
  return_url: `${process.env.NEXTAUTH_URL}/profile`,
});

// Redirect user to session.url
// Stripe Portal allows:
// - View invoices
// - Update payment method
// - Cancel subscription
// - View subscription history
```

### Billing Period Tracking

```sql
-- Users table columns for billing periods
period_scans INT DEFAULT 0,      -- Scans used this period
period_copies INT DEFAULT 0,     -- Copies this period
period_start TIMESTAMP,          -- When current period started

-- Reset on successful invoice payment (webhook)
UPDATE users SET
  period_scans = 0,
  period_copies = 0,
  period_start = NOW()
WHERE stripe_customer_id = ?
```

### Security Considerations

1. **Webhook Verification**: All Stripe webhooks verified with `stripe.webhooks.constructEvent()`
2. **Price ID Validation**: Only accept known price IDs in checkout
3. **User Association**: Match webhook customer email to database user
4. **Idempotency**: Handle duplicate webhook deliveries gracefully
5. **Test Mode**: Use Stripe test keys in development (`sk_test_*`)

### Testing

```bash
# Start webhook forwarding
npm run stripe:listen
# stripe listen --forward-to localhost:3000/api/billing

# Test card numbers
4242 4242 4242 4242  # Success
4000 0000 0000 0002  # Decline
4000 0000 0000 3220  # 3D Secure
```

