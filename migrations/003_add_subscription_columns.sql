-- Add missing subscription columns to users table
-- Run this on your Neon database

ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_subscribed_at TIMESTAMP;

