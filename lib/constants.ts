// ============================================
// Subscription Tiers
// ============================================
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
}

// Type for tier keys
export type TierKey = keyof typeof SubscriptionTier

// ============================================
// Plan Limits
// ============================================
export interface PlanLimits {
  stores: number
  scansPerMonth: number
  regenerationsPerHour: number
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  [SubscriptionTier.FREE]: {
    stores: 1,
    scansPerMonth: 15,
    regenerationsPerHour: 1,
  },
  [SubscriptionTier.PRO]: {
    stores: Infinity,
    scansPerMonth: Infinity,
    regenerationsPerHour: 10,
  },
  [SubscriptionTier.BUSINESS]: {
    stores: Infinity,
    scansPerMonth: Infinity,
    regenerationsPerHour: 10,
  },
}

// Demo page rate limit (separate from user tiers)
export const DEMO_REGENERATIONS_PER_HOUR = 3

// Helper to get limits for a tier string
export function getPlanLimits(tier: string | null | undefined): PlanLimits {
  const normalizedTier = (tier?.toLowerCase() || SubscriptionTier.FREE) as SubscriptionTier
  return PLAN_LIMITS[normalizedTier] || PLAN_LIMITS[SubscriptionTier.FREE]
}

// Helper to check if a tier is valid
export function isValidTier(tier: string): tier is SubscriptionTier {
  return Object.values(SubscriptionTier).includes(tier as SubscriptionTier)
}

// ============================================
// Time Constants
// ============================================
export const TIME = {
  // Milliseconds
  SECOND_MS: 1000,
  MINUTE_MS: 60 * 1000,
  HOUR_MS: 60 * 60 * 1000,
  DAY_MS: 24 * 60 * 60 * 1000,
  
  // Seconds
  MINUTE_SECONDS: 60,
  HOUR_SECONDS: 60 * 60,
  DAY_SECONDS: 24 * 60 * 60,
} as const

// ============================================
// Rate Limiting
// ============================================
export const RATE_LIMIT = {
  WINDOW_SECONDS: TIME.HOUR_SECONDS, // 1 hour window
  CACHE_TTL_SECONDS: TIME.DAY_SECONDS, // 24 hours for cached reviews
} as const

// ============================================
// Billing & Refunds
// ============================================
export const BILLING = {
  REFUND_WINDOW_MS: 3 * TIME.DAY_MS, // 3 days for first-time refund
  REFUND_WINDOW_DAYS: 3,
} as const

// ============================================
// Review Length Types
// ============================================
export enum ReviewLengthType {
  ULTRA_SHORT = 'ultra-short',
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
  EXTENDED = 'extended',
}

// ============================================
// Platform Types (for click tracking)
// ============================================
export enum Platform {
  GOOGLE = 'google',
  YELP = 'yelp',
}

export const VALID_PLATFORMS = Object.values(Platform)

// ============================================
// API Action Types
// ============================================
export enum GenerateAction {
  COPY = 'copy',
  CLICK = 'click',
}

// ============================================
// Default Values
// ============================================
export const DEFAULTS = {
  SUBSCRIPTION_TIER: SubscriptionTier.FREE,
  SCAN_LIMIT_DISPLAY: -1, // -1 means unlimited
} as const

