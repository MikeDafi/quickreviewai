-- Add blocked regenerations counter to track missed opportunities for free users
-- Run this on your Neon database

ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS blocked_regenerations INT DEFAULT 0;

