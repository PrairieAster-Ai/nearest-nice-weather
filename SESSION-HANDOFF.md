# SESSION HANDOFF - MANDATORY READ BEFORE ANY ACTIONS

**Last Updated**: 2025-07-15 01:15 UTC  
**Session End State**: Complete system failure, all environments broken

## CRITICAL: What Is Currently Broken

### All Production Environments BROKEN
- **nearestniceweather.com**: White screen, Leaflet error `Map container is already initialized`
- **p.nearestniceweather.com**: Identical white screen with same Leaflet error
- **web-1zhvybamu-roberts-projects-3488152a.vercel.app**: Accidental Vercel project, very broken, needs deletion

### Localhost BROKEN
- **Status**: Non-functional for 24+ hours, user abandoned it yesterday
- **Current Git State**: Detached HEAD at `v1.0-deployment-fixed` tag
- **Structure**: Using apps/web directory (may be wrong structure)

### Git State Corruption
- **Problem**: Unknown which tagged version represents actual working state
- **Issue**: When user asked to revert to "known good" tag, completely different project structure appeared
- **Impact**: No reliable baseline to work from

## ROOT CAUSE ANALYSIS (From Git Log Review)

### Deployment Death Spiral: July 13-14, 2025
**Pattern**: Intensive debugging session that broke everything

**Key Destructive Changes**:
1. **API Directory Chaos**: Functions moved between `/api/` and `/apps/web/api/` multiple times
2. **Database Driver Flip-Flop**: Changed from `pg` to `@neondatabase/serverless` and back
3. **Module Format Confusion**: Multiple conversions between CommonJS and ES6 modules
4. **Environment Variable Changes**: Multiple "force deployment" commits for database URLs
5. **Structure Conflicts**: "Remove duplicate API files" indicates structural problems

**Critical Commits**:
- `e113e7c`: REVERT commit showing failed approach was backed out
- `c64db47`: "Force deployment with correct WEATHERDB_URL" (current HEAD)
- Multiple "fix" commits in rapid succession indicating escalating problems

**The Pattern**: Each "fix" created new problems, leading to system-wide failure

## CRITICAL INSIGHTS FOR FUTURE SESSIONS

### The Core Problem
**This is NOT a code problem - it's a settings/configuration issue**
- Same Leaflet error on both production and preview suggests deployment configuration problem
- Error occurs "after deployment" - points to build/environment settings
- Git log shows configuration chaos, not code bugs

### What NOT to Attempt
- ❌ **DO NOT** try to fix code - the error is deployment settings
- ❌ **DO NOT** make more git commits until working baseline is established  
- ❌ **DO NOT** deploy anything until root cause is identified
- ❌ **DO NOT** attempt structural changes while everything is broken

### Pre-Breakage Timeline (Critical)
**Last Known Working**: TODAY (July 15) - Preview was working earlier
**CRITICAL**: There was a point TODAY where preview was working and Claude started a prompt with "Holy shit!" saying the site was working and to tag git
**Break Point**: Something happened AFTER that working state today
**Current State**: July 15 evening - everything broken again

### Required First Actions for Next Session
1. **PRIORITY**: Work on PRD-001-LEAFLET-ERROR-RESOLUTION.md (active PRD for current problem)
2. **Current working state**: Git commit a9205d2 (validated working on 2025-07-14)
3. **Next step**: Deploy working commit to correct domains (NOT new Vercel projects)
4. **Research needed**: Proper Vercel project targeting to existing domains
5. **Delete accidental Vercel projects**: web-1zhvybamu-roberts-projects-3488152a.vercel.app and web-1zjro9hd1-roberts-projects-3488152a.vercel.app

### Active PRDs
- **PRD-001-LEAFLET-ERROR-RESOLUTION.md**: Main focus - fix white screen error
- **KPI-DASHBOARD.md**: Track performance metrics
- **PRD-TEMPLATE.md**: Use for future work items

### Session Pattern to Break
```
Broken State → Guess at Fix → More Broken → Panic Deploy → Worse State
```
**Must become**:
```
Identify Working State → Identify What Changed → Minimal Revert → Test
```

## MANDATORY NEXT ACTIONS (Do These First)

1. **DO NOT CODE ANYTHING** until reading this entire file
2. **Pick ONE issue**: Either fix production Leaflet error OR establish working baseline
3. **Verify current localhost actually works in browser** before making any changes
4. **Test git tags in browser** to find actual working state
5. **Update this file** when session ends with what you learned

## What NOT To Do

- ❌ Don't try to fix multiple things at once
- ❌ Don't deploy without knowing exactly what you're deploying
- ❌ Don't trust that "server starts" means "site works"
- ❌ Don't use outdated deployment instructions from CLAUDE.md
- ❌ Don't assume any git tag is actually working without browser testing

## Context Document Problems

- `CLAUDE.md` lines 46, 70-96: References outdated apps/web structure
- Multiple conflicting "baseline" references across documents
- No single source of truth for current working state

---

**NEXT SESSION MUST UPDATE THIS FILE** with:
- What was actually working/broken when you started
- What you attempted and results
- Current state when you finished
- Specific blockers for future sessions