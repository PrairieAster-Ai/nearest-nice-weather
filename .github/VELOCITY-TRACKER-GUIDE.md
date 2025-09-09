# 📊 Velocity Tracker User Guide

**Script Location**: [`scripts/velocity-tracker.js`](https://github.com/PrairieAster-Ai/nearest-nice-weather/blob/main/scripts/velocity-tracker.js)

## 🎯 Overview

Transform GitHub issues into actionable business intelligence for data-driven sprint management. This tool eliminates guesswork in sprint planning by providing objective metrics on team velocity, cycle times, and process efficiency.

## 🚀 Quick Start

### Prerequisites
- Node.js environment
- GitHub token with repository access
- Issues properly labeled with sprint names

### Basic Usage
```bash
# Calculate current sprint metrics
node scripts/velocity-tracker.js calculate "Revenue + Launch"

# Historical sprint analysis
node scripts/velocity-tracker.js calculate "Database + Weather API"

# Help and options
node scripts/velocity-tracker.js
```

## 📅 **When to Use - Sprint Lifecycle Integration**

### **🎯 Pre-Sprint Planning** (1-2 days before new sprint)

**Command:**
```bash
node scripts/velocity-tracker.js calculate "Previous Sprint Name"
```

**Purpose**: Establish baseline capacity for new sprint planning

**Key Questions Answered:**
- What's our team's historical velocity?
- What story point capacity should we plan for?
- Are our stories appropriately sized?

**Action Items:**
- Use completed story points as capacity guide
- If average cycle time >7 days → plan smaller stories
- If velocity <60% → reduce next sprint scope by 20-30%

### **📊 Mid-Sprint Health Check** (Week 1 of sprint)

**Command:**
```bash
node scripts/velocity-tracker.js calculate "Current Sprint Name"
```

**Purpose**: Early warning system for sprint scope adjustment

**Key Questions Answered:**
- Are we on track to meet sprint goals?
- Should we descope work to ensure completion?
- Are blockers impacting our flow?

**Action Items:**
- Velocity <50% at midpoint → immediately descope 2-3 lowest priority items
- Cycle time trending >10 days → break down large stories
- Blocked issues >2 → hold daily blocker resolution meetings

### **🔍 Sprint Retrospective** (End of sprint)

**Command:**
```bash
node scripts/velocity-tracker.js calculate "Completed Sprint Name"
```

**Purpose**: Data-driven retrospective insights and process improvement

**Key Questions Answered:**
- What was our actual velocity vs planned?
- Where are our process bottlenecks?
- How can we improve flow for next sprint?

**Action Items:**
- Document lessons learned from velocity and cycle time patterns
- Adjust WIP limits based on actual throughput data
- Plan process improvements for next sprint

## 📊 **Understanding the Metrics**

### **Velocity Percentage**
```
Formula: (Completed Story Points / Planned Story Points) × 100
```

**Health Indicators:**
- **✅ 80%+**: Excellent sprint execution - maintain current practices
- **⚠️ 60-79%**: Good performance - minor scope adjustments recommended
- **❌ <60%**: Critical - major scope reduction or process changes needed

**Common Causes of Low Velocity:**
- Stories too large/complex
- Unexpected technical challenges
- External dependencies/blockers
- Team capacity overestimated

### **Cycle Time Analysis**
```
Formula: (Issue Closed Date - Issue Created Date) in days
```

**Health Indicators:**
- **✅ <3 days**: Excellent flow - stories well-sized and focused
- **⚠️ 3-7 days**: Good range - acceptable for most story complexity
- **❌ >7 days**: Attention needed - stories too large or process bottlenecks

**Optimization Strategies:**
- Break stories >7 days into smaller sub-tasks
- Identify recurring bottlenecks in development workflow
- Implement WIP limits to improve focus

### **Issue Type Distribution**
Tracks balance of work across:
- **Stories**: User-facing feature work (target 60-70%)
- **Epics**: Large work containers (should be <20%)
- **Tasks**: Technical implementation (target 20-30%)
- **Bugs**: Defect resolution (target <10%)

## 📈 **Interpreting Recommendations**

### **Scope Management Recommendations**

**"Reduce Sprint Scope"** appears when:
- Velocity <60%
- Large number of incomplete items
- Cycle times trending upward

**Action**: Move 20-30% of lowest priority items to next sprint

**"Focus on Completion"** appears when:
- Many in-progress items vs completed
- WIP limits being exceeded
- Stories stalling in development

**Action**: Complete current work before starting new items

### **Flow Optimization Recommendations**

**"Break Down Large Stories"** appears when:
- Average cycle time >7 days
- Stories consistently taking longer than planned
- Epics showing up as individual work items

**Action**: Split stories into 1-3 day tasks with clear acceptance criteria

**"Review WIP Limits"** appears when:
- Too many concurrent items in progress
- Context switching impacting completion
- Cycle times increasing due to multitasking

**Action**: Implement stricter WIP limits (Ready:5, Progress:3, Review:4)

## 🔧 **Advanced Usage**

### **Custom Sprint Analysis**
```bash
# Analyze specific time periods
node scripts/velocity-tracker.js calculate "MVP Development Phase"

# Compare multiple sprint patterns
node scripts/velocity-tracker.js calculate "Technical Debt Sprint"
```

### **Report Integration**
```bash
# Generated reports location
ls documentation/reports/velocity-report-*.md

# View latest sprint report
cat documentation/reports/velocity-report-$(ls -t documentation/reports/velocity-report-*.md | head -1)
```

### **Automation Integration**
The script integrates with GitHub Actions for automated sprint monitoring:
- Triggered on issue closure
- Updates sprint velocity in real-time
- Generates alerts for velocity drops

## 📋 **Best Practices**

### **Data Quality Requirements**
1. **Consistent Sprint Naming**: Use exact sprint names in issue descriptions
2. **Story Point Labels**: Apply `size:XS/S/M/L/XL` labels for accurate velocity calculation
3. **Issue Type Labels**: Use `type:story/epic/task` for proper categorization
4. **Status Tracking**: Keep issue status updated for accurate cycle time measurement

### **Sprint Planning Integration**
1. **Always run velocity analysis before planning new sprints**
2. **Use historical velocity as capacity constraint, not target**
3. **Plan 10-20% buffer for unexpected work**
4. **Review cycle time trends to right-size stories**

### **Team Adoption Strategy**
1. **Start with retrospectives** - use data to validate team observations
2. **Gradually integrate into planning** - don't change everything at once
3. **Focus on trends over absolute numbers** - velocity varies naturally
4. **Use data to drive conversations** - not replace team judgment

## 🎯 **Business Value Realization**

### **Expected Improvements**
- **Sprint Predictability**: 85%+ completion rate vs 60-70% baseline
- **Planning Efficiency**: 30 minutes vs 60+ minutes for sprint planning
- **Quality**: Data-driven decisions vs gut-feeling adjustments
- **Retrospective Value**: Objective insights vs subjective discussions

### **ROI Metrics**
- **Time Savings**: 15-20% reduction in planning overhead
- **Delivery Predictability**: Stakeholder confidence in release dates
- **Process Optimization**: Systematic identification of bottlenecks
- **Team Satisfaction**: Clear performance visibility and improvement opportunities

## 🔗 **Related Documentation**

- **GitHub Project Reference**: [Complete project workflow documentation](https://github.com/PrairieAster-Ai/nearest-nice-weather/blob/main/documentation/summaries/GITHUB-PROJECT-REFERENCE.md)
- **WIP Limits Configuration**: [Work-in-progress optimization guide](https://github.com/PrairieAster-Ai/nearest-nice-weather/blob/main/.github/WIP-LIMITS-CONFIGURATION.md)
- **Project Automation**: [GitHub Actions for automated project management](https://github.com/PrairieAster-Ai/nearest-nice-weather/blob/main/.github/workflows/project-automation.yml)

---

**Innovation Infrastructure Advantage**: This tool directly supports 2-5 minute idea-to-production cycles by eliminating planning overhead and providing objective capacity management that enables rapid, predictable experimentation and delivery.
