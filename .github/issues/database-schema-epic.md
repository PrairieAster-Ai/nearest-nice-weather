# Epic: Database Schema Production Deployment

## Epic Information
**Parent Feature**: #TBD (Live Weather Data Integration)
**Epic Owner**: Claude & Bob  
**Story Points**: 8  
**Sprint**: Sprint 3  
**Status**: 🔄 IN PROGRESS  
**Priority**: HIGH - Critical path for MVP completion  

## Epic Scope
Deploy production-ready database schema supporting live weather data storage and retrieval for 100+ Minnesota outdoor recreation locations.

## User Stories Breakdown
- [ ] **Story: Production Database Configuration** (3 points)
  - Deploy Neon PostgreSQL production branch
  - Configure connection pooling for Vercel serverless
  - Validate environment variable configuration
  
- [ ] **Story: Weather Location Storage Tables** (3 points)  
  - Implement locations table with geographic indexing
  - Create weather_conditions table with temporal data
  - Set up tourism_operators table for business integration
  
- [ ] **Story: Performance Indexing Optimization** (2 points)
  - Add geographic proximity indexes for distance queries
  - Optimize weather data retrieval performance
  - Implement query caching strategy

## Implementation Requirements
**Database Schema Files**:
- `apps/web/api/db-migrate.js` - Migration execution
- `archived-legacy/database-migrations/migration_final.sql` - Schema definitions

**Environment Configuration**:
- Production: `WEATHERDB_URL` or `POSTGRES_URL` in Vercel
- Development: `DATABASE_URL` in .env file
- Connection: Neon serverless driver (`@neondatabase/serverless`)

## Acceptance Criteria
- [ ] Production database accessible from all Vercel API functions
- [ ] Geographic queries return results in <2 seconds
- [ ] Support for 1000+ concurrent weather location requests
- [ ] Migration scripts executed successfully without data loss
- [ ] Connection pooling prevents timeout errors

## Technical Requirements
**Performance Targets**:
- Database response time: <500ms for proximity queries
- Concurrent connections: Support 100+ simultaneous users
- Data integrity: ACID compliance for weather updates

**Security Requirements**:
- Environment variable isolation (development vs production)
- Connection string encryption in Vercel settings
- No database credentials in source code

## Validation Steps
- [ ] Test weather-locations API endpoint with production database
- [ ] Verify geographic distance calculations work correctly  
- [ ] Confirm all 34 Minnesota locations load properly
- [ ] Performance test with simulated user load

## File References
**Primary Files**:
- `apps/web/api/db-migrate.js` - Database migration scripts
- `apps/web/api/weather-locations.js` - Database connection usage (lines 34-153)
- `archived-legacy/database-migrations/migration_final.sql` - Complete schema

**Configuration Files**:
- `.env` - Development database connection
- Vercel Environment Variables - Production database connection

## Cross-References
- **WBS Slide**: MVP-WBS.html Slide 5 (Database Schema section)
- **API Implementation**: `apps/web/api/weather-locations.js` lines 34-153
- **Migration Guide**: documentation/runbooks/environment-setup-automation.md
- **Sprint Planning**: SPRINT-ALIGNMENT-COMPLETED.md

## Risk Mitigation
**Database Deployment Risks**:
- Migration failure: Test migrations on development branch first
- Connection timeout: Use connection pooling and retry logic
- Data loss: Backup existing data before schema changes

**Performance Risks**:
- Slow queries: Implement proper indexing strategy
- Concurrent access: Use Neon's built-in connection pooling
- Scaling issues: Monitor usage and upgrade Neon plan if needed

## Labels
`epic` `database` `sprint-3` `production` `performance` `neon-postgresql`

## Assignees
<!-- Add assignees: Claude & Bob -->

## Project Fields
- **Sprint**: Sprint 3
- **Story Points**: 8
- **Sprint Status**: 🔄 IN PROGRESS
- **WBS Owner**: Claude & Bob
- **Business Value**: Infrastructure
- **File Reference**: apps/web/api/db-migrate.js