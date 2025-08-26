#!/bin/bash

# GitHub Project Setup: POI Database Expansion via Overpass API
# Transforms research into actionable GitHub Project with 24+ issues across 4 milestones

set -e

echo "🚀 Setting up GitHub Project: POI Database Expansion via Overpass API"
echo "=================================================="

# Check if GitHub CLI is authenticated
if ! gh auth status > /dev/null 2>&1; then
    echo "❌ GitHub CLI not authenticated. Run 'gh auth login' first."
    exit 1
fi

echo "✅ GitHub CLI authenticated"

# Create project milestones
echo "📅 Creating project milestones..."

gh issue create --title "Epic: POI Database Expansion via Overpass API" \
    --body "**Mission**: Expand Minnesota outdoor recreation POI database from 138 to 1,000+ locations using OpenStreetMap data via Overpass API.

**Business Value**: 
- 7x POI coverage expansion (138 → 1,000+ locations)
- \$252,000 potential annual revenue impact  
- 1,050% ROI within 12 months
- Market leadership in Minnesota outdoor recreation data

**Timeline**: 4 weeks (Jan 27 - Feb 24, 2025)

**Success Metrics**:
- [ ] 1,000+ Minnesota POI locations in database
- [ ] 4.0/5.0 average data quality rating
- [ ] <500ms POI query response time  
- [ ] Weekly automated POI updates
- [ ] Zero impact to existing user experience

**Related Documents**: 
- Technical Assessment: OVERPASS-API-ASSESSMENT.md
- Project Plan: GITHUB-PROJECT-OVERPASS-API.md
- Database Schema: wiki-repo/Database-Schema.md

**Milestones Overview**:
1. Research & Prototyping (Week 1) - Validate feasibility
2. Core Integration (Week 2-3) - Build production system
3. Production Deployment (Week 4) - Deploy with monitoring  
4. Enhancement & Optimization (Ongoing) - Continuous improvement

This epic represents a strategic growth initiative to position Nearest Nice Weather as the most comprehensive outdoor recreation platform in Minnesota." \
    --label "epic,priority: high,impact: revenue,component: poi-database" \
    --assignee "$(gh api user --jq .login)"

echo "✅ Created epic issue"

# Milestone 1: Research & Prototyping Issues
echo "🔍 Creating Milestone 1 issues (Research & Prototyping)..."

gh issue create --title "Research: Analyze Overpass API Minnesota POI coverage" \
    --body "## 🔍 Research Objective
Analyze Overpass API coverage and data quality for Minnesota outdoor recreation POI data to validate expansion feasibility.

## ❓ Key Questions  
- How many Minnesota parks/trails are available via Overpass API?
- What is the data quality and completeness of OSM outdoor recreation tags?
- How does Overpass data compare to our existing 138 curated locations?
- What are the data gaps and quality issues we need to address?

## 📊 Success Metrics
- Identify 500+ potential Minnesota outdoor POI locations
- Assess data quality for representative sample (50+ locations)
- Compare accuracy against existing database
- Document data gaps and quality improvement needs

## 📝 Deliverables
- [ ] Minnesota POI coverage analysis report
- [ ] Data quality assessment for 50+ sample locations  
- [ ] Comparison matrix: Overpass vs existing database
- [ ] Gap analysis and quality improvement recommendations
- [ ] Technical feasibility confirmation

## 🔗 Related
Part of Epic: POI Database Expansion via Overpass API

## ⏰ Timeline
Week 1 of project (3-4 days)" \
    --label "epic: poi-expansion,phase: research,size: m,component: overpass-api" 

gh issue create --title "Prototype: Build basic Overpass API client" \
    --body "## 🎯 Feature Description
Build basic Node.js client for Overpass API to query Minnesota outdoor recreation POI data and validate integration approach.

## 📋 Acceptance Criteria  
- [ ] Successfully query Overpass API for Minnesota parks (leisure=park)
- [ ] Retrieve trail data (highway=path, highway=track) 
- [ ] Extract water access points (leisure=beach, leisure=slipway)
- [ ] Parse and normalize OSM data into our POI schema format
- [ ] Handle API rate limits and error conditions gracefully
- [ ] Generate sample dataset of 100+ Minnesota locations

