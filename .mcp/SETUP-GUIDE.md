# GitHub MCP Server Setup Guide

## 🔌 **How to Connect to GitHub MCP Servers**

### **Issue Identified:**
- GitHub Official MCP: "projects" toolset doesn't exist (should be removed from config)
- Project Manager MCP: Successfully connects but AI features require API keys

### **✅ Working Configurations:**

## **1. Claude Desktop App** (Recommended)

**Location**: `~/.config/claude-desktop/claude_desktop_config.json` (Linux) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)

```json
{
  "mcpServers": {
    "github-official": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN=YOUR_TOKEN_HERE",
        "-e", "GITHUB_TOOLSETS=repos,issues,pull_requests",
        "ghcr.io/github/github-mcp-server",
        "stdio"
      ]
    },
    "github-project-manager": {
      "command": "mcp-github-project-manager",
      "args": [
        "--token", "YOUR_TOKEN_HERE",
        "--owner", "PrairieAster-Ai",
        "--repo", "nearest-nice-weather"
      ],
      "env": {
        "ANTHROPIC_API_KEY": "your-anthropic-key-here-for-ai-features"
      }
    }
  }
}
```

## **2. VS Code MCP Extension**

**Install**: [MCP Extension](https://marketplace.visualstudio.com/items?itemName=anthropic.mcp)

**Config Location**: `.vscode/settings.json` in your project

```json
{
  "mcp.servers": {
    "github-official": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN=YOUR_TOKEN_HERE", 
        "-e", "GITHUB_TOOLSETS=repos,issues,pull_requests",
        "ghcr.io/github/github-mcp-server",
        "stdio"
      ]
    },
    "github-project-manager": {
      "command": "mcp-github-project-manager",
      "env": {
        "GITHUB_TOKEN": "YOUR_TOKEN_HERE",
        "GITHUB_OWNER": "PrairieAster-Ai",
        "GITHUB_REPO": "nearest-nice-weather",
        "ANTHROPIC_API_KEY": "your-anthropic-key-here-for-ai-features"
      }
    }
  }
}
```

## **3. Command Line Usage**

### **GitHub Official MCP (Basic GitHub operations):**
```bash
# Start server
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="YOUR_TOKEN" \
  -e GITHUB_TOOLSETS="repos,issues,pull_requests" \
  ghcr.io/github/github-mcp-server stdio

# Available toolsets: repos, issues, pull_requests, actions
# NOTE: "projects" toolset not available yet
```

### **Project Manager MCP (Advanced AI features):**
```bash
# Basic usage (no AI features)
mcp-github-project-manager \
  --token "YOUR_TOKEN" \
  --owner "PrairieAster-Ai" \
  --repo "nearest-nice-weather"

# With AI features enabled
export ANTHROPIC_API_KEY="your-key-here"
export OPENAI_API_KEY="your-key-here"  # Alternative
mcp-github-project-manager \
  --token "YOUR_TOKEN" \
  --owner "PrairieAster-Ai" \
  --repo "nearest-nice-weather" \
  --verbose
```

## **4. What Each MCP Server Provides**

### **GitHub Official MCP:**
✅ **Standard GitHub Operations:**
- Repository management
- Issue creation/editing
- Pull request operations  
- GitHub Actions integration
- Official GitHub support

❌ **Limitations:**
- No Projects v2 support yet
- Basic functionality only
- No AI-powered features

### **Kunwar Project Manager MCP:**
✅ **Advanced Project Management:**
- AI-powered task breakdown
- Automated PRD generation
- Sprint planning assistance
- Business impact analysis
- 40+ project management tools

⚠️ **Requirements:**
- API key for AI features (ANTHROPIC_API_KEY recommended)
- Port 3001 free for webhook server
- Node.js environment

## **5. Recommended Setup Steps**

### **For Claude Desktop Users:**
1. Install Claude Desktop app
2. Copy config to `~/.config/claude-desktop/claude_desktop_config.json`
3. Replace `YOUR_TOKEN_HERE` with your GitHub token
4. Restart Claude Desktop
5. Verify connection in Claude chat

### **For VS Code Users:**
1. Install MCP extension from marketplace
2. Copy config to `.vscode/settings.json`
3. Replace `YOUR_TOKEN_HERE` with your GitHub token
4. Restart VS Code
5. Use MCP commands in VS Code

### **For CLI Users:**
1. Use our Octokit GitHub Manager (recommended): `npm run gh:milestones`
2. Or connect directly to MCP servers using the command line examples above

## **6. Testing Connection**

### **In Claude Desktop:**
```
Ask Claude: "List my GitHub issues for nearest-nice-weather repository"
```

### **In VS Code:**
```
Command Palette > MCP: List GitHub Issues
```

### **Command Line:**
```bash
# Test basic connection
docker run --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="YOUR_TOKEN" \
  -e GITHUB_TOOLSETS="repos,issues" \
  ghcr.io/github/github-mcp-server stdio \
  --help
```

## **7. Troubleshooting**

### **Common Issues:**
- **"toolset projects does not exist"**: Remove "projects" from GITHUB_TOOLSETS
- **"Port 3001 in use"**: Kill other services on port 3001 or use different port
- **"AI features unavailable"**: Add ANTHROPIC_API_KEY environment variable
- **"Permission denied"**: Verify GitHub token has correct permissions

### **Quick Fixes:**
```bash
# Kill process on port 3001
sudo lsof -t -i:3001 | xargs kill -9

# Test GitHub token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# Check Docker
docker pull ghcr.io/github/github-mcp-server:latest
```

## **8. Current Status**

✅ **Working**: Both MCP servers are installed and configured
✅ **Working**: Octokit GitHub Manager provides immediate efficiency
⚠️ **Needs Setup**: MCP client integration (Claude Desktop/VS Code)
✅ **Ready**: Configuration files created for easy setup

**Recommendation**: Use Octokit GitHub Manager for immediate GitHub operations, set up Claude Desktop MCP for advanced AI-powered project management.