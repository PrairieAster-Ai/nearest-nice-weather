# Business Rules Priority Matrix

## Purpose
Centralized business rule prioritization for automated testing, development decisions, and quality assurance.

## Priority Levels

### P0 - CRITICAL (System Failure)
**Definition**: Rules that, if broken, render the app unusable or violate core business model

1. **Location Fallback**: MUST provide fallback location (Minneapolis) for all users within 10 seconds
   - **Impact**: Without location, no POI recommendations possible
   - **Test**: Automated geolocation failure scenarios
   - **Component**: LocationManager.tsx

2. **Filter Responsiveness**: MUST show visual feedback <100ms after filter interaction
   - **Impact**: Poor responsiveness kills user engagement
   - **Test**: Performance monitoring on all filter clicks
   - **Component**: FabFilterSystem.tsx

3. **Page Load**: MUST be interactive within 3.5 seconds
   - **Impact**: Users abandon after 3 seconds
   - **Test**: Lighthouse/Core Web Vitals monitoring
   - **Component**: App.tsx

### P1 - HIGH (Feature Degradation)
**Definition**: Rules that, if broken, significantly impact user experience but don't break core functionality

4. **API Response Time**: MUST respond to POI requests within 1.5 seconds
   - **Impact**: Slow data loading frustrates users
   - **Test**: API endpoint monitoring
   - **Component**: usePOINavigation.ts

5. **Filter State Persistence**: MUST preserve user preferences across sessions
   - **Impact**: Users forced to reconfigure on each visit
   - **Test**: localStorage persistence tests
   - **Component**: FilterManager.tsx

6. **B2C Focus**: MUST prioritize consumer features over B2B/tourism operator features
   - **Impact**: Feature bloat distracts from core market
   - **Test**: Feature audit for consumer focus
   - **Component**: All user-facing components

### P2 - MEDIUM (Quality Enhancement)
**Definition**: Rules that improve experience but aren't critical to core functionality

7. **Animation Smoothness**: SHOULD complete all animations within 500ms
   - **Impact**: Sluggish animations feel unprofessional
   - **Test**: Animation duration monitoring
   - **Component**: FabFilterSystem.tsx

8. **Error Handling**: SHOULD provide user-friendly error messages within 1 second
   - **Impact**: Poor error UX reduces trust
   - **Test**: Error state scenarios
   - **Component**: All components with error states

9. **Cache Efficiency**: SHOULD prevent repeated API calls during same session
   - **Impact**: Unnecessary server load and slow responses
   - **Test**: Network call monitoring
   - **Component**: usePOINavigation.ts

### P3 - LOW (Nice to Have)
**Definition**: Rules that provide polish but aren't measurably impactful

10. **Consistent Branding**: SHOULD use purple aster iconography across POI markers
    - **Impact**: Brand recognition
    - **Test**: Visual consistency checks
    - **Component**: App.tsx (asterIcon)

## Testing Integration

### Automated Test Prioritization
- **P0 Rules**: Must be tested in CI/CD pipeline, block deployment if failing
- **P1 Rules**: Should be tested regularly, alert on degradation  
- **P2 Rules**: Can be tested in nightly builds or weekly QA
- **P3 Rules**: Manual testing or low-frequency automation

### PlaywrightMCP Integration
```javascript
// Example: P0 rule testing
const P0_LOCATION_TIMEOUT = 10000; // From PERFORMANCE-REQUIREMENTS.json
await expect(page.locator('[data-testid="user-location"]')).toBeVisible({
  timeout: P0_LOCATION_TIMEOUT
});
```

### Performance Monitoring
- **P0/P1 Rules**: Real-time alerts if thresholds exceeded
- **P2/P3 Rules**: Weekly performance reports
- **Degradation Detection**: 20% slower than target = warning, exceeds max = alert

## Rule Modification Process

### When to Update Rules
- User research indicates priority changes
- Performance data shows threshold adjustments needed
- Business model shifts (B2C → B2B, etc.)
- Technical constraints require threshold adjustments

### Update Protocol
1. Update this document with rationale
2. Update `/src/config/PERFORMANCE-REQUIREMENTS.json` with new thresholds
3. Update component documentation tags
4. Update automated test assertions
5. Notify team of priority changes

## Business Context Links
- **Master Plan**: `/documentation/business-plan/master-plan.md`
- **User Personas**: `/documentation/user-personas/casual-outdoor-enthusiast.md`
- **Performance Config**: `/src/config/PERFORMANCE-REQUIREMENTS.json`
- **Architecture**: `/documentation/architecture-overview.md`

Last Updated: 2025-08-08