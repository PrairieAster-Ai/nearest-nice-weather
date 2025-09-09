# GitHub Tools Context Guide
## **COMPLETE GITHUB TOOLS REFERENCE FOR CLAUDE CODE**

**📚 MUST READ**: Decision trees, authentication setup, and quick reference for choosing the right GitHub tool (CLI vs MCP servers vs Web Interface).

---

## **🎯 TOOL SELECTION DECISION TREE**

### **When to Use GitHub CLI (`gh`)**
✅ **RECOMMENDED FOR:**
- **Wiki management** - Full CRUD operations on repository wikis
- **Release management** - Creating releases, tags, changelog generation
- **CI/CD operations** - Workflow management, action status checks
- **Emergency fixes** - Quick hotfixes, security patches, critical updates
- **Bulk operations** - Mass issue updates, label management, automation
- **Repository administration** - Settings, collaborators, branch protection

✅ **STRENGTHS:**
- Direct command-line efficiency for power users
- Complete GitHub API coverage
- Scriptable and automatable
- Works offline after initial authentication
- Perfect for CI/CD pipelines

⚠️ **LIMITATIONS:**
- **Security alerts access restricted** - Personal access tokens have limited permissions
- Requires terminal/command-line comfort
- Less intuitive for non-technical stakeholders

### **When to Use GitHub Project Manager MCP**
✅ **RECOMMENDED FOR:**
- **Sprint planning** - Epic, story, and task creation with proper hierarchy
- **Issue management** - Creating, updating, and tracking development work
- **Project coordination** - Roadmap planning, velocity tracking, backlog management
- **PRD generation** - Product requirement document creation and management
- **Security alert management** - Enhanced permissions for vulnerability tracking
- **Cross-functional collaboration** - Stakeholder communication and alignment

✅ **STRENGTHS:**
- **Enhanced security permissions** - Access to vulnerability alerts and Dependabot data
- Natural language interface for non-technical users
- Integrated project management workflows
- Real-time collaboration capabilities
- Automated project field management

⚠️ **LIMITATIONS:**
- Requires MCP server configuration
- Learning curve for advanced features
- May have rate limiting for high-volume operations

### **When to Use Official GitHub MCP**
✅ **RECOMMENDED FOR:**
- **Backup operations** - When Project Manager MCP is unavailable
- **Basic repository tasks** - File operations, commit history, branch management
- **Simple issue operations** - Basic CRUD operations without project integration
- **Repository exploration** - Code search, file browsing, history review

✅ **STRENGTHS:**
- Stable and reliable
- Lower resource requirements
- Simple operations interface

⚠️ **LIMITATIONS:**
- **Limited security features** - Same token restrictions as GitHub CLI
- Basic functionality compared to specialized MCPs
- No advanced project management features

### **When to Use Web Interface**
✅ **RECOMMENDED FOR:**
- **Visual project management** - Project boards, roadmaps, complex views
- **Security settings** - Repository security configuration, access control
- **Complex form operations** - Issue templates, pull request reviews
- **Administrative tasks** - Organization settings, team management
- **Visual diff review** - Code review, merge conflict resolution

---

## **🔐 SECURITY ALERTS ACCESS ANALYSIS**

### **GitHub CLI Limitations (Current Experience)**
**DISCOVERED ISSUE**: Personal access tokens provide insufficient permissions for security operations:

```bash
# These commands return HTTP 403 errors:
gh api repos/PrairieAster-Ai/nearest-nice-weather/vulnerability-alerts
gh api repos/PrairieAster-Ai/nearest-nice-weather/dependabot/alerts
```

**Root Cause**: Repository security alerts require enhanced permissions not available to personal access tokens.

### **GitHub Project Manager MCP Advantages**
**SOLUTION**: Enhanced security alert management through MCP integration:

✅ **Enhanced Permissions**: Access to vulnerability scanning data
✅ **Structured Triage**: Automated prioritization and classification
✅ **Workflow Integration**: Security alerts integrated with development planning
✅ **Automated Reporting**: Security status dashboards and progress tracking
✅ **Alert Lifecycle Management**: From detection to resolution tracking

### **Security Alert Management Workflow**
**RECOMMENDED APPROACH**: Use GitHub Project Manager MCP for comprehensive security management:

1. **Detection & Triage**
   - Automated vulnerability scanning integration
   - Priority classification (Critical/High/Medium/Low)
   - Impact assessment (Production/Development/Testing)
   - False positive identification and dismissal

2. **Resolution Planning**
   - Create GitHub issues for actionable vulnerabilities
   - Assign to appropriate sprints based on severity
   - Track remediation progress through project boards
   - Coordinate with dependency update schedules

