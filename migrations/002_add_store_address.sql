-- Add address column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT;

-- Add index for potential address searches
CREATE INDEX IF NOT EXISTS idx_stores_address ON stores(address);

