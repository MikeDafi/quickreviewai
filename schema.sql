-- QuickReviewAI Database Schema
-- Run this file to set up a new database or reset an existing one

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_tier TEXT DEFAULT 'free',  -- 'free' or 'pro'
  subscription_started_at TIMESTAMP,
  first_subscribed_at TIMESTAMP,          -- First time ever subscribed (for refund eligibility)
  period_scans INT DEFAULT 0,             -- QR scans this billing period
  period_copies INT DEFAULT 0,            -- Reviews copied this billing period
  exceeded_scans INT DEFAULT 0,           -- QR scans that hit the limit (no AI review generated)
  period_start TIMESTAMP,                 -- Start of current billing period
  deleted_at TIMESTAMP,                   -- Soft delete: NULL = active, set = scheduled for deletion
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_stripe_subscription_id ON users(stripe_subscription_id);

-- ============================================
-- STORES TABLE
-- ============================================
CREATE TABLE stores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  business_type TEXT,                     -- Comma-separated (e.g., "Pizzeria, Italian Restaurant")
  keywords TEXT[],                        -- Array of SEO keywords
  review_expectations TEXT[],             -- Array of expected review topics (legacy)
  review_guidance TEXT,                   -- Free-form guidance for AI review generation
  google_url TEXT,
  yelp_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stores_user_id ON stores(user_id);

-- ============================================
-- LANDING PAGES TABLE
-- ============================================
CREATE TABLE landing_pages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT REFERENCES stores(id) ON DELETE CASCADE,
  cached_review TEXT,                     -- Most recently generated review
  cached_at TIMESTAMP,                    -- When review was cached
  view_count INT DEFAULT 0,               -- Total QR scans
  copy_count INT DEFAULT 0,               -- Total reviews copied
  blocked_regenerations INT DEFAULT 0,    -- Times free users tried to regenerate
  exceeded_scans INT DEFAULT 0,           -- QR scans that hit the limit (no AI review)
  click_counts JSONB DEFAULT '{}',        -- Platform clicks: {"google": 5, "yelp": 3}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_landing_pages_store_id ON landing_pages(store_id);

-- ============================================
-- REVIEW EVENTS TABLE (Analytics)
-- ============================================
CREATE TABLE review_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id TEXT REFERENCES landing_pages(id) ON DELETE CASCADE,
  store_id TEXT REFERENCES stores(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  keywords_used TEXT[],                   -- Which keywords were included
  expectations_used TEXT[],               -- Which expectations were included (legacy)
  guidance_used TEXT,                     -- Which guidance was used
  length_type TEXT,                       -- 'ultra-short', 'short', 'medium', 'long', 'extended'
  persona TEXT,                           -- Character persona used
  was_copied BOOLEAN DEFAULT false,
  was_pasted_google BOOLEAN DEFAULT false,
  was_pasted_yelp BOOLEAN DEFAULT false,
  ip_hash TEXT,                           -- Hashed IP for session grouping (privacy-safe)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_review_events_store_id ON review_events(store_id);
CREATE INDEX idx_review_events_landing_page_id ON review_events(landing_page_id);
CREATE INDEX idx_review_events_created_at ON review_events(created_at);
CREATE INDEX idx_review_events_store_time ON review_events(store_id, created_at DESC);

