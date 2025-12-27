-- QuickReviewAI Database Schema

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_started_at TIMESTAMP,
  first_subscribed_at TIMESTAMP,  -- First time ever subscribed (for refund eligibility)
  period_scans INT DEFAULT 0,
  period_copies INT DEFAULT 0,
  period_start TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  business_type TEXT,
  keywords TEXT[],
  review_expectations TEXT[],
  google_url TEXT,
  yelp_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE landing_pages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT REFERENCES stores(id) ON DELETE CASCADE,
  cached_review TEXT,
  cached_at TIMESTAMP,
  view_count INT DEFAULT 0,
  copy_count INT DEFAULT 0,
  click_counts JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Review events table for analytics (tracks each review generation)
CREATE TABLE review_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id TEXT REFERENCES landing_pages(id) ON DELETE CASCADE,
  store_id TEXT REFERENCES stores(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  keywords_used TEXT[],           -- Which keywords were included in this review
  expectations_used TEXT[],       -- Which expectations were included
  length_type TEXT,               -- 'ultra-short', 'short', 'medium', 'long', 'extended'
  persona TEXT,                   -- Character persona used
  was_copied BOOLEAN DEFAULT false,
  was_pasted_google BOOLEAN DEFAULT false,
  was_pasted_yelp BOOLEAN DEFAULT false,
  ip_hash TEXT,                   -- Hashed IP for grouping sessions (privacy-safe)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_landing_pages_store_id ON landing_pages(store_id);
CREATE INDEX idx_review_events_store_id ON review_events(store_id);
CREATE INDEX idx_review_events_landing_page_id ON review_events(landing_page_id);
CREATE INDEX idx_review_events_created_at ON review_events(created_at);

-- Composite index for time-range queries per store
CREATE INDEX idx_review_events_store_time ON review_events(store_id, created_at DESC);

-- Migration: Add billing period tracking to users table
-- Run this if upgrading from an existing database:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS period_scans INT DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS period_copies INT DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS period_start TIMESTAMP;

-- Migration: Add review_events table
-- CREATE TABLE review_events (
--   id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
--   landing_page_id TEXT REFERENCES landing_pages(id) ON DELETE CASCADE,
--   store_id TEXT REFERENCES stores(id) ON DELETE CASCADE,
--   review_text TEXT NOT NULL,
--   keywords_used TEXT[],
--   expectations_used TEXT[],
--   length_type TEXT,
--   persona TEXT,
--   was_copied BOOLEAN DEFAULT false,
--   was_pasted_google BOOLEAN DEFAULT false,
--   was_pasted_yelp BOOLEAN DEFAULT false,
--   ip_hash TEXT,
--   created_at TIMESTAMP DEFAULT NOW()
-- );
-- CREATE INDEX idx_review_events_store_id ON review_events(store_id);
-- CREATE INDEX idx_review_events_landing_page_id ON review_events(landing_page_id);
-- CREATE INDEX idx_review_events_created_at ON review_events(created_at);
-- CREATE INDEX idx_review_events_store_time ON review_events(store_id, created_at DESC);
