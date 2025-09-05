# Claude Documentation Standards

## Purpose
Optimize frontend code documentation for Claude's conversation compression limitations and rapid information intake advantages.

## Documentation Template

```typescript
/**
 * ========================================================================
 * [COMPONENT NAME] - [PRIMARY BUSINESS PURPOSE]
 * ========================================================================
 *
 * 📋 PURPOSE: [One-line business purpose]
 * 🔗 CONNECTS TO: [Parent components, hooks, services]
 * 📊 DATA FLOW: [Input → Processing → Output]
 * ⚙️ STATE: [Key state variables and their purpose]
 * 🎯 USER IMPACT: [Direct user experience effects]
 *
 * BUSINESS CONTEXT: [Business value and user impact]
 * - [Key business benefit 1]
 * - [Key business benefit 2]
 * - [Key business benefit 3]
 *
 * TECHNICAL IMPLEMENTATION: [Implementation approach and patterns]
 * - [Key technical decision 1]
 * - [Key technical decision 2]
 * - [Key technical decision 3]
 *
 * 🏗️ ARCHITECTURAL DECISIONS:
 * - [Why this approach was chosen over alternatives]
 * - [Performance or UX considerations]
 * - [Integration or maintainability factors]
 *
 * @CLAUDE_CONTEXT: [Context for Claude compression optimization]
 * @BUSINESS_RULE: [Critical business logic constraints]
 * @INTEGRATION_POINT: [External system connections]
 * @PERFORMANCE_CRITICAL: [Performance-sensitive areas]
 * @UX_CRITICAL: [User experience critical factors]
 *
 * LAST UPDATED: [YYYY-MM-DD]
 */
```

## Claude Context Tags

### @CLAUDE_CONTEXT
- **Purpose**: Preserve critical business/technical context across conversation compressions
- **Usage**: High-level purpose and integration role
- **Example**: `@CLAUDE_CONTEXT: Primary filter interface for weather-based POI discovery`

### @BUSINESS_RULE
- **Purpose**: Mark immutable business logic that must be preserved with priority level
- **Usage**: Critical constraints that affect user experience (P0=Critical, P1=High, P2=Medium, P3=Low)
- **Format**: `@BUSINESS_RULE: [P0-P3] MUST/SHOULD/MAY [specific requirement]`
- **Example**: `@BUSINESS_RULE: P0 MUST provide fallback location within 10 seconds`
- **Reference**: See `/src/config/BUSINESS-RULES.md` for complete priority matrix

### @INTEGRATION_POINT
- **Purpose**: Document connections to other systems/components
- **Usage**: API integrations, component dependencies, data sources
- **Example**: `@INTEGRATION_POINT: FilterManager hook for debounced state management`

### @PERFORMANCE_CRITICAL
- **Purpose**: Mark performance-sensitive code sections
- **Usage**: Database queries, API calls, heavy computations
- **Example**: `@PERFORMANCE_CRITICAL: Debounced filtering prevents API thrashing`

### @UX_CRITICAL
- **Purpose**: Mark user experience critical factors
- **Usage**: Response times, visual feedback, accessibility
- **Example**: `@UX_CRITICAL: <100ms response time for biological dopamine optimization`

### @ARCHITECTURE_NOTE
- **Purpose**: Document architectural decisions and trade-offs
- **Usage**: Design patterns, technology choices, structural decisions
- **Example**: `@ARCHITECTURE_NOTE: FAB pattern chosen for mobile-first outdoor use`

### @DATA_DEPENDENCY
- **Purpose**: Document data flow and dependencies
- **Usage**: State management, API dependencies, data transformations
- **Example**: `@DATA_DEPENDENCY: Requires userLocation for distance calculations`

## Rapid Information Intake Patterns

### 🔍 Quick Reference Sections
Use emoji-prefixed sections for rapid scanning:
- 📋 PURPOSE: Core business function
- 🔗 CONNECTS TO: System integrations
- 📊 DATA FLOW: Information movement
- ⚙️ STATE: Key variables
- 🎯 USER IMPACT: Experience effects

### Cross-Reference Links
```typescript
// 🔗 INTEGRATION: Works with FilterManager.tsx for weather preferences
// 🔗 INTEGRATION: Connects to LocationManager.tsx for user positioning
// 🔗 SEE ALSO: usePOINavigation.ts for distance-based discovery
```

### Business Context Breadcrumbs
```typescript
/**
 * BUSINESS CONTEXT: Minnesota outdoor recreation → weather optimization → POI discovery
 * USER JOURNEY: Location detection → weather preferences → filtered results → POI selection
 * VALUE PROPOSITION: Find outdoor activities matching current weather comfort preferences
 */
```

## Compression-Resistant Patterns

### Single Source of Truth References
```typescript
/**
 * 📚 DOCUMENTATION LINKS:
 * - Business Plan: /documentation/business-plan/master-plan.md
 * - Architecture: /documentation/architecture-overview.md
 * - API Reference: /documentation/api-endpoints.md
 * - User Stories: /documentation/user-personas/casual-outdoor-enthusiast.md
 */
```

### State Management Documentation
```typescript
/**
 * 🔄 STATE SYNCHRONIZATION PATTERN:
 * localStorage ↔ React state ↔ UI components ↔ user interactions
 *
 * PERSISTENCE STRATEGY:
 * - User preferences saved to localStorage for session continuity
 * - React state provides reactive UI updates
 * - Debounced API calls prevent performance issues
 */
```

### Error Handling Documentation
```typescript
/**
 * 🚨 ERROR HANDLING STRATEGY:
 * - Graceful degradation for location detection failures
 * - Fallback to Minneapolis coordinates for universal functionality
 * - User-friendly error messages with actionable guidance
 */
```

## Implementation Checklist

### For Each Component
- [ ] Add comprehensive header documentation
- [ ] Include @CLAUDE_CONTEXT tags for compression optimization
- [ ] Document integration points and data flow
- [ ] Add cross-references to related components
- [ ] Include business context and user impact
- [ ] Mark performance and UX critical sections

### For Each Hook
- [ ] Document purpose and business value
- [ ] Explain state management patterns
- [ ] Document dependencies and side effects
- [ ] Include usage examples and integration points
- [ ] Mark any performance considerations

### For Each Service
- [ ] Document API integrations and data sources
- [ ] Explain error handling and fallback strategies
- [ ] Include rate limiting and caching strategies
- [ ] Document data transformation patterns
- [ ] Add monitoring and debugging information

## Benefits for Claude

1. **Conversation Compression**: Critical context preserved through structured tags
2. **Rapid Intake**: Emoji-prefixed sections enable quick scanning
3. **Context Preservation**: Business rules and integration points clearly marked
4. **Architecture Understanding**: Design decisions explicitly documented
5. **Error Recovery**: Clear patterns for debugging and troubleshooting
