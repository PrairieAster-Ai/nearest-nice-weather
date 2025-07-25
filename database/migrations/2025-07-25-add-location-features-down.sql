-- Rollback: Remove location features
-- Date: 2025-07-25
-- Data Loss: ⚠️ Will lose featured status and descriptions for all locations

BEGIN;

-- Remove index first
DROP INDEX CONCURRENTLY IF EXISTS idx_locations_featured;

-- Remove added columns (this will lose data!)
ALTER TABLE locations DROP COLUMN IF EXISTS featured;
ALTER TABLE locations DROP COLUMN IF EXISTS description;
ALTER TABLE locations DROP COLUMN IF EXISTS last_updated;

COMMIT;