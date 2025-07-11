# PROJECT CHARTER: Incremental Development Strategy

## Core Principle: Each Feature Builds Foundation for the Next
**Pattern**: Simple → Complex, always preserving working functionality as sacred infrastructure.

**Example Success**: Feedback form + database → establishes data infrastructure → weather data extends same database → user preferences build on established patterns.

## Sacred Infrastructure Rule
**NEVER break previously working features when adding new ones**

### Before Any Changes Protocol
1. **Test Current State**: Validate localhost fully functional
2. **Infrastructure Inventory**: 
   ```bash
   # Document existing database/API endpoints
   curl localhost:4000/api/feedback -X POST -H "Content-Type: application/json" -d '{"feedback":"test"}'
   curl localhost:4000/api/test-db  # Document database state
   curl localhost:4000/api/weather-locations # Test weather endpoints
   ```
3. **Document Dependencies**: What features depend on current infrastructure?

### Additive Development Only
- ✅ **ADD** new tables to existing database
- ✅ **EXTEND** existing API patterns  
- ✅ **BUILD** on established connections
- ❌ **NEVER** replace working infrastructure
- ❌ **NEVER** create parallel systems for same purpose
- ❌ **NEVER** remove mock data before replacement is proven

### Regression Prevention Checklist
- □ New feature extends existing infrastructure (not replaces)
- □ All previously working features still work  
- □ Database migrations are additive only
- □ Environment variables maintain backward compatibility
- □ **Environment variables checked first** (data source, API endpoints)
- □ Full user workflow tested after each change
- □ Localhost validation completed before marking "ready for review"

### Environment Variable Debugging (Critical First Step)
**ALWAYS CHECK THESE FIRST when data/API issues occur**:
- `VITE_API_PROXY_URL` - Controls where frontend gets data (prod vs local)
- `DATABASE_URL` - Controls where API reads/writes data
- `NODE_ENV` - Affects build behavior and data sources

**Common Issue**: Frontend proxying to production while expecting local database changes
**Solution**: Verify environment variables match intended data flow (local → local or prod → prod)

### Debug Code & Temporary Code Management
**CRITICAL**: Debug code can crash applications silently in production builds

**Dangerous Debug Patterns**:
- `document.title = ...` with complex string interpolation
- `console.log()` statements with `.toFixed()` on potentially undefined values
- `markersToShow[0]?.property.toFixed(3)` - optional chaining with method calls
- Temporary mock data that replaces real API calls

**Safe Debug Patterns**:
- `console.log('Simple message', simpleValue)`
- `console.log('Value:', value?.toString() || 'undefined')`
- Conditional logging: `if (value) console.log('Value:', value)`

**Debug Code Removal Checklist**:
- [ ] Search for `document.title` assignments
- [ ] Search for `console.log` statements  
- [ ] Search for `// DEBUG:` or `// TEMP:` comments
- [ ] Search for mock data or hardcoded values
- [ ] Search for `setTimeout` with debug purposes
- [ ] Search for `?.` optional chaining with method calls

**Symptoms of Debug Code Crashes**:
- Empty console tab (JavaScript not running)
- No network requests (app crashed before making calls)
- Default page title (app crashed before setting title)
- Map loads but no markers/functionality

### Integration Pattern Examples

#### ✅ GOOD: Extend Existing Infrastructure
```javascript
// Use same database connection for all features
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Add weather tables to existing database
CREATE TABLE weather.locations (...);
INSERT INTO weather.locations (...);
```

#### ❌ BAD: Replace/Parallel Infrastructure  
```javascript
// Don't create separate systems
const feedbackDB = new Pool({ connectionString: process.env.FEEDBACK_DB })
const weatherDB = new Pool({ connectionString: process.env.WEATHER_DB })

// Don't remove working systems before replacement ready
// generateMockLocations() - DELETED before database proven
```

## Development Workflow Requirements

### Mandatory Steps
1. **Pre-Change**: Test and document what currently works
2. **During Change**: Make incremental commits, test each step  
3. **Post-Change**: Validate ALL previously working features still work
4. **Ready for Review**: Localhost fully validated and functional

### Git Commit Messages as Project Log

**Purpose**: Each commit message serves as historical context and project narrative.

**Required Format**:
```
<type>: <summary of change>

- <bullet point of what was added/changed>
- <bullet point of why this change was needed>
- <bullet point of what this enables for future development>

**Status**: <current working features>
**Next**: <what this enables for next incremental step>

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: 
- `feat`: New feature that builds foundation
- `fix`: Bug fix that restores working functionality  
- `enhance`: Improvement to existing working feature
- `infra`: Infrastructure/database changes
- `refactor`: Code improvement without functional changes

**Examples**:
```
feat: Add weather location database integration

- Extends existing PostgreSQL database with weather.locations table
- Integrates PostGIS for spatial proximity queries  
- Builds on feedback form database foundation
- Replaces mock data with persistent, queryable weather data

**Status**: Frontend ✅, Weather DB ✅, Feedback form ❌ (regression)
**Next**: Fix feedback regression, then add user preference storage

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Project Log Commands

**View Recent Project History**:
```bash
git log --oneline -10                    # Last 10 commits summary
git log --oneline --since="1 week ago"   # Recent week's progress  
git show HEAD                            # Latest commit details
git log --grep="Status:" -5              # Find status updates
```

**Project Context Recovery**:
```bash
# Get full context of recent development
git log --since="1 week ago" --pretty=format:"%h - %s%n%b%n"

# See what features were working at specific point
git log --grep="Status.*✅" -3 --pretty=format:"%s%n%b%n"
```

### Browser Tools Integration

**Real-time Frontend Debugging Infrastructure** (Added 2025-07-10):

**Services Running**:
- Browser Tools Server: `http://localhost:3025` (keep running)
- Chrome Extension: Browser Tools MCP v1.2.0 (installed)
- MCP Integration: Connects Claude Code to browser activity

**Capabilities**:
- ✅ Real-time console log streaming (no more manual copying)
- ✅ Automatic screenshot capture for visual debugging
- ✅ Network request monitoring (API calls visible)
- ✅ DOM change tracking (map interactions, filter updates)

**Usage**:
- Keep Chrome DevTools open when working on frontend
- Browser Tools automatically captures activity for Claude Code
- No manual screenshot sharing needed for "localhost ready for review"
- Console errors/logs visible to Claude Code in real-time

**Setup Commands** (for new sessions):
```bash
# Start browser tools server (background)
npx @agentdeskai/browser-tools-server@1.2.0 &

# Verify connection
npx @agentdeskai/browser-tools-mcp@1.2.0 get-console-logs
```

**Chrome Extension Path**: `chrome-extension/` (already installed)

### Context Preservation
- This charter is checked into version control
- Git commits serve as running project narrative
- Each commit message documents incremental progress
- Status tracking in commits enables quick context recovery
- Browser Tools provide real-time frontend visibility
- Reference this document before any infrastructure changes
- Update this document when learning new patterns/failures
- Treat working features as sacred foundation for future development

**Working Features = Sacred Infrastructure**: Never sacrifice proven functionality for new features.

---
*This charter was created to prevent regression issues that broke the incremental development strategy on 2025-07-10.*