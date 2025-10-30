-- Truncate offers table to allow adding UUID with unique constraint
TRUNCATE TABLE offers CASCADE;

-- Add UUID column with default random value and unique constraint
ALTER TABLE offers
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE;
