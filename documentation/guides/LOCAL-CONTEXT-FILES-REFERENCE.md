# Local Context Files Reference

## 📋 **GitHub Project Integration Guide**

**Single Source of Truth**: [GitHub Project "NearestNiceWeather.com App Development"](https://github.com/orgs/PrairieAster-Ai/projects/2)

**Primary Workflow**: GitHub Project → Local Context Files → Implementation

---

## 🗂️ **Essential Local Context Files**

### **📊 Project Management & Planning**

#### **SESSION-HANDOFF.md**
- **Usage**: MANDATORY first read after any conversation interruption
- **Purpose**: Current session state, what's broken, what was tried, critical incident tracking
- **When to Use**: Beginning of every session, before making any changes
- **Authority**: Session-specific state and problem tracking

#### **PROJECT_CHARTER.md**
- **Usage**: Project philosophy and incremental development strategy
- **Purpose**: Development principles, sacred rules, foundation building approach
- **When to Use**: Before database/infrastructure changes, understanding project values
- **Authority**: Core development methodology and constraints

#### **GITHUB-PROJECT-REFERENCE.md**
- **Usage**: GitHub Project configuration and workflow procedures
- **Purpose**: Project fields, labels, issue templates, automation setup
- **When to Use**: Creating issues, managing project workflow, understanding project structure
- **Authority**: GitHub Project operational procedures

### **📋 Rolling PRD System**

#### **PRD-*.md Files** (Active PRDs in project root)
- **Usage**: Specific work item success criteria and scope boundaries
- **Purpose**: Detailed requirements, KPIs, scope definition for work >30 minutes
- **When to Use**: Before starting any substantial development work
- **Authority**: Work scope definition and success criteria

#### **KPI-DASHBOARD.md**
- **Usage**: Weekly progress tracking and metrics review
- **Purpose**: Real-time KPI tracking during active development work
- **When to Use**: During work execution and weekly progress reviews
- **Authority**: Performance measurement and progress tracking

### **🎯 Product Strategy & UX**

#### **MASS-MARKET-B2C-PERSONA-2025.md**
- **Usage**: Primary user persona and constraint-based needs analysis
- **Purpose**: "Jessica Chen - The Weekend Optimizer" target user understanding
- **When to Use**: Feature development, UX decisions, market validation
- **Authority**: Primary target user definition

#### **PURE-B2C-STRATEGY-2025.md**
- **Usage**: Consumer-only business model eliminating B2B distraction
- **Purpose**: B2C-first strategy until 10,000 daily users per user guidance
- **When to Use**: Strategic decisions, feature prioritization, business model questions
- **Authority**: Strategic direction and business model

#### **MOBILE-FIRST-MVP-UX-2025.md**
- **Usage**: Contextual mobile interface with travel time visualization
- **Purpose**: Mobile-optimized UX patterns and interaction design
- **When to Use**: Frontend development, UX implementation, responsive design
- **Authority**: UX patterns and mobile-first design principles

### **📊 Technical Specifications**

#### **POI-DATABASE-SPECIFICATION-2025.md**
- **Usage**: Complete database with cultural shopping POIs
- **Purpose**: Comprehensive POI data structure, categories, weather-activity matching
- **When to Use**: Database development, POI data integration, location features
- **Authority**: POI data structure and categorization

#### **AD-INTEGRATION-STRATEGY-2025.md**
- **Usage**: Contextual advertising in POI map marker popups
- **Purpose**: Ad placement strategy, UX optimization, revenue integration
- **When to Use**: Revenue features, ad integration, monetization development
- **Authority**: Advertising strategy and implementation approach

#### **documentation/technical/architecture-overview.md**
- **Usage**: Complete technical architecture specification
- **Purpose**: FastAPI + Directus + PostGIS stack, system architecture
- **When to Use**: Technical implementation, system design, integration decisions
- **Authority**: Technical architecture and system design

#### **documentation/technical/current-database-schema.md**
- **Usage**: Actual production database structure
- **Purpose**: Current database reality vs. documented architecture
- **When to Use**: Database work, schema validation, production deployment
- **Authority**: Production database state

### **💰 Business Context**

#### **documentation/appendices/financial-assumptions.md**
- **Usage**: Revenue model, user acquisition, financial targets
- **Purpose**: $36K annual target, B2C ad-supported model, market assumptions
- **When to Use**: Revenue features, business context, strategic decisions
- **Authority**: Financial model and business assumptions

#### **documentation/appendices/user-personas.md**
- **Usage**: Target user analysis and market research
- **Purpose**: Minnesota outdoor recreation enthusiasts, user needs analysis
- **When to Use**: Feature development, user research, market validation
- **Authority**: User research and persona definition

#### **documentation/business-plan/implementation-roadmap.md**
- **Usage**: Launch strategy and market entry approach
- **Purpose**: Business implementation timeline and market strategy
- **When to Use**: Launch planning, strategic milestones, business context
- **Authority**: Business strategy and implementation approach

### **⚙️ Development & Operations**

#### **CLAUDE.md**
- **Usage**: Development environment, deployment procedures, project memory
- **Purpose**: Technical setup, environment configuration, development workflow
- **When to Use**: Development setup, deployment, technical procedures
- **Authority**: Development environment and technical procedures

#### **documentation/runbooks/** (Directory)
- **Usage**: Operational procedures and troubleshooting guides
- **Purpose**: Emergency procedures, incident response, maintenance protocols
- **When to Use**: System issues, deployment problems, operational incidents
- **Authority**: Operational procedures and emergency response

#### **RAPID-DEVELOPMENT.md**
- **Usage**: High-speed experimentation workflow
- **Purpose**: Idea to production in 2-5 minutes with automated quality gates
- **When to Use**: Feature development, rapid prototyping, development workflow
- **Authority**: Development velocity and experimentation approach

---

## 🔄 **Workflow Integration**

### **Standard Development Workflow:**

1. **Check GitHub Project** - Current work items and sprint status
2. **Read SESSION-HANDOFF.md** - Current session state and critical issues
3. **Review Active PRDs** - Work item success criteria and scope
4. **Reference Technical Specs** - Architecture, database, UX specifications
5. **Check Business Context** - Strategy, personas, financial assumptions
6. **Follow Development Procedures** - CLAUDE.md and runbooks

### **Before Major Changes:**

1. **Read PROJECT_CHARTER.md** - Understand development principles
2. **Check Active PRDs** - Ensure work aligns with scope
3. **Review Technical Architecture** - Understand system constraints
4. **Validate Against Strategy** - Confirm business alignment

### **Session Continuity:**

1. **MANDATORY: Read SESSION-HANDOFF.md** completely
2. **Check Active PRDs** in project root (PRD-*.md files)
3. **Verify GitHub Project status** matches session handoff
4. **Ask user confirmation** before taking actions

---

## 📈 **Document Authority Hierarchy**

### **Level 1: Authoritative (Single Source of Truth)**
- **GitHub Project "NearestNiceWeather.com App Development"** - Current and near-future work

### **Level 2: Supporting Context (Reference & Guidance)**
- **Active PRDs** - Work item specifications
- **SESSION-HANDOFF.md** - Session state management
- **PROJECT_CHARTER.md** - Development methodology

### **Level 3: Detailed Specifications (Implementation Details)**
- **Technical specifications** (POI database, architecture, UX)
- **Business context** (strategy, personas, financial model)
- **Development procedures** (CLAUDE.md, runbooks)

### **Level 4: Historical Reference**
- **Completed analysis documents**
- **Previous session documentation**
- **Legacy planning documents**

---

## 🎯 **Key Usage Principles**

1. **GitHub Project First** - Always check current work status
2. **Local Context for Details** - Use supporting files for implementation guidance
3. **SESSION-HANDOFF Mandatory** - Always read after conversation compression
4. **PRDs for Scope** - Check active PRDs for work boundaries
5. **Strategy for Decisions** - Reference business strategy for feature choices
6. **Technical Specs for Implementation** - Use detailed specs for development work

This system ensures GitHub Project remains the single source of truth while leveraging comprehensive local context for successful implementation.