3. **Verification & Monitoring**
   - Post-fix validation procedures
   - Continuous monitoring for new vulnerabilities
   - Trend analysis and prevention strategies
   - Team knowledge sharing and documentation

---

## **🚀 AUTHENTICATION & SETUP GUIDE**

### **GitHub CLI Setup**
```bash
# Install GitHub CLI
brew install gh  # macOS
sudo apt install gh  # Ubuntu/Debian
winget install GitHub.cli  # Windows

# Authenticate with enhanced permissions
gh auth login --scopes "repo,workflow,write:org,read:user,read:project"

# Verify authentication
gh auth status

# Set default repository
gh repo set-default PrairieAster-Ai/nearest-nice-weather
```

### **GitHub Project Manager MCP Configuration**
**Location**: `.mcp/claude-desktop-config.json`

**Required Configuration**:
```json
{
  "mcpServers": {
    "github-project-manager": {
      "command": "github-project-manager-mcp",
      "args": ["--project-org", "PrairieAster-Ai", "--project-name", "NearestNiceWeather App Development"],
      "env": {
        "GITHUB_TOKEN": "your_token_with_enhanced_permissions"
      }
    }
  }
}
```

**Enhanced Token Permissions Required**:
- Repository: Full control
- Security: Read access to vulnerability alerts
- Projects: Read/write access
- Organization: Read access for team management

### **Official GitHub MCP Setup**
**Fallback Configuration**:
```json
{
  "mcpServers": {
    "github-official": {
      "command": "github-official-mcp",
      "env": {
        "GITHUB_TOKEN": "standard_personal_access_token"
      }
    }
  }
}
```

---

## **📋 COMMON TASK QUICK REFERENCE**

### **Security Management**
| Task | Recommended Tool | Command/Action |
|------|------------------|----------------|
| **View vulnerability alerts** | GitHub Project Manager MCP | "Show security alerts for this repository" |
| **Triage security issues** | GitHub Project Manager MCP | "Create issues for critical vulnerabilities" |
| **Update dependencies** | GitHub CLI + npm audit | `npm audit fix` → `gh pr create` |
| **Monitor Dependabot** | GitHub Project Manager MCP | "Check Dependabot status and configure batching" |
| **Security policy setup** | Web Interface | GitHub → Settings → Security & analysis |

### **Issue Management**
| Task | Recommended Tool | Command/Action |
|------|------------------|----------------|
| **Create epic/story** | GitHub Project Manager MCP | "Create new epic for [feature description]" |
| **Bulk label updates** | GitHub CLI | `gh issue list --json number --jq '.[].number' \| xargs -I {} gh issue edit {} --add-label` |
| **Sprint planning** | GitHub Project Manager MCP | "Plan next sprint with velocity analysis" |
| **Project roadmap** | Web Interface | Projects → Roadmap view |

### **Repository Operations**
| Task | Recommended Tool | Command/Action |
|------|------------------|----------------|
| **Release management** | GitHub CLI | `gh release create v1.0.0 --generate-notes` |
| **Wiki updates** | GitHub CLI | `gh api repos/:owner/:repo/wiki/pages` |
| **Branch protection** | Web Interface | Settings → Branches → Add rule |
| **Workflow management** | GitHub CLI | `gh workflow list` → `gh workflow run` |

### **Collaboration & Communication**
| Task | Recommended Tool | Command/Action |
|------|------------------|----------------|
| **PRD creation** | GitHub Project Manager MCP | "Generate PRD for [capability description]" |
| **Stakeholder updates** | GitHub Project Manager MCP | "Create sprint status report" |
| **Code review** | Web Interface | Pull requests → Files changed |
| **Team coordination** | GitHub Project Manager MCP | "Update project board with current progress" |

---

## **⚡ WORKFLOW OPTIMIZATION PATTERNS**

### **Security-First Development Workflow**
1. **Daily Security Check** (GitHub Project Manager MCP)
   - Review new vulnerability alerts
   - Triage and prioritize security issues
   - Update security task progress

2. **Weekly Security Planning** (GitHub CLI + MCP)
   - Run comprehensive security audit: `npm audit`
   - Create GitHub issues for actionable items
   - Schedule dependency updates in sprint planning

3. **Monthly Security Review** (Web Interface + MCP)
   - Review security policy effectiveness
   - Analyze vulnerability trends and patterns
   - Update team security training and documentation

### **Efficient Development Planning**
1. **Sprint Planning** (GitHub Project Manager MCP)
   - Velocity analysis and capacity planning
   - Epic breakdown into manageable stories
   - Automated task creation with proper hierarchy

2. **Daily Development** (GitHub CLI)
   - Quick issue status updates
   - Automated branch and PR creation
   - Commit message integration with issues

