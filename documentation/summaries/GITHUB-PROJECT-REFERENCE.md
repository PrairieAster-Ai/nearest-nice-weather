# GitHub Project Reference - NearestNiceWeather.com App Development

## 🎯 SINGLE SOURCE OF TRUTH FOR CURRENT WORK

**⚠️ AUTHORITATIVE SOURCE**: This GitHub Project is the **single source of truth** for all current and near-future work planning for NearestNiceWeather.com. All other documents, including local PRDs, session handoffs, and historical WBS documents, serve as supporting context only.

**Project Name:** NearestNiceWeather.com App Development
**Project URL:** https://github.com/orgs/PrairieAster-Ai/projects/2
**Repository:** PrairieAster-Ai/nearest-nice-weather
**Project Type:** GitHub Projects v2 (Beta)
**Workflow:** Sprint-based Agile Development

## 📋 WORK PLANNING HIERARCHY

**PRIMARY (Authoritative):**
- GitHub Project "NearestNiceWeather.com App Development" - **SINGLE SOURCE OF TRUTH**
- Contains current sprint planning, issue tracking, and work breakdown
- All active development items must be tracked here

**SECONDARY (Supporting Context):**
- Local PRD files (PRD-*.md) - Detailed specifications for specific features
- SESSION-HANDOFF.md - Current session context and immediate priorities
- Documentation files - Historical context and business background
- Architecture documentation - Technical implementation guidance

## 🔄 TRANSITION FROM MVP-WBS-STRUCTURED.md

**IMPORTANT**: As of July 29, 2025, the GitHub Project "NearestNiceWeather.com App Development" has replaced MVP-WBS-STRUCTURED.md as the authoritative source for work breakdown and sprint planning.

**What Changed:**
- **OLD**: MVP-WBS-STRUCTURED.md contained static work breakdown structure
- **NEW**: GitHub Project provides dynamic, real-time work tracking and sprint management
- **Benefits**: Live status updates, better collaboration, integrated issue tracking, automated progress monitoring

**Migration Status:**
- ✅ All MVP work items imported into GitHub Project with proper hierarchy
- ✅ Sprint structure maintained (Database + Weather API, Revenue + Launch)
- ✅ Story points and estimates preserved
- ✅ Capability → Epic → Story → Sub-issue hierarchy established
- ✅ Labels and workflow states configured for optimal project management

**For Development Teams:**
- Use GitHub Project for all sprint planning and issue creation
- Reference this document for project structure and workflow guidance
- Consult local documentation for detailed technical specifications only

---

## 📋 Project Structure

### **Project Fields Configuration**

| Field Name              | Type          | Purpose                 | Values                                        |
| ----------------------- | ------------- | ----------------------- | --------------------------------------------- |
| **Status**              | Single Select | Track work progress     | Backlog, Ready, In progress, In review, Done, In Production |
| **Size**                | Single Select | Story point estimation  | XS, S, M, L, XL                              |
| **Sprint**              | Iteration     | Sprint assignment       | Database + Weather API, Revenue + Launch      |
| **Assignees**           | People        | Work ownership          | Claude, Bob, Team Members                     |
| **Labels**              | Labels        | Work & type categorization | Type, technical, and status labels        |
| **Relationships**       | Issue         | Hierarchy relationships | Links to parent issues                        |
| **Sub-issues Progress** | Calculated    | Child completion        | Auto-calculated from children                 |
| **Estimate**            | Number        | Story point values      | Numeric story point estimation                |

### **Project Views**

#### **Main Board View** (Primary)

