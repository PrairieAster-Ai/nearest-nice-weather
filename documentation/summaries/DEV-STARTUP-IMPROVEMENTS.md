# 🚀 DEVELOPMENT STARTUP SCRIPT IMPROVEMENTS

## Overview
Comprehensive improvements for the development startup script, replacing BrowserToolsMCP with PlaywrightMCP and enhancing reliability, monitoring, and developer experience.

## ✅ **IMPLEMENTED CHANGES**

### 1. **PlaywrightMCP Integration** 🧪
- **Replaced**: BrowserToolsMCP → PlaywrightMCP
- **Benefits**:
  - Native Playwright testing integration
  - Better browser automation capabilities
  - More reliable screenshot and testing features
  - Actively maintained MCP server

### 2. **Enhanced Visual Feedback** 🎨
- **Color-coded output**: Success (green), warnings (yellow), errors (red), info (purple)
- **Timestamped logging**: Every action shows precise timing
- **Progress indicators**: Clear phase separation
- **Status summaries**: Quick visual service status

### 3. **Improved Error Handling** 🛡️
- **Port management**: Automatic port freeing with verification
- **Service retries**: 3 attempts with exponential backoff
- **Graceful degradation**: Non-critical services don't block startup
- **Detailed logging**: All output saved to organized log files

### 4. **Command Line Options** 🎛️
```bash
./dev-startup-improved.sh [options]
  --skip-tests     # Skip PlaywrightMCP test suite
  --no-monitor     # Disable continuous monitoring
  --verbose        # Show detailed output
  --clean          # Clean start (remove all caches)
```

### 5. **Continuous Monitoring** 📊
- **Auto-restart**: Services automatically restart if they crash
- **Health checks**: Regular validation every 30 seconds
- **Log rotation**: Prevents log files from growing too large
- **PID tracking**: Clean process management

## 🔧 **ADDITIONAL IMPROVEMENT SUGGESTIONS**

### 1. **Docker Compose Integration** 🐳
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  frontend:
    build: ./apps/web
    ports:
      - "3001:3001"
    volumes:
      - ./apps/web:/app
    environment:
      - VITE_API_URL=http://api:4000

  api:
    build: .
    ports:
      - "4000:4000"
    env_file: .env
    depends_on:
      - postgres

  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: weather_intelligence
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  playwright:
    image: mcr.microsoft.com/playwright:v1.40.0
    ports:
      - "3026:3026"
    command: npx @modelcontextprotocol/server-playwright

volumes:
  postgres_data:
```

**Benefits**:
- One command startup: `docker-compose up`
- Consistent environment across team
- Isolated dependencies
- Easy cleanup

### 2. **Service Health Dashboard** 📊
```javascript
// health-dashboard.js
const express = require('express');
const app = express();

const services = [
  { name: 'API', url: 'http://localhost:4000/api/health', port: 4000 },
  { name: 'Frontend', url: 'http://localhost:3001', port: 3001 },
  { name: 'PlaywrightMCP', url: 'http://localhost:3026', port: 3026 },
  { name: 'Database', url: 'http://localhost:4000/api/test-db', port: 5432 }
];

app.get('/', async (req, res) => {
  const statuses = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await fetch(service.url);
        return { ...service, status: response.ok ? 'healthy' : 'unhealthy' };
      } catch (error) {
        return { ...service, status: 'down' };
      }
    })
  );

  res.send(`
    <html>
      <head>
        <title>Dev Environment Health</title>
        <meta http-equiv="refresh" content="5">
        <style>
          .healthy { color: green; }
          .unhealthy { color: orange; }
          .down { color: red; }
        </style>
      </head>
      <body>
        <h1>Development Environment Status</h1>
        <ul>
          ${statuses.map(s =>
            `<li class="${s.status}">${s.name}: ${s.status.toUpperCase()}</li>`
          ).join('')}
        </ul>
      </body>
    </html>
  `);
});

app.listen(3099, () => {
  console.log('Health dashboard at http://localhost:3099');
});
```

### 3. **Environment Validation Script** ✅
```bash
#!/bin/bash
# validate-env.sh

validate_env() {
    local errors=0

    # Check Node version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="20.0.0"
    if ! [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]]; then
        echo "❌ Node.js version $NODE_VERSION is below required $REQUIRED_VERSION"
        ((errors++))
    fi

    # Check required environment variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "VITE_API_PROXY_URL"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^$var=" .env 2>/dev/null; then
            echo "❌ Missing required environment variable: $var"
            ((errors++))
        fi
    done

    # Check required ports are available
    REQUIRED_PORTS=(3001 4000)
    for port in "${REQUIRED_PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "⚠️  Port $port is already in use"
        fi
    done

    # Check npm packages
    if [ ! -d "node_modules" ]; then
        echo "❌ Node modules not installed. Run: npm install"
        ((errors++))
    fi

    return $errors
}
```

### 4. **Tmux/Screen Session Management** 🖥️
```bash
#!/bin/bash
# dev-tmux.sh

# Start development environment in tmux
tmux new-session -d -s nearestnice
tmux rename-window -t nearestnice:0 'Main'

# API server pane
tmux send-keys -t nearestnice:0 'node dev-api-server.js' C-m

# Frontend pane
tmux split-window -h -t nearestnice:0
tmux send-keys -t nearestnice:0.1 'cd apps/web && npm run dev' C-m