3. **Sprint Review** (Web Interface + MCP)
   - Visual project board review
   - Stakeholder demonstration preparation
   - Next sprint backlog refinement

---

## **🎯 STRATEGIC RECOMMENDATIONS**

### **For Security Management**
**PRIMARY**: GitHub Project Manager MCP
**BACKUP**: GitHub CLI for dependency management + Web Interface for policy configuration
**RATIONALE**: Enhanced security permissions enable comprehensive vulnerability management

### **For Development Planning**
**PRIMARY**: GitHub Project Manager MCP for planning + GitHub CLI for execution
**BACKUP**: Web Interface for complex visual operations
**RATIONALE**: Natural language planning with efficient command-line execution

### **For Emergency Operations**
**PRIMARY**: GitHub CLI for speed + Web Interface for verification
**BACKUP**: GitHub Project Manager MCP for communication
**RATIONALE**: Direct command-line access for rapid response with visual confirmation

### **For Stakeholder Communication**
**PRIMARY**: GitHub Project Manager MCP for content generation + Web Interface for presentation
**BACKUP**: GitHub CLI for data extraction
**RATIONALE**: Automated reporting with professional visual presentation

---

## **📊 TOOL INTEGRATION MATRIX**

| Operation Category | Primary Tool | Secondary Tool | Use Case |
|-------------------|--------------|----------------|----------|
| **Security Alerts** | GitHub Project Manager MCP | npm audit (CLI) | Comprehensive vulnerability management |
| **Sprint Planning** | GitHub Project Manager MCP | Web Interface | Velocity-driven planning with visual boards |
| **Emergency Fixes** | GitHub CLI | Web Interface | Rapid response with verification |
| **Release Management** | GitHub CLI | GitHub Project Manager MCP | Automated workflows with communication |
| **Repository Administration** | Web Interface | GitHub CLI | Visual configuration with scripted backup |
| **Daily Development** | GitHub CLI | GitHub Project Manager MCP | Efficient execution with smart planning |

---

## **🔧 TROUBLESHOOTING & COMMON ISSUES**

### **Security Alerts Access Issues**
**Problem**: `HTTP 403` errors when accessing vulnerability data
**Solution**:
1. Verify GitHub token has security permissions
2. Use GitHub Project Manager MCP instead of CLI
3. Check organization security settings

### **MCP Server Connection Issues**
**Problem**: MCP servers not responding or authentication failures
**Solution**:
1. Verify token permissions and expiration
2. Restart Claude desktop application
3. Check MCP server configuration in `.mcp/claude-desktop-config.json`

### **CLI Authentication Problems**
**Problem**: GitHub CLI authentication expired or insufficient permissions
**Solution**:
```bash
gh auth logout
gh auth login --scopes "repo,workflow,write:org,read:user,read:project,security_events"
gh auth refresh
```

### **Project Board Sync Issues**
**Problem**: GitHub Project not reflecting current repository state
**Solution**:
1. Use GitHub Project Manager MCP to refresh project data
2. Verify project-repository connection in web interface
3. Check project field configurations and automation rules

---

## **📈 PERFORMANCE & EFFICIENCY METRICS**

### **Tool Performance Comparison**
| Tool | Setup Time | Learning Curve | Security Features | Automation Potential |
|------|------------|----------------|-------------------|---------------------|
| **GitHub CLI** | 5 minutes | Medium | Limited | Excellent |
| **GitHub Project Manager MCP** | 15 minutes | Low | Excellent | Excellent |
| **Official GitHub MCP** | 10 minutes | Low | Limited | Good |
| **Web Interface** | 0 minutes | Low | Excellent | Poor |

### **Efficiency Recommendations**
- **80% of operations**: GitHub Project Manager MCP (natural language, enhanced permissions)
- **15% of operations**: GitHub CLI (bulk operations, scripting, emergency fixes)
- **5% of operations**: Web Interface (complex configuration, visual review)

---

## **🎯 CONCLUSION & BEST PRACTICES**

### **Golden Rules for Tool Selection**
1. **Security Operations**: Always use GitHub Project Manager MCP for enhanced permissions
2. **Bulk Operations**: GitHub CLI for efficiency and scriptability
3. **Visual Operations**: Web Interface for complex layouts and stakeholder presentations
4. **Emergency Response**: GitHub CLI for speed, Web Interface for verification
5. **Stakeholder Communication**: GitHub Project Manager MCP for content generation

### **Integration Strategy**
- Configure all tools for maximum flexibility
- Use GitHub Project Manager MCP as primary interface
- Keep GitHub CLI ready for emergency operations
- Maintain Web Interface access for administrative tasks
- Document tool choice decisions for team consistency

**This comprehensive guide ensures optimal GitHub tool selection for all project management, security operations, and development workflows.**