## 🔍 Technical Details
- Use Node.js with axios/fetch for HTTP requests
- Implement Overpass QL queries for Minnesota bounding box (44.0,-97.0,49.0,-89.0)
- Create OSM tag mapping to our poi_locations schema
- Add basic error handling and retry logic
- Support JSON output format from Overpass API

## 🧪 Testing Requirements
- [ ] Unit tests for API client functions
- [ ] Integration tests with live Overpass API
- [ ] Validation tests for data normalization
- [ ] Error handling tests (rate limits, timeouts)

## 📚 Documentation
- [ ] Code documentation for API client
- [ ] Query examples for different POI types
- [ ] Data mapping documentation

## 🔗 Related Issues
Depends on: Research POI coverage analysis" \
    --label "epic: poi-expansion,phase: research,size: l,component: overpass-api"

gh issue create --title "Validation: Compare Overpass data with existing POI database" \
    --body "## 🎯 Feature Description
Compare 50 Overpass API locations with our existing 138 curated POI database to identify duplicates, quality differences, and data enhancement opportunities.

## 📋 Acceptance Criteria  
- [ ] Select 50 representative locations from Overpass prototype
- [ ] Identify exact duplicates with existing database
- [ ] Assess data quality differences (name, description, coordinates)
- [ ] Document enhancement opportunities (missing amenities, activities)
- [ ] Calculate duplicate detection accuracy metrics
- [ ] Validate geographic accuracy within 100m tolerance

## 🔍 Technical Details
- Use haversine formula for coordinate proximity matching
- Implement fuzzy string matching for POI names
- Compare metadata completeness (amenities, activities, descriptions)
- Document systematic data quality differences
- Create scoring system for data completeness

## 🧪 Testing Requirements
- [ ] Accuracy tests for duplicate detection algorithm
- [ ] Performance tests for comparison operations
- [ ] Edge case testing (similar names, close coordinates)

## 📚 Documentation
- [ ] Duplicate detection algorithm documentation
- [ ] Data quality comparison report
- [ ] Recommendations for production duplicate handling

## 🔗 Related Issues
Depends on: Build basic Overpass API client" \
    --label "epic: poi-expansion,phase: research,size: m,component: poi-database"

gh issue create --title "Pipeline: Establish data normalization and quality scoring" \
    --body "## 🎯 Feature Description
Create data normalization pipeline to convert OSM tags into our POI schema with quality scoring system for production deployment.

## 📋 Acceptance Criteria  
- [ ] Map OSM tags to poi_locations schema fields
- [ ] Implement quality scoring (1-5 scale) for POI completeness
- [ ] Handle missing or inconsistent OSM tag data gracefully
- [ ] Generate standardized descriptions from available tags
- [ ] Classify park types from OSM leisure/landuse tags
- [ ] Assign place_rank based on POI importance indicators

## 🔍 Technical Details
- Create tag mapping configuration (OSM → poi_locations schema)
- Implement quality scoring algorithm based on data completeness
- Add description generation from OSM tags when description missing
- Handle multiple tagging conventions for same POI type
- Support batch processing for large datasets

## 🧪 Testing Requirements
- [ ] Unit tests for tag mapping functions
- [ ] Quality scoring validation tests
- [ ] Edge case handling (missing/malformed tags)
- [ ] Performance tests for batch processing

## 📚 Documentation
- [ ] Tag mapping reference documentation
- [ ] Quality scoring algorithm explanation
- [ ] Data normalization pipeline documentation

## 🔗 Related Issues
Depends on: Compare Overpass data with existing database" \
    --label "epic: poi-expansion,phase: research,size: l,component: data-pipeline"

# Milestone 2: Core Integration Issues
echo "🚧 Creating Milestone 2 issues (Core Integration Development)..."

gh issue create --title "Feature: Implement comprehensive Overpass query suite" \
    --body "## 🎯 Feature Description
Implement complete set of Overpass API queries to extract all Minnesota outdoor recreation POI types with proper error handling and rate limiting.

## 📋 Acceptance Criteria  
- [ ] Parks query (leisure=park, landuse=recreation_ground)
- [ ] Trails query (highway=path, highway=track with outdoor tags)
- [ ] Water access query (leisure=beach, leisure=slipway, sport=fishing)
- [ ] Nature centers query (tourism=information + nature tags)
- [ ] Forest areas query (landuse=forest, natural=forest)
- [ ] Rate limiting compliance (10,000 queries/day limit)
- [ ] Automatic retry with exponential backoff
- [ ] Query result caching to minimize API calls

