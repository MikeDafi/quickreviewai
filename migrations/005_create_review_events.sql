-- Migration: Create review_events table for analytics tracking
-- This table tracks each review generation event with platform paste tracking

CREATE TABLE IF NOT EXISTS review_events (
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
CREATE INDEX IF NOT EXISTS idx_review_events_store_id ON review_events(store_id);
CREATE INDEX IF NOT EXISTS idx_review_events_landing_page_id ON review_events(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_review_events_created_at ON review_events(created_at);

-- Composite index for time-range queries per store
CREATE INDEX IF NOT EXISTS idx_review_events_store_time ON review_events(store_id, created_at DESC);

