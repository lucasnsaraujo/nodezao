-- Migration script for schema updates
-- 1. Rename regions.code to regions.slug
-- 2. Remove is_active columns from regions, offer_types, and niches
-- 3. Make offers.name nullable
-- 4. Make offers.region and offers.type nullable

BEGIN;

-- Rename regions.code to regions.slug
ALTER TABLE regions RENAME COLUMN code TO slug;

-- Drop is_active columns
ALTER TABLE regions DROP COLUMN IF EXISTS is_active;
ALTER TABLE offer_types DROP COLUMN IF EXISTS is_active;
ALTER TABLE niches DROP COLUMN IF EXISTS is_active;

-- Make offers.name nullable
ALTER TABLE offers ALTER COLUMN name DROP NOT NULL;

-- Make offers.region nullable
ALTER TABLE offers ALTER COLUMN region DROP NOT NULL;

-- Make offers.type nullable
ALTER TABLE offers ALTER COLUMN type DROP NOT NULL;

COMMIT;