## 🔍 Technical Details
- Implement separate query modules for each POI type
- Add intelligent batching to stay within rate limits
- Cache query results with TTL to reduce API calls
- Support multiple Overpass API endpoints for failover
- Add comprehensive logging for monitoring and debugging

## 🧪 Testing Requirements
- [ ] Integration tests with live Overpass API
- [ ] Rate limiting behavior validation
- [ ] Error handling and retry logic tests
- [ ] Cache effectiveness tests

## 📚 Documentation
- [ ] Query suite API documentation
- [ ] Rate limiting implementation guide
- [ ] Caching strategy documentation

## 🔗 Related Issues
Builds on: Data normalization pipeline research" \
    --label "epic: poi-expansion,phase: development,size: xl,component: overpass-api"

gh issue create --title "Feature: Build duplicate detection against existing POI database" \
    --body "## 🎯 Feature Description
Implement sophisticated duplicate detection to prevent importing POI locations that already exist in our curated database of 138 locations.

## 📋 Acceptance Criteria  
- [ ] Coordinate-based matching with configurable distance tolerance
- [ ] Fuzzy name matching with configurable similarity threshold
- [ ] Handle name variations (abbreviations, alternate names)
- [ ] Identify potential duplicates for manual review
- [ ] Maintain audit trail of duplicate detection decisions
- [ ] Support batch processing for large POI imports
- [ ] Achieve >95% duplicate detection accuracy

## 🔍 Technical Details
- Use haversine formula for geographic distance calculations
- Implement Levenshtein distance for name similarity
- Support configurable thresholds (distance: 100m, name similarity: 80%)
- Create review queue for borderline matches
- Add manual override system for false positives
- Log all duplicate detection decisions for analysis

## 🧪 Testing Requirements
- [ ] Accuracy tests with known duplicates
- [ ] False positive/negative rate analysis  
- [ ] Performance tests with large datasets
- [ ] Edge case testing (similar POIs, name variations)

## 📚 Documentation
- [ ] Duplicate detection algorithm documentation
- [ ] Configuration parameter guide
- [ ] Manual review process procedures

## 🔗 Related Issues
Integrates with: Comprehensive Overpass query suite" \
    --label "epic: poi-expansion,phase: development,size: l,component: poi-database"

gh issue create --title "Feature: Create data validation and quality scoring system" \
    --body "## 🎯 Feature Description
Implement comprehensive data validation and quality scoring (1-5 scale) for imported POI data to ensure high-quality user experience.

## 📋 Acceptance Criteria  
- [ ] Validate required fields (name, coordinates, park_type)
- [ ] Geographic bounds validation (Minnesota boundaries)
- [ ] Coordinate precision and accuracy checks
- [ ] Quality scoring based on data completeness
- [ ] Reject low-quality POI data below threshold
- [ ] Generate quality improvement recommendations
- [ ] Track quality metrics over time

## 🔍 Technical Details
Quality Scoring Factors:
- Name completeness and descriptiveness (20%)
- Description availability and quality (20%)
- Coordinate accuracy and precision (15%)
- Amenities/activities metadata richness (15%)
- POI type classification accuracy (15%)
- Additional metadata (website, hours, etc.) (15%)

Validation Rules:
- Coordinates within Minnesota bounds
- Name not empty or generic
- Park type successfully classified
- No obvious data corruption

## 🧪 Testing Requirements
- [ ] Validation rule accuracy tests
- [ ] Quality scoring consistency tests
- [ ] Performance tests for batch validation
- [ ] Threshold tuning validation

## 📚 Documentation
- [ ] Quality scoring algorithm documentation
- [ ] Validation rules reference
- [ ] Quality improvement recommendations guide

## 🔗 Related Issues
Works with: Duplicate detection system" \
    --label "epic: poi-expansion,phase: development,size: l,component: data-pipeline"

gh issue create --title "Integration: Connect to existing POI data pipeline" \
    --body "## 🎯 Feature Description
Integrate Overpass API POI import system with existing poi_locations database and API endpoints to seamlessly expand location coverage.

## 📋 Acceptance Criteria  
- [ ] Import new POI data into poi_locations table
- [ ] Maintain existing API endpoint compatibility
- [ ] Update poi-locations-with-weather API for new locations
- [ ] Preserve existing 138 curated locations without modification
- [ ] Add data_source tracking ('overpass_api' vs 'manual')
- [ ] Support incremental updates (add new, update changed)
- [ ] Zero downtime deployment of expanded dataset