- **URL:** https://github.com/orgs/PrairieAster-Ai/projects/2/views/1
- **Layout:** Board layout with status columns
- **Columns:**
  - 📥 **Backlog** - Future work and next sprint items (Stories, Epics, Capabilities)
  - 🎯 **Ready** - Current sprint items ready to start (Stories, Epics, Capabilities)
  - 🔄 **In progress** - Active development work (Stories, Epics, Capabilities)
  - 👀 **In review** - Completed work in review (Stories, Epics, Capabilities)
  - ✅ **Done** - Completed items from any sprint (Stories, Epics, Capabilities)
  - 🚀 **In Production** - Live/deployed items (Stories, Epics, Capabilities)

**Note:** Sub-issues don't appear in board columns - they're managed within their parent Story and show progress automatically.

#### **Sprint Planning View** (Secondary)

- **Layout:** Table view with all fields visible
- **Filters:** Group by Iteration, then by Priority
- **Purpose:** Sprint planning and estimation

#### **Roadmap View** (Strategic)

- **Layout:** Roadmap view by Iteration
- **Purpose:** High-level sprint timeline visualization

---

## 🗓️ Iteration Configuration

### **Current Sprint Structure**

#### **Database + Weather API** 🔄 CURRENT

- **Start Date:** July 28, 2025
- **Duration:** 11 weeks (configured in GitHub)
- **Goal:** 50% → 75% MVP completion
- **Focus:** Database deployment + OpenWeather integration
- **Status:** Active/Current Iteration

#### **Revenue + Launch** 📅 NEXT

- **Start Date:** August 8, 2025
- **Duration:** 14 weeks (configured in GitHub)
- **Goal:** 75% → 100% MVP completion + Launch
- **Focus:** Google AdSense + user testing + launch validation
- **Status:** Next Iteration

#### **Post MVP 1** 📅 FUTURE

- **Start Date:** August 22, 2025
- **Duration:** 14 weeks (configured in GitHub)
- **Goal:** Post-MVP enhancements and expansion
- **Status:** Future Iteration

#### **Completed Sprints** (Historical Context)

- **Sprint 1:** Core Weather Intelligence ✅ (Nov 15 - Dec 5, 2024)
- **Sprint 2:** Basic POI Discovery ✅ (Dec 6 - Dec 26, 2024)

---

## 📊 Issue Hierarchy & Labels

### **Issue Types & Work Item Classification**

| Issue Type     | Type Label     | Purpose                              | Example                                         |
| -------------- | -------------- | ------------------------------------ | ----------------------------------------------- |
| **Epic**       | `type: epic`   | Major work container (20+ points)    | "Epic: Weather API Integration"                 |
| **Story**      | `type: story`  | User-focused work item (3-13 points) | "Story: OpenWeather API Connection"             |
| **Capability** | `type: capability` | Cross-sprint platform capability | "Capability: Real-Time Weather Intelligence"    |
| **Sub-issue**  | N/A            | Technical tasks within Stories       | "API Authentication Setup" (sub-issue of Story) |

**Note:** Type classification uses native GitHub labels for better integration and filtering.

### **Labels Strategy (Optimized)**

Labels serve as the primary categorization system using GitHub native functionality:

#### **Type Labels (Primary Classification):**
- **`type: capability`** - 🌟 Cross-sprint platform capabilities
- **`type: epic`** - 📦 Major work containers (20+ story points)
- **`type: story`** - 👤 User-focused work items (3-13 story points)

#### **Technical Labels (Work Classification):**
- **`database`** - 🗄️ Database schema, queries, migrations
- **`weather-api`** - 🌤️ Weather service integration
- **`frontend`** - 💻 UI/UX, React components, styling
- **`backend`** - ⚙️ Server-side logic, APIs, services
- **`mobile`** - 📱 Mobile optimization, responsive design
- **`analytics`** - 📊 Tracking, metrics, reporting
- **`revenue`** - 💰 Monetization, ads, payments

#### **Status Labels (Workflow Support):**
- **`blocked`** - 🚫 Waiting on external dependency
- **`urgent`** - 🔥 High priority, expedite work
- **`needs-review`** - 👀 Ready for validation/testing

**Advantage:** Native GitHub integration, better filtering, visual identification, API compatibility.

