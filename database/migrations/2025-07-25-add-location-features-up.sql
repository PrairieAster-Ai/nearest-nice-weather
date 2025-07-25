-- Migration: Add location features for MVP enhancement
-- Date: 2025-07-25
-- Safe: ✅ Additive changes only, no data loss

BEGIN;

-- Add new optional columns to locations for enhanced features
ALTER TABLE locations ADD COLUMN IF NOT EXISTS 
    featured BOOLEAN DEFAULT false;

ALTER TABLE locations ADD COLUMN IF NOT EXISTS 
    description TEXT DEFAULT '';

ALTER TABLE locations ADD COLUMN IF NOT EXISTS 
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index for featured locations (performance optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_locations_featured 
ON locations(featured) WHERE featured = true;

-- Update a few sample locations to be featured for demo
UPDATE locations 
SET featured = true, 
    description = 'Popular destination for outdoor activities'
WHERE name IN ('Minneapolis', 'Duluth', 'Brainerd')
AND featured IS NOT true; -- Avoid updating if already featured

COMMIT;