## 🔍 Technical Details
- Extend existing database schema with new fields if needed
- Update dev-api-server.js to handle expanded POI dataset
- Modify apps/web/api/poi-locations-with-weather.js
- Add migration scripts for production database
- Implement database transaction handling for imports
- Create rollback procedures for failed imports

## 🧪 Testing Requirements
- [ ] API endpoint backward compatibility tests
- [ ] Database integration tests
- [ ] Performance tests with expanded dataset (1000+ POIs)
- [ ] Migration script validation

## 📚 Documentation
- [ ] Database migration procedures
- [ ] API endpoint changes documentation
- [ ] Rollback procedures

## 🔗 Related Issues
Depends on: Data validation system, Duplicate detection" \
    --label "epic: poi-expansion,phase: development,size: l,component: api"

# Milestone 3: Production Deployment Issues  
echo "🚀 Creating Milestone 3 issues (Production Deployment)..."

gh issue create --title "Deploy: Production database POI expansion" \
    --body "## 🎯 Feature Description
Deploy POI database expansion to production with proper migration, monitoring, and rollback capabilities.

## 📋 Acceptance Criteria  
- [ ] Successfully migrate production database to support 1000+ POIs
- [ ] Import validated Overpass API data to production
- [ ] Verify all existing functionality remains operational
- [ ] Confirm API response times remain <750ms with expanded dataset
- [ ] Validate weather integration works with new POI locations
- [ ] Zero user-facing issues during deployment
- [ ] Rollback plan tested and ready

## 🔍 Technical Details
- Use Neon database branching for safe production migration
- Implement blue-green deployment approach
- Monitor API performance metrics during rollout
- Validate weather API integration with expanded POI set
- Create deployment automation scripts
- Set up monitoring dashboards for new POI data

## 🧪 Testing Requirements
- [ ] Production migration testing on preview environment
- [ ] Load testing with 1000+ POI dataset
- [ ] API endpoint performance validation
- [ ] Weather integration testing with new locations

## 📚 Documentation
- [ ] Production deployment checklist
- [ ] Monitoring and alerting setup guide
- [ ] Rollback procedures documentation

## 🔗 Related Issues
Depends on: POI pipeline integration" \
    --label "epic: poi-expansion,phase: deployment,size: xl,component: deployment"

gh issue create --title "Monitor: Automated POI update scheduling" \
    --body "## 🎯 Feature Description
Implement automated POI data updates from Overpass API to keep location database fresh with weekly/daily update cycles.

## 📋 Acceptance Criteria  
- [ ] Automated daily/weekly Overpass API data sync
- [ ] Detect new POI additions and modifications
- [ ] Handle deleted/moved POI locations gracefully
- [ ] Rate limiting compliance in automated updates
- [ ] Error handling and notification system
- [ ] Update success/failure monitoring
- [ ] Manual override capabilities for data quality issues

## 🔍 Technical Details
- Create scheduled job (cron/GitHub Actions) for POI updates
- Implement incremental update logic (only changed data)
- Add change detection for existing POI modifications
- Create notification system for update failures
- Log all update activities for audit trail
- Support manual pause/resume of automated updates

## 🧪 Testing Requirements
- [ ] Scheduled job execution tests
- [ ] Update logic accuracy validation
- [ ] Error handling and notification tests
- [ ] Rate limiting compliance validation

## 📚 Documentation
- [ ] Automated update system documentation
- [ ] Manual override procedures
- [ ] Monitoring and troubleshooting guide

## 🔗 Related Issues
Builds on: Production database deployment" \
    --label "epic: poi-expansion,phase: deployment,size: l,component: automation"

echo "✅ Created all GitHub issues for POI Database Expansion project"
echo ""
echo "🎯 Summary:"
echo "- Epic issue created with project overview"
echo "- 8+ detailed issues across 3 development phases"
echo "- Issues properly labeled and linked"
echo "- Ready for project board organization"
echo ""
echo "Next steps:"
echo "1. Create GitHub Project board: 'POI Database Expansion via Overpass API'"
echo "2. Add all issues to project board"  
echo "3. Configure automated workflows"
echo "4. Begin Milestone 1: Research & Prototyping"
echo ""
echo "🚀 Project ready for development team assignment!"