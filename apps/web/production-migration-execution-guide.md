# PRODUCTION POI MIGRATION EXECUTION GUIDE

## ✅ COMPLETED STEPS
1. ✅ **Database Reset**: All production tables erased
2. ✅ **Schema Recreation**: New schema with `importance_rank` column created  
3. ✅ **Migration Files**: All 5 corrected migration files prepared

## 🚀 NEXT: EXECUTE MIGRATION

### Step 3: Execute 5-Part Data Migration

Run these files **in order** in Neon Console for Production database:

#### Part 1: Import POI 1-30
**File**: `corrected-migration-part-1.sql`
**Expected Result**: 30 POI locations inserted

#### Part 2: Import POI 31-60  
**File**: `corrected-migration-part-2.sql`
**Expected Result**: 60 total POI locations

#### Part 3: Import POI 61-90
**File**: `corrected-migration-part-3.sql` 
**Expected Result**: 90 total POI locations

#### Part 4: Import POI 91-120
**File**: `corrected-migration-part-4.sql`
**Expected Result**: 120 total POI locations

#### Part 5: Import POI 121-138
**File**: `corrected-migration-part-5.sql`
**Expected Result**: 138 total POI locations

## 🔍 VERIFICATION QUERIES

After each migration part, verify count:
```sql
SELECT COUNT(*) as current_count FROM poi_locations;
```

Final verification after all 5 parts:
```sql
-- Should show 138 total POI
SELECT COUNT(*) as final_total FROM poi_locations;

-- Sample data structure check
SELECT name, park_type, importance_rank, data_source 
FROM poi_locations 
ORDER BY importance_rank, name 
LIMIT 5;
```

## ✅ SUCCESS CRITERIA

- **Total POI Count**: 138 locations
- **Schema Structure**: All columns including `importance_rank` 
- **Data Quality**: Mix of State Parks, National Parks, Trails, Nature Centers
- **API Compatibility**: Production matches Preview environment

## 🚨 TROUBLESHOOTING

If any migration part fails:
1. **Column errors**: Schema recreation may have failed - rerun step 2
2. **Timeout errors**: Wait 30 seconds and retry the failed part
3. **Duplicate errors**: Reset database and start over from step 1

## 🔄 FINAL STEPS AFTER MIGRATION

1. **Test API endpoints**:
   - `https://www.nearestniceweather.com/api/poi-locations-with-weather?limit=5`
   - `https://www.nearestniceweather.com/api/health`

2. **Configure Redis environment variables** (optional - for caching)
3. **Clear any cached data** to force fresh API responses

## 📊 EXPECTED TIMELINE

- **Each migration part**: 30-60 seconds
- **Total migration time**: 5-10 minutes
- **Complete production setup**: Ready within 15 minutes