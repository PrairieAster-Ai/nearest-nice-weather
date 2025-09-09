# GitHub Project Manager MCP Usage Guide
## **CORRECT METHOD FOR CREATING GITHUB ISSUES**

**Last Updated**: 2025-09-09

## 🚨 CRITICAL LEARNING
**DO NOT** use GitHub CLI (`gh`) for creating issues - it has limited permissions and cannot properly integrate with GitHub Projects.

**DO** use GitHub Project Manager MCP through natural language commands in Claude conversations.

## ✅ CORRECT USAGE PATTERN

### **Creating Issues via GitHub Project Manager MCP**

The GitHub Project Manager MCP is configured in `.mcp/claude-desktop-config.json` and provides enhanced permissions for:
- Creating issues with full project integration
- Managing security alerts and vulnerabilities
- Sprint planning and issue prioritization
- Automated project field management

### **How to Create Issues**

Use natural language commands in Claude conversations:

```
Example Commands:
- "Create a new epic for Memory Bank MCP enhancements"
- "Create user stories for Phase 1 decision logging"
- "Add a capability issue for Memory Bank advanced utilization"
- "Create security issues for the critical npm vulnerabilities"
```

### **Issue Hierarchy Structure**

```
Capability (40+ points)
├── Epic (20+ points)
│   ├── Story (3-13 points)
│   │   ├── Sub-task
│   │   └── Sub-task
│   └── Story
└── Epic
```

## 📋 MEMORY BANK MCP PROJECT STRUCTURE

### **Capability: Memory Bank MCP Advanced Utilization**
- Total Points: 40
- Business Value: $12K-15K annual productivity gains
- Timeline: 4 phases over 4 weeks

### **Phase 1: Decision Logging (Current Sprint - 10 points)**
1. Create Decision Logging Templates (3 points)
2. Document Recent Architectural Decisions (3 points)
3. Implement Security Decision Tracking (2 points)
4. Create Decision Search Interface (2 points)

### **Phase 2: Active Context Automation (Next Sprint - 10 points)**
- Progress tracking integration
- Health check automation
- Sprint progress synchronization
- Session handoff automation
- Performance trend tracking

### **Phase 3: Mode-Specific Operations (Next Sprint - 10 points)**
- Security mode configuration
- Debug mode context
- Architect mode templates
- Sprint planning mode
- Auto-detection logic

### **Phase 4: Advanced Integrations (Next Sprint - 10 points)**
- GitHub Project integration
- Performance intelligence
- Business rule automation
- Security alert integration
- Team knowledge sharing

## 🔧 IMPLEMENTATION STEPS

### **1. Use GitHub Project Manager MCP Commands**

Instead of shell scripts, use natural language:
- "Create the Memory Bank MCP capability issue with 40 story points"
- "Create the Phase 1 epic for decision logging with 4 user stories"
- "Assign Phase 1 stories to the current sprint"
- "Add Phase 2-4 epics to the next sprint"

### **2. Project Configuration**

The GitHub Project Manager MCP will automatically:
- Set proper labels (type: capability, type: epic, type: story)
- Assign to correct sprints
- Link parent-child relationships
- Set story points
- Add to project board

### **3. Sprint Assignments**

**Current Sprint (Database + Weather API)**:
- Phase 1: Decision Logging Implementation (10 points)

**Next Sprint (Revenue + Launch)**:
- Phase 2: Active Context Automation (10 points)
- Phase 3: Mode-Specific Operations (10 points)
- Phase 4: Advanced Integrations (10 points)

## 🎯 KEY DECISIONS TO DOCUMENT

### **Architectural Decisions**
1. Dual API Architecture (Express.js dev + Vercel prod)
2. Neon PostgreSQL over local Docker
3. React + Vite over Next.js
4. Material-UI component library
5. Vercel deployment platform

### **Security Decisions**
1. GitHub Project Manager MCP over CLI for security alerts
2. npm audit selective patching strategy
3. Development-only vulnerability acceptance
4. Dependabot batching configuration
5. Environment variable security approach

### **Development Decisions**
1. Playwright MCP testing integration
2. Memory Bank MCP implementation
3. POI-centric data model
4. Auto-expanding search radius
5. Performance target thresholds

## 📊 SUCCESS METRICS

- 50% reduction in context switching
- 75% improvement in session continuity
- 90% reduction in repeated problem-solving
- 40% faster task completion through modes
- $12,000-15,000 annual productivity value

## ⚠️ LESSONS LEARNED

1. **GitHub CLI Limitations**: Personal access tokens have insufficient permissions for security alerts and project management
2. **MCP Advantages**: Enhanced permissions, natural language interface, automated project integration
3. **Shell Scripts Don't Work**: Creating issues via shell scripts bypasses project integration
4. **Use Conversation Commands**: Natural language commands through GitHub Project Manager MCP are the correct approach

## 📚 REFERENCES

- [GITHUB-TOOLS-CONTEXT.md](../GITHUB-TOOLS-CONTEXT.md) - Complete decision tree for tool selection
- [MEMORY-BANK-MCP-PROJECT.md](../MEMORY-BANK-MCP-PROJECT.md) - Full project structure
- [MCP Configuration](.mcp/claude-desktop-config.json) - GitHub Project Manager MCP setup

---

**Remember**: Always use GitHub Project Manager MCP through natural language commands in Claude conversations for creating and managing GitHub issues. Do not use shell scripts or GitHub CLI for issue creation.
