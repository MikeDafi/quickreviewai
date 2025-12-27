-- QuickReviewAI Database Schema

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  stripe_customer_id TEXT,
  subscription_tier TEXT DEFAULT 'free',
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

-- Indexes for performance
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_landing_pages_store_id ON landing_pages(store_id);

-- Migration: Add billing period tracking to users table
-- Run this if upgrading from an existing database:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS period_scans INT DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS period_copies INT DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS period_start TIMESTAMP;