# Logs pane
tmux split-window -v -t nearestnice:0.1
tmux send-keys -t nearestnice:0.2 'tail -f logs/*.log' C-m

# Playwright pane
tmux new-window -t nearestnice:1 -n 'Testing'
tmux send-keys -t nearestnice:1 'npx @modelcontextprotocol/server-playwright' C-m

# Attach to session
tmux attach-session -t nearestnice
```

### 5. **Performance Monitoring** 📈
```javascript
// Add to dev-api-server.js
const responseTime = require('response-time');

app.use(responseTime((req, res, time) => {
  console.log(`${req.method} ${req.url} - ${time}ms`);

  // Alert on slow requests
  if (time > 1000) {
    console.warn(`⚠️ Slow request: ${req.url} took ${time}ms`);
  }
}));
```

### 6. **Automatic Dependency Updates** 📦
```json
// package.json scripts
{
  "scripts": {
    "dev:check": "npm-check-updates",
    "dev:update": "npm-check-updates -u && npm install",
    "dev:audit": "npm audit fix",
    "dev:clean": "rm -rf node_modules package-lock.json && npm install"
  }
}
```

### 7. **Git Hooks for Environment Validation** 🪝
```bash
# .git/hooks/post-checkout
#!/bin/bash
echo "🔍 Validating development environment..."
./validate-env.sh

# Check if package.json changed
if git diff HEAD~ HEAD --name-only | grep -q "package.json"; then
    echo "📦 package.json changed, running npm install..."
    npm install
fi
```

### 8. **VS Code Integration** 💻
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Environment",
      "type": "shell",
      "command": "./dev-startup-improved.sh",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Run Location Tests",
      "type": "shell",
      "command": "npx playwright test tests/location-estimation-comprehensive.spec.js",
      "group": "test"
    }
  ]
}
```

### 9. **Environment-Specific Configuration** ⚙️
```javascript
// config/dev-environment.js
module.exports = {
  services: {
    api: {
      port: process.env.API_PORT || 4000,
      host: process.env.API_HOST || 'localhost',
      healthCheck: '/api/health',
      startCommand: 'node dev-api-server.js',
      requiredEnvVars: ['DATABASE_URL']
    },
    frontend: {
      port: process.env.FRONTEND_PORT || 3001,
      host: process.env.FRONTEND_HOST || 'localhost',
      healthCheck: '/',
      startCommand: 'npm run dev',
      directory: 'apps/web'
    },
    playwright: {
      port: process.env.PLAYWRIGHT_PORT || 3026,
      optional: true,
      startCommand: 'npx @modelcontextprotocol/server-playwright'
    }
  },

  healthCheckInterval: 30000,
  startupTimeout: 30000,
  shutdownGracePeriod: 5000
};
```

### 10. **Debugging Helpers** 🐛
```bash
# debug-helpers.sh

# Function to capture all service states
debug_snapshot() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local snapshot_dir="debug_snapshots/$timestamp"

    mkdir -p "$snapshot_dir"

    # Capture process info
    ps aux | grep -E "node|vite|playwright" > "$snapshot_dir/processes.txt"

    # Capture port usage
    lsof -i :3001,4000,3026 > "$snapshot_dir/ports.txt" 2>&1

    # Capture recent logs
    tail -n 100 logs/*.log > "$snapshot_dir/recent_logs.txt" 2>&1

    # Capture environment
    env | grep -E "NODE|VITE|DATABASE" > "$snapshot_dir/environment.txt"

    # Test endpoints
    curl -s http://localhost:4000/api/health > "$snapshot_dir/api_health.json" 2>&1
    curl -s http://localhost:3001 > "$snapshot_dir/frontend.html" 2>&1

    echo "Debug snapshot saved to $snapshot_dir"
}
```

## 🎯 **IMPLEMENTATION PRIORITY**

### **Phase 1: Immediate** (Week 1)
1. ✅ Replace BrowserToolsMCP with PlaywrightMCP
2. ✅ Add visual feedback and better error handling
3. ✅ Implement command line options
4. ⬜ Add environment validation script

### **Phase 2: Short-term** (Week 2-3)
1. ⬜ Create health dashboard
2. ⬜ Implement tmux/screen session management
3. ⬜ Add performance monitoring
4. ⬜ Set up VS Code integration

### **Phase 3: Long-term** (Month 2)
1. ⬜ Docker Compose setup
2. ⬜ Git hooks for validation
3. ⬜ Automatic dependency updates
4. ⬜ Advanced debugging helpers

## 📈 **EXPECTED BENEFITS**

1. **Reduced Setup Time**: 90% → 30% failure rate reduction
2. **Faster Problem Detection**: Immediate visual feedback
3. **Better Developer Experience**: One-command startup with monitoring
4. **Improved Reliability**: Auto-recovery from common failures
5. **Enhanced Debugging**: Comprehensive logging and snapshots

## 🔧 **USAGE EXAMPLES**

```bash
# Standard startup
./dev-startup-improved.sh

# Quick restart with clean cache
./dev-startup-improved.sh --clean

# Debug mode with verbose output
./dev-startup-improved.sh --verbose

# CI/CD mode without monitoring
./dev-startup-improved.sh --skip-tests --no-monitor

# Full reset and validation
./dev-startup-improved.sh --clean --verbose
```

---

*This improved startup script provides a robust, reliable, and developer-friendly environment setup with comprehensive monitoring and debugging capabilities.*
