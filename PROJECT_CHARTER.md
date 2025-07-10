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
- □ Full user workflow tested after each change
- □ Localhost validation completed before marking "ready for review"

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

### Context Preservation
- This charter is checked into version control
- Reference this document before any infrastructure changes
- Update this document when learning new patterns/failures
- Treat working features as sacred foundation for future development

**Working Features = Sacred Infrastructure**: Never sacrifice proven functionality for new features.

---
*This charter was created to prevent regression issues that broke the incremental development strategy on 2025-07-10.*