# Code Commenting Standards

## Purpose
Provide comprehensive contextual comments to help Claude Code understand system architecture, business logic, and implementation patterns without requiring external context.

## Comment Types

### 1. File Header Comments
```javascript
/**
 * BUSINESS CONTEXT: [What business problem this solves]
 * TECHNICAL PURPOSE: [What this file does technically]
 * DEPENDENCIES: [Key dependencies and integrations]
 * DATA FLOW: [How data flows through this component]
 * USAGE PATTERNS: [Common usage scenarios]
 * LAST UPDATED: [Date]
 */
```

### 2. Function/Method Comments
```javascript
/**
 * BUSINESS LOGIC: [Why this function exists from business perspective]
 * TECHNICAL IMPLEMENTATION: [How it works technically]
 * INPUT/OUTPUT: [Expected inputs and outputs]
 * ERROR HANDLING: [How errors are managed]
 * PERFORMANCE NOTES: [Any performance considerations]
 */
```

### 3. Configuration Comments
```javascript
// ENVIRONMENT CONFIG: [Purpose of this configuration]
// BUSINESS IMPACT: [How this affects user experience or business logic]
// SECURITY NOTES: [Any security implications]
// DEPLOYMENT CONTEXT: [Different values across environments]
```

### 4. Database Comments
```sql
-- BUSINESS PURPOSE: [Why this table/field exists]
-- DATA RELATIONSHIPS: [How this relates to other data]
-- QUERY PATTERNS: [Common ways this data is accessed]
-- PERFORMANCE NOTES: [Indexing and optimization details]
```

### 5. Component Architecture Comments
```javascript
// COMPONENT HIERARCHY: [Where this fits in the UI structure]
// STATE MANAGEMENT: [How state flows through this component]
// USER INTERACTION: [What user actions this handles]
// BUSINESS RULES: [Any business logic embedded in UI]
```

## Claude Code Context Tags
Use these special tags to help Claude Code understand context:

- `@CLAUDE_CONTEXT: [Key insight for AI understanding]`
- `@BUSINESS_RULE: [Critical business logic]`
- `@ARCHITECTURE_NOTE: [System design decision]`
- `@INTEGRATION_POINT: [External system connection]`
- `@PERFORMANCE_CRITICAL: [Performance-sensitive code]`
- `@SECURITY_SENSITIVE: [Security-related code]`
- `@ERROR_BOUNDARY: [Error handling strategy]`
- `@DATA_TRANSFORMATION: [Data format changes]`