### **Sub-issue Benefits**

- **Cleaner Project Board:** Only Stories, Epics, and Capabilities appear in main views
- **Automatic Progress Tracking:** Parent Stories show completion percentage
- **Contextual Organization:** Technical tasks stay within their Story context
- **Native GitHub Features:** Built-in hierarchy and progress visualization

---

## 🔗 Issue Relationships

### **Parent-Child Hierarchy**

```
Capability: Real-Time Weather Intelligence (#1)
├── Epic: Database Infrastructure (#2)
│   └── Story: Minnesota POI Database (#3)
│       ├── Sub-issue: Database Schema Design
│       ├── Sub-issue: PostGIS Extension Setup
│       └── Sub-issue: Production Deployment
└── Epic: Weather API Integration (#5)
    ├── Story: OpenWeather Connection (#6)
    │   ├── Sub-issue: API Authentication Setup
    │   ├── Sub-issue: Rate Limiting Implementation
    │   └── Sub-issue: Error Handling
    └── Story: API Caching Implementation (#8)
        ├── Sub-issue: Redis Configuration
        ├── Sub-issue: Cache Key Strategy
        └── Sub-issue: Cache Invalidation Logic
```

### **Relationship Implementation**

- **Stories → Epics:** User Stories use Relationships field to link to their parent Epic
- **Epics → Capabilities:** Epics use Relationships field to link to their parent Capability
- **Sub-issues → Stories:** Sub-issues are created within Stories using GitHub's native sub-issue feature
- **Progress Tracking:** Parent Stories automatically show completion percentage based on sub-issue status
- **Dependencies:** Noted in issue descriptions when applicable

**Note:** Use the Relationships field (not Parent Issue) to establish work item hierarchy.

---

## 🎯 Workflow States

### **Status Field Values**

#### **Backlog** 📥

- **Purpose:** Future work not yet ready for development
- **Criteria:** Items planned but not yet prioritized for current sprint
- **Who Can Move:** Product Owner, Scrum Master

#### **Ready** 🎯

- **Purpose:** Work items ready for development
- **Criteria:** Requirements clear, dependencies met, assigned to current sprint
- **Who Can Move:** Product Owner, Scrum Master

#### **In progress** 🔄

- **Purpose:** Active development work
- **Criteria:** Developer assigned, work started
- **Who Can Move:** Assigned developer

#### **In review** 👀

- **Purpose:** Work completed, awaiting review/testing
- **Criteria:** Implementation complete, ready for validation
- **Who Can Move:** Assigned developer → reviewer

#### **Done** ✅

- **Purpose:** Work completed and accepted
- **Criteria:** Tested, validated, meets acceptance criteria
- **Who Can Move:** Reviewer, Product Owner

#### **In Production** 🚀

- **Purpose:** Work deployed to production environment
- **Criteria:** Deployed, live, and available to users
- **Who Can Move:** DevOps, Release Manager

---

## 📅 Sprint Workflow

### **Current Sprint Process**

1. **Sprint Planning:**

   - All current sprint issues assigned to "Database + Weather API" sprint field
   - Issues categorized using native GitHub labels (type:epic, type:story, type:capability)
   - Issues prioritized and estimated using Size field (XS, S, M, L, XL)
   - Sprint goal communicated: "Database + Weather API integration"

2. **Daily Development:**

   - Work items move: Backlog → Ready → In progress → In review → Done → In Production
   - Blockers marked with comments and labels
   - Progress tracked via sub-issue completion and Sub-issues Progress field

3. **Sprint Review:**

   - Demo completed work to stakeholders
   - Update sprint progress (target: 75% MVP completion)
   - Plan next sprint based on current sprint outcomes

### **Next Sprint Preparation**

- Issues remain in "Backlog" until current sprint completes
- Next sprint planning session before current sprint end
- Focus shift to revenue integration and launch validation

