# PRODUCTION DATABASE COMPLETE RESET INSTRUCTIONS

## ⚠️ WARNING - DESTRUCTIVE OPERATION
This will completely erase all production database tables and data. **BACKUP FIRST** if you need to preserve anything.

## 🎯 GOAL
Reset Production database to exactly match localhost structure with all 169 POI locations.

## 📋 EXECUTION STEPS

### Step 1: Complete Database Reset
**File**: `production-database-reset.sql`
**Action**: Run in Neon Console for Production database
**Result**: All tables, sequences, and data completely removed

### Step 2: Schema Recreation
**File**: `production-schema-recreation.sql`
**Action**: Run in Neon Console for Production database
**Result**: All tables recreated with localhost schema structure

### Step 3: Data Import
Since the full data import is large (169 POI), use the Preview environment's 138 POI dataset instead of localhost's test data:

**Recommended**: Use the 5-part migration files we created earlier but with corrected schema:
- `migration-part-1.sql` (modified for new schema)
- `migration-part-2.sql`
- `migration-part-3.sql`
- `migration-part-4.sql`
- `migration-part-5.sql`

## 🔧 ALTERNATIVE APPROACH

Instead of localhost's 169 mixed test data, restore Production with Preview's clean 138 POI dataset:

1. **Reset**: Run `production-database-reset.sql`
2. **Schema**: Run `production-schema-recreation.sql`
3. **Data**: Use Preview's 138 POI (better quality than localhost's 169 test records)

## ✅ EXPECTED RESULT

- Production database schema matches localhost
- Production has quality POI data (138 locations)
- All API endpoints work correctly
- No more "column does not exist" errors

## 🚀 RECOMMENDATION

**Use Preview's 138 POI dataset instead of localhost's 169 test data** for better production quality.
