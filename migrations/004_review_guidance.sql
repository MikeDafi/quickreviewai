-- Migration: Convert review_expectations (TEXT[]) to review_guidance (TEXT)
-- This changes from predefined checkboxes to a free-form text field

-- Add the new column
ALTER TABLE stores ADD COLUMN IF NOT EXISTS review_guidance TEXT;

-- Migrate existing data: join array elements into a single string
UPDATE stores 
SET review_guidance = array_to_string(review_expectations, ', ')
WHERE review_expectations IS NOT NULL AND array_length(review_expectations, 1) > 0;

-- Drop the old column (optional - can keep for backwards compatibility during transition)
-- ALTER TABLE stores DROP COLUMN IF EXISTS review_expectations;

-- Update review_events table
ALTER TABLE review_events ADD COLUMN IF NOT EXISTS guidance_used TEXT;

-- Migrate existing expectations_used to guidance_used
UPDATE review_events 
SET guidance_used = array_to_string(expectations_used, ', ')
WHERE expectations_used IS NOT NULL AND array_length(expectations_used, 1) > 0;

-- Optional: Drop old column after migration is verified
-- ALTER TABLE review_events DROP COLUMN IF EXISTS expectations_used;