---

## 🔍 Filtering & Search

### **Common Filters**

#### **Current Sprint Work**

```
sprint:"Database + Weather API"
```

#### **Ready for Development**

```
status:"Ready" sprint:"Database + Weather API"
```

#### **Epic Work Items**

```
label:"type: epic" sprint:"Database + Weather API"
```

#### **User Stories in Progress**

```
label:"type: story" status:"In progress"
```

### **Search Shortcuts**

- **My Work:** `assignee:@me`
- **Blocked Items:** `label:"blocked"`
- **Database Work:** `label:"database"`
- **API Work:** `label:"weather-api"`

---

## 📝 Issue Templates & Standards

### **Issue Title Format**

- **Epic:** `Epic: [Work Area] [Status Emoji]`
- **Story:** `Story: [User Action Description]`
- **Sub-issue:** `[Technical Implementation Task]` (no prefix, appears as sub-issue of parent Story)

### **Issue Description Template**

```markdown
## Description
[Clear description of work to be done]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Requirements
[Technical implementation details]

## Definition of Done
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Code reviewed

## Parent Issue
**Parent Issue**: #[parent-number]
- **For Stories:** Link to parent Epic
- **For Epics:** Link to parent Capability
- **For Sub-issues:** Created within parent Story (no manual linking needed)

## File References
- `path/to/relevant/file.js`
- `path/to/other/file.ts`
```

---

## 🎯 Success Metrics

### **Current Sprint Success Criteria**

- [ ] Minnesota POI database deployed (100+ locations)
- [ ] OpenWeather API integrated with rate limiting
- [ ] Redis caching operational
- [ ] 75% MVP completion achieved
- [ ] Next sprint planning completed

### **Project Health Indicators**

- **Velocity:** Story points completed per sprint
- **Sprint Completion:** % of sprint backlog completed
- **Issue Resolution:** Time from Ready → Done
- **Blocker Resolution:** Time from blocked → unblocked

---

## 🔧 Claude Code Integration

### **How Claude Should Use This Project As Single Source of Truth**

**⚠️ CRITICAL**: Always check the GitHub Project FIRST before referencing any local documentation for current work. The GitHub Project is the authoritative source for:
- What work is currently planned and in progress
- Sprint assignments and priorities
- Issue status and progress tracking
- Story point estimates and capacity planning

1. **Issue Creation (PRIMARY WORKFLOW):**

   - **START HERE**: Check GitHub Project for existing work before creating new issues
   - Use proper hierarchy (Capability → Epic → Story → Sub-issues)
   - Apply correct labels and status to main issues (Capability, Epic, Story)
   - Assign Stories to appropriate sprint
   - Set parent-child relationships using Parent Issue field (Stories→Epics, Epics→Capabilities)
   - Create sub-issues within Stories for technical tasks

2. **Status Updates (REAL-TIME TRACKING):**

   - **UPDATE IMMEDIATELY**: Move issues through workflow states as work progresses
   - Update parent issues when children complete
   - Add comments for significant progress
   - GitHub Project reflects live status, not local documents

3. **Sprint Planning (AUTHORITATIVE SOURCE):**

   - **PRIMARY REFERENCE**: Use GitHub Project sprint assignments, not local files
   - Focus on current sprint assignments in GitHub Project
   - Keep next sprint items in backlog status
   - Respect story point estimates and capacity as defined in GitHub Project

4. **Project Queries (CURRENT STATE):**

   - **FIRST CHECK**: Query GitHub Project for current work state
   - Use GitHub Project filters to find relevant work
   - Check sprint progress via GitHub Project dashboard
   - Monitor blocked items through GitHub Project labels
   - Reference local PRDs only for detailed technical specifications

### **Common Claude Actions**

