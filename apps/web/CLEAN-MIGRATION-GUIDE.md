# CLEAN MIGRATION EXECUTION GUIDE

## ✅ CLEAN FILES READY

**Duplicate-free migration files** prepared with **exactly 138 POI**:
- `clean-migration-part-1.sql` - POI 1-28
- `clean-migration-part-2.sql` - POI 29-56 (28 total)
- `clean-migration-part-3.sql` - POI 57-84 (28 total)
- `clean-migration-part-4.sql` - POI 85-112 (28 total)
- `clean-migration-part-5.sql` - POI 113-138 (26 total)

## 🚀 EXECUTION STEPS

### Step 1: Empty the POI table
**File**: `EMPTY-POI-TABLE.sql`
**Expected Result**: 0 POI locations, clean table

### Step 2: Execute clean migration (in order)

#### Part 1:
**File**: `clean-migration-part-1.sql`
**Expected Result**: 28 POI locations

#### Part 2:
**File**: `clean-migration-part-2.sql`
**Expected Result**: 56 total POI locations

#### Part 3:
**File**: `clean-migration-part-3.sql`
**Expected Result**: 84 total POI locations

#### Part 4:
**File**: `clean-migration-part-4.sql`
**Expected Result**: 112 total POI locations

#### Part 5:
**File**: `clean-migration-part-5.sql`
**Expected Result**: **138 total POI locations** ✅

## ✅ SUCCESS CRITERIA

- **Total Count**: Exactly 138 POI
- **No Duplicates**: Each POI name appears only once
- **Data Quality**: Mix of State Parks (highest importance), National Parks, Trails, Regional Parks, Nature Centers
- **Production Ready**: Full API compatibility

## 🎯 EXPECTED DISTRIBUTION

- **State Parks**: ~67 locations (importance_rank 10-15)
- **Regional Parks**: ~30 locations (importance_rank 18)
- **State Trails**: ~18 locations (importance_rank 18)
- **Nature Centers**: ~6 locations (importance_rank 20)
- **National Parks/Monuments**: ~5 locations (importance_rank 8-12)
- **City Parks/Other**: ~12 locations (importance_rank 18-20)

## 🔍 VERIFICATION

Final verification queries included in part 5:
- Total count check (should be 138)
- Park type distribution
- Duplicate detection (should find none)

This migration will give you **exactly 138 unique, high-quality Minnesota outdoor recreation destinations** ready for production use.
