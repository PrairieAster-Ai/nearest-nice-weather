# 🗑️ Legacy Code Deletion Tracker

## Purpose
Track when archived legacy code can be safely deleted permanently.

## Deletion Criteria
Legacy code can be deleted when **ALL** conditions are met:
1. ✅ **30+ days** since archival (enough time to discover hidden dependencies)
2. ✅ **No references found** in active codebase
3. ✅ **No production issues** related to missing functionality
4. ✅ **Tests pass** without the archived code
5. ✅ **Deployment successful** for 2+ weeks without the code

---

## Legacy Files Archived Today: 2025-01-12

### Scheduled for Review: **2025-02-11** (30 days)

**Files moved to `archived-legacy/`:**

| File | Original Location | Reason Archived | Safe to Delete? | Notes |
|------|------------------|------------------|------------------|-------|
| `api/weather-locations.ts` | `/api/` | Duplicate API using old schema | ⏳ Review 2025-02-11 | Check no Vercel functions reference this |
| `api/setup-weather-schema.ts` | `/api/` | PostGIS schema vs stable schema | ⏳ Review 2025-02-11 | Conflicts with migration_final.sql |
| `api/setup-database.ts` | `/api/` | PostGIS setup vs simple lat/lng | ⏳ Review 2025-02-11 | Check deployment scripts |
| `generate-weather-data.js` | `/` | Old weather generation | ⏳ Review 2025-02-11 | Replaced by database-seeder.js |
| `contextual-weather-schema.sql` | `/` | Previous schema attempt | ⏳ Review 2025-02-11 | Replaced by migration_final.sql |

---

## Review Checklist (Run on 2025-02-11)

### Automated Safety Checks:
```bash
# 1. Check for any remaining references
grep -r "setup-weather-schema" apps/ api/ --exclude-dir=archived-legacy
grep -r "weather-locations.ts" apps/ api/ --exclude-dir=archived-legacy  
grep -r "contextual-weather-schema" apps/ api/ --exclude-dir=archived-legacy

# 2. Verify current system works
curl -s http://localhost:4000/api/weather-locations | jq '.success'
npm run build && npm run preview

# 3. Check deployment scripts
grep -r "setup-database.ts" .github/ vercel.json DEPLOYMENT.md

# 4. Verify tests pass
npm test
```

### Manual Verification:
- [ ] Map loads and displays weather markers correctly
- [ ] API returns 10 Minnesota locations 
- [ ] No 404 errors in browser console for missing APIs
- [ ] Vercel deployment successful without archived files
- [ ] Database seeder works without old generation scripts

### Delete Command (only after all checks pass):
```bash
# DANGER: Only run after 30-day review and all checks pass
rm -rf archived-legacy/old-api/
rm -rf archived-legacy/old-schemas/
git add -A && git commit -m "🗑️ Permanently delete legacy code after 30-day safety period"
```

---

## Emergency Rollback (if needed before deletion)
```bash
# Restore specific file if dependency discovered
git checkout working-baseline-before-cleanup -- api/setup-weather-schema.ts

# Full rollback if major issues
git checkout working-baseline-before-cleanup
git reset --hard working-baseline-before-cleanup
```

---

## Notes
- **Conservative approach**: Keep archived code longer if unsure
- **Production priority**: Never delete during critical business periods
- **Documentation updates**: Update this tracker when files are deleted
- **Tag cleanup**: Can delete git tags after successful permanent deletion