#### **Standard Project Management:**
```bash
# Create new story in Sprint 3
# - Set status: "Ready"
# - Set sprint: "Database + Weather API"
# - Add label: "type: story"
# - Add relevant technical labels (database, weather-api, etc.)
# - Set Relationships to link to parent Epic
# - Create sub-issues within the Story for technical tasks

# Create new epic under capability
# - Set status: "Ready"
# - Set sprint: "Database + Weather API"
# - Add label: "type: epic"
# - Add relevant technical labels
# - Set Relationships to link to parent Capability

# Update issue status
# - Move Stories/Epics from "Ready" to "In Progress" when starting
# - Mark sub-issues as complete within parent Story
# - Move parent from "In Progress" to "Review" when all sub-issues done
# - Move from "Review" to "Done" when validated
```

#### **Data-Driven Sprint Management:**
```bash
# Sprint Planning Workflow
node scripts/velocity-tracker.js calculate "Previous Sprint"
# → Review velocity and cycle time before planning new sprint
# → Use historical data to right-size scope

# Mid-Sprint Monitoring
node scripts/velocity-tracker.js calculate "Current Sprint"
# → Check if sprint scope adjustment needed
# → Identify if stories are too large (>7 day cycle time)

# Sprint Retrospective Analysis
node scripts/velocity-tracker.js calculate "Completed Sprint"
# → Generate data-driven retrospective insights
# → Identify process improvement opportunities

# Query current sprint work with velocity context
# - Filter by current sprint field + check velocity report recommendations
# - Prioritize work based on cycle time analysis
# - Focus on completing in-progress items before starting new (WIP limits)
```

#### **Automated Health Monitoring:**
```bash
# Check WIP Limits (via GitHub Actions)
# - Automated alerts when Ready(5), In Progress(3), In Review(4) limits exceeded
# - Use "Blocked Reason" dropdown in issue templates for impediment tracking

# Cycle Time Optimization
# - Stories >7 days cycle time flagged for breakdown
# - Epic completion tracked via sub-issue progress percentage
# - Historical trends available in velocity reports
```

---

## 📊 Project Dashboard & Velocity Analytics

### **Automated Sprint Analytics** 🚀

