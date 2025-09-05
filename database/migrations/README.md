# Database Migration System

**Strategy**: Additive migrations with rollback scripts for shared preview/production database

## Migration Workflow

### 1. Create Migration Files
Each migration has two files:
- `YYYY-MM-DD-description-up.sql` - Forward migration
- `YYYY-MM-DD-description-down.sql` - Rollback script

### 2. Safe Migration Rules
✅ **ALWAYS SAFE**:
- Add new columns with DEFAULT values
- Create new tables
- Add indexes (use `CONCURRENTLY` for large tables)
- Insert new data

⚠️ **NEEDS CAREFUL TESTING**:
- Alter column types (may fail with existing data)
- Add NOT NULL constraints without defaults
- Rename columns/tables

🚫 **NEVER IN PRODUCTION**:
- Drop columns/tables
- Remove constraints without migration path

### 3. Testing Process
```bash
# 1. Test locally first
npm start
# Apply migration and test

# 2. Deploy to preview (shared database!)
npm run deploy:preview
./scripts/environment-validation.sh preview

# 3. If issues, rollback immediately
# Apply down.sql migration

# 4. When validated, production deployment
npm run deploy:production
```

### 4. Rollback Strategy
- Always have rollback script ready BEFORE applying migration
- Test rollback script on localhost first
- Document any data that will be lost in rollback
- Set time limit for rollback decision (e.g., 30 minutes)

## Migration Template

### Up Migration (forward)
```sql
-- Migration: Add new feature
-- Date: YYYY-MM-DD
-- Safe: ✅ Additive changes only

BEGIN;

-- Add new table for feature
CREATE TABLE IF NOT EXISTS feature_data (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new optional column to existing table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS feature_enabled BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_locations_feature
ON locations(feature_enabled) WHERE feature_enabled = true;

COMMIT;
```

### Down Migration (rollback)
```sql
-- Rollback: Remove new feature
-- Date: YYYY-MM-DD
-- Data Loss: ⚠️ Will lose all feature_data records

BEGIN;

-- Remove index
DROP INDEX CONCURRENTLY IF EXISTS idx_locations_feature;

-- Remove column (data loss!)
ALTER TABLE locations DROP COLUMN IF EXISTS feature_enabled;

-- Remove table (data loss!)
DROP TABLE IF EXISTS feature_data;

COMMIT;
```

## Emergency Rollback

If production breaks:
1. **Stop deployments immediately**
2. **Apply rollback script via API endpoint**
3. **Verify functionality restored**
4. **Debug issue offline**

## Current Schema Baseline

See `documentation/technical/current-database-schema.md` for current production schema.
All migrations should be additive from this baseline.
