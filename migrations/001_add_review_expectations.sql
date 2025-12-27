-- Migration: Add review_expectations column and remove tone column
-- Run this against your Vercel Postgres database

-- Add review_expectations column
ALTER TABLE stores ADD COLUMN IF NOT EXISTS review_expectations TEXT[];

-- Remove tone column (optional - you can keep it for backwards compatibility)
-- ALTER TABLE stores DROP COLUMN IF EXISTS tone;
-- ALTER TABLE stores DROP COLUMN IF EXISTS prompt_guidance;