**Velocity Tracker Script**: [`scripts/velocity-tracker.js`](https://github.com/PrairieAster-Ai/nearest-nice-weather/blob/main/scripts/velocity-tracker.js)

Transform GitHub issues into actionable business intelligence for data-driven sprint management.

#### **When to Use Velocity Tracker:**

**🎯 Sprint Planning** (Start of sprint):
```bash
# Before planning new sprint - check team capacity
node scripts/velocity-tracker.js calculate "Database + Weather API"
# Output: Historical velocity to right-size next sprint scope
```

**📊 Mid-Sprint Health Check** (Week 1-2 of sprint):
```bash
# Monitor current sprint progress
node scripts/velocity-tracker.js calculate "Revenue + Launch"
# Output: Velocity % and recommendations for scope adjustment
```

**🔍 Sprint Retrospective** (End of sprint):
```bash
# Analyze completed sprint for lessons learned
node scripts/velocity-tracker.js calculate "Completed Sprint Name"
# Output: Cycle time analysis and process improvement recommendations
```

#### **Key Metrics Generated:**

- **Velocity %**: Completed vs planned story points (Target: >80%)
- **Cycle Time**: Average days from Ready→Done (Target: <7 days)
- **Issue Distribution**: Stories/Epics/Tasks breakdown
- **Health Indicators**: ✅/⚠️/❌ status with specific recommendations
- **Trend Analysis**: Historical velocity patterns for predictive planning

#### **Business Intelligence Output:**

**Automated Reports**: Generated in `documentation/reports/velocity-report-[sprint]-[date].md`
- Sprint health indicators with color-coded status
- Actionable recommendations for scope and flow optimization
- Cycle time breakdown identifying bottlenecks
- Data-driven insights for next sprint planning

### **Traditional Key Metrics** (Manual Tracking)

- **Current Sprint Progress:** X/Y issues completed
- **Story Points Burned:** X/Y points completed
- **Critical Path Items:** Database + Weather API status
- **Blocked Items:** Count and resolution time
- **Current Sprint Goal:** 75% MVP completion progress

### **Data-Driven Daily Standup Questions**

1. What did I complete yesterday? *(Check velocity tracker cycle time)*
2. What will I work on today? *(Prioritize based on sprint health indicators)*
3. What blockers do I have? *(Reference automated blocker detection)*
4. Is current sprint on track for completion goals? *(Review velocity % from latest report)*
5. **NEW**: Are we within WIP limits and optimal cycle time? *(Data-driven process check)*

---

## 🚀 Quick Reference Commands

### **For Claude Code:**

```markdown
# Current sprint focus
Database + Weather API (July 28 - Aug 18, 2025)

# Priority order
1. Database schema deployment
2. OpenWeather API integration
3. Redis caching implementation
4. Minnesota POI data loading

# Success criteria
75% MVP completion by August 18, 2025
```

### **Project URLs:**

- **Main Board:** https://github.com/orgs/PrairieAster-Ai/projects/2/views/1
- **Settings:** https://github.com/orgs/PrairieAster-Ai/projects/2/settings
- **Iterations:** https://github.com/orgs/PrairieAster-Ai/projects/2/settings/fields/210421993

---

This reference document provides Claude Code with complete context about your GitHub Project structure, workflow, and current sprint focus. Use this to ensure consistent project management and accurate issue creation that aligns with your established process.

---

## 🎯 **SYSTEM STATUS: PRODUCTION READY**

### **✅ Implementation Complete:**

#### **GitHub Labels System (27 Active Labels):**
- **Type Labels:** `type: capability`, `type: epic`, `type: story` - Primary classification
- **Technical Labels:** database, weather-api, frontend, backend, mobile, analytics, revenue
- **Workflow Labels:** blocked, urgent, needs-review - Status support
- **Size Labels:** `size: XS/S/M/L/XL` - Story point estimation
- **Priority Labels:** `priority: critical/high/medium/low` - Priority management
- **Issue Type Labels:** bug, enhancement, documentation, good first issue, help wanted
- **🧹 Cleanup:** 78 old/duplicate labels removed for clean organization

#### **GitHub Issue Templates (Professional Forms):**
- **Story Template:** 👤 User-focused work items (3-13 points) with structured forms
- **Epic Template:** 📦 Major work containers (20+ points) with child story planning
- **Capability Template:** 🌟 Cross-sprint platform capabilities with business metrics
- **Clean Interface:** Fixed priority dropdowns (Critical/High/Medium/Low)
- **Auto-labeling:** Automatic type label assignment on creation
- **Rich Forms:** Sprint assignment, size estimation, technical areas, relationships

#### **Project Workflow Integration:**
- **Status Flow:** Backlog → Ready → In progress → In review → Done → In Production
- **Sprint Management:** Database + Weather API (current), Revenue + Launch (next)
- **Hierarchy Support:** Capability → Epic → Story → Sub-issues with relationship tracking
- **Progress Tracking:** Automated sub-issue completion percentages
- **Filter Support:** Native GitHub search with `label:"type: epic"` syntax

### **🚀 Ready for MVP Import:**

The GitHub Project system is now fully configured and ready for importing MVP work items from `MVP-WBS-STRUCTURED.md`:

1. **Capabilities** (3): User Feedback Intelligence, Location-Based POI Discovery, Real-Time Weather Intelligence
2. **Epics** (6+): Production Database & POI Infrastructure, Weather API Integration, Revenue Integration, etc.
3. **Stories** (15+): Minnesota POI Database Deployment, OpenWeather API Connection, Google AdSense Integration, etc.

**Import Process:** Use organized issue templates with proper labels, relationships, and project field assignments to maintain hierarchical structure and sprint organization.
