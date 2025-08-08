# 🚀 Claude Intelligence Suite - Deployment Guide

## Universal Deployment Options

The Claude Intelligence Suite can be deployed on any project using multiple methods. Choose the one that best fits your workflow.

### 🎯 Quick Start (60 seconds)

```bash
# Option 1: One-line installer
curl -fsSL https://raw.githubusercontent.com/claude-ai/intelligence-suite/main/install.sh | bash

# Option 2: NPX (no installation)
npx @claude-ai/intelligence-suite

# Option 3: Global install
npm install -g @claude-ai/intelligence-suite
claude-intelligence
```

## 📦 Deployment Methods

### 1. Direct Download (Recommended for most projects)

```bash
# Download portable script
curl -O https://raw.githubusercontent.com/claude-ai/intelligence-suite/main/claude-intelligence-suite-portable.js
chmod +x claude-intelligence-suite-portable.js

# Run in your project
./claude-intelligence-suite-portable.js
```

**✅ Pros:** Zero dependencies, works anywhere, self-contained  
**❌ Cons:** Manual download required

### 2. NPM Package

```bash
# Local install
npm install @claude-ai/intelligence-suite
npx @claude-ai/intelligence-suite

# Global install
npm install -g @claude-ai/intelligence-suite
claude-intelligence
```

**✅ Pros:** Easy updates, integrated with Node.js workflow  
**❌ Cons:** Requires npm, adds to dependencies

### 3. Docker Container

```bash
# Quick start with Docker
docker run -it --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  -p 3050-3059:3050-3059 \
  node:16 \
  npx @claude-ai/intelligence-suite
```

**✅ Pros:** Isolated environment, consistent deployment  
**❌ Cons:** Requires Docker, less direct access

### 4. Universal Installer

```bash
# Interactive installer with options
curl -fsSL https://example.com/install.sh | bash

# Customized installation
curl -fsSL https://example.com/install.sh | bash -s -- \
  --project my-project \
  --base-port 4000 \
  --global
```

**✅ Pros:** Handles prerequisites, customizable, service setup  
**❌ Cons:** Requires internet connection

## 🛠️ Project-Specific Deployments

### React Projects

```json
{
  "scripts": {
    "claude:start": "npx @claude-ai/intelligence-suite",
    "claude:dev": "concurrently \"npm start\" \"npm run claude:start\"",
    "claude:build": "npm run build && npm run claude:start"
  }
}
```

### Node.js/Express Projects

```javascript
// server.js
if (process.env.NODE_ENV === 'development') {
  const ClaudeIntelligence = require('@claude-ai/intelligence-suite');
  new ClaudeIntelligence({
    projectName: 'my-express-app',
    enabledTools: ['system', 'git', 'database', 'context']
  });
}
```

### Python Projects

```bash
# requirements-dev.txt
# Add to your development dependencies file
# @claude-ai/intelligence-suite (install via npm in dev environment)

# In your project
npm install -g @claude-ai/intelligence-suite
claude-intelligence
```

### Go Projects

```bash
# Add to your Makefile
dev:
	npx @claude-ai/intelligence-suite &
	go run main.go

# Or in go.mod project
//go:generate npx @claude-ai/intelligence-suite
```

### Rust Projects

```toml
# In Cargo.toml, add a custom command
[alias]
claude = "run --bin claude-start"

# Create a simple binary to start the suite
# src/bin/claude-start.rs
fn main() {
    std::process::Command::new("npx")
        .args(&["@claude-ai/intelligence-suite"])
        .status()
        .expect("Failed to start Claude Intelligence Suite");
}
```

## 🌐 Production Deployments

### PM2 Process Manager

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'claude-intelligence',
    script: 'npx',
    args: '@claude-ai/intelligence-suite',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'development',
      PROJECT_NAME: 'production-app',
      BASE_PORT: 3050,
      LOG_LEVEL: 'info'
    }
  }]
};
```

```bash
# Deploy with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - claude-intelligence
  
  claude-intelligence:
    image: node:16
    working_dir: /workspace
    volumes:
      - .:/workspace
    ports:
      - "3050-3059:3050-3059"
    command: npx @claude-ai/intelligence-suite
    environment:
      - PROJECT_NAME=docker-app
      - BASE_PORT=3050
      - LOG_LEVEL=info
    restart: unless-stopped
```

### Kubernetes

```yaml
# claude-intelligence-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: claude-intelligence
spec:
  replicas: 1
  selector:
    matchLabels:
      app: claude-intelligence
  template:
    metadata:
      labels:
        app: claude-intelligence
    spec:
      containers:
      - name: claude-intelligence
        image: node:16
        command: ["npx", "@claude-ai/intelligence-suite"]
        ports:
        - containerPort: 3050
        env:
        - name: PROJECT_NAME
          value: "kubernetes-app"
        - name: BASE_PORT
          value: "3050"
        volumeMounts:
        - name: workspace
          mountPath: /workspace
      volumes:
      - name: workspace
        hostPath:
          path: /path/to/project
---
apiVersion: v1
kind: Service
metadata:
  name: claude-intelligence-service
spec:
  selector:
    app: claude-intelligence
  ports:
  - port: 3050
    targetPort: 3050
  type: LoadBalancer
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/claude-intelligence.yml
name: Claude Intelligence Monitoring
on: [push, pull_request]

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Start Claude Intelligence
        run: |
          npx @claude-ai/intelligence-suite &
          CLAUDE_PID=$!
          sleep 10
          
          # Health check
          curl -f http://localhost:3050/health || exit 1
          
          # Run your tests here
          npm test
          
          # Cleanup
          kill $CLAUDE_PID
```

## ⚙️ Configuration Management

### Environment Variables

```bash
# .env file
PROJECT_NAME=my-awesome-project
BASE_PORT=3050
ENABLED_TOOLS=system,git,database,context
LOG_LEVEL=info
DATA_DIR=/tmp/claude-intelligence
AUTO_DETECT_SERVICES=true
```

### Configuration File

```javascript
// claude-intelligence.config.js
module.exports = {
  projectName: process.env.PROJECT_NAME || 'auto-detect',
  basePort: parseInt(process.env.BASE_PORT) || 3050,
  
  enabledTools: process.env.ENABLED_TOOLS ? 
    process.env.ENABLED_TOOLS.split(',') : 
    ['system', 'git', 'context'],
  
  logLevel: process.env.LOG_LEVEL || 'info',
  dataDir: process.env.DATA_DIR || '/tmp/claude-intelligence',
  autoDetectServices: process.env.AUTO_DETECT_SERVICES !== 'false',
  
  // Database configuration
  database: {
    connectionString: process.env.DATABASE_URL,
    maxConnections: 20
  },
  
  // Git configuration  
  git: {
    mainBranch: 'main',
    analyzeDepth: 100
  },
  
  // System monitoring configuration
  system: {
    monitorInterval: 10000,
    alertThresholds: {
      cpu: 90,
      memory: 85,
      disk: 90
    }
  }
};
```

### Runtime Configuration

```javascript
// Start with custom configuration
const ClaudeIntelligence = require('@claude-ai/intelligence-suite');

const suite = new ClaudeIntelligence({
  projectName: 'runtime-configured-app',
  basePort: 4000,
  enabledTools: ['system', 'git'],
  
  // Custom tool configurations
  systemConfig: {
    monitorInterval: 5000,
    alertThresholds: { cpu: 80, memory: 75 }
  },
  
  gitConfig: {
    analyzeDepth: 200,
    trackCollaboration: true
  }
});
```

## 🔒 Security Considerations

### Network Security

```bash
# Bind to localhost only (default)
export BIND_HOST=127.0.0.1

# Allow specific networks
export BIND_HOST=192.168.1.0/24

# Firewall rules (Ubuntu/Debian)
sudo ufw allow from 192.168.1.0/24 to any port 3050:3059
```

### Process Security

```bash
# Run as non-root user
useradd -r -s /bin/false claude-intelligence
sudo -u claude-intelligence npx @claude-ai/intelligence-suite

# Systemd service with user isolation
# /etc/systemd/system/claude-intelligence.service
[Unit]
Description=Claude Intelligence Suite

[Service]
Type=simple
User=claude-intelligence
Group=claude-intelligence
WorkingDirectory=/opt/claude-intelligence
ExecStart=/usr/bin/node /opt/claude-intelligence/suite.js
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
```

### Data Security

```javascript
// Secure configuration
const config = {
  // Encrypt sensitive data
  dataEncryption: true,
  encryptionKey: process.env.CLAUDE_ENCRYPTION_KEY,
  
  // Limit data retention
  dataRetentionDays: 7,
  
  // Disable external access
  allowExternalAccess: false,
  
  // Authentication (if needed)
  authentication: {
    enabled: process.env.NODE_ENV === 'production',
    token: process.env.CLAUDE_AUTH_TOKEN
  }
};
```

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Health check script
#!/bin/bash
HEALTH_URL="http://localhost:3050/health"
if curl -f $HEALTH_URL > /dev/null 2>&1; then
  echo "Claude Intelligence Suite is healthy"
  exit 0
else
  echo "Claude Intelligence Suite is unhealthy"
  exit 1
fi
```

### Log Management

```bash
# Structured logging
export LOG_LEVEL=info
export LOG_FORMAT=json
export LOG_FILE=/var/log/claude-intelligence.log

# Log rotation with logrotate
# /etc/logrotate.d/claude-intelligence
/var/log/claude-intelligence.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 claude-intelligence claude-intelligence
}
```

### Backup & Recovery

```bash
# Backup intelligence data
tar -czf claude-intelligence-backup-$(date +%Y%m%d).tar.gz \
  /tmp/claude-intelligence

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/claude-intelligence"
DATA_DIR="/tmp/claude-intelligence"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" $DATA_DIR

# Cleanup old backups
find $BACKUP_DIR -name "backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete
```

## 🆘 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Find conflicting processes
lsof -i :3050-3059

# Use different port range
BASE_PORT=4000 npx @claude-ai/intelligence-suite
```

**Permission errors:**
```bash
# Fix file permissions
chmod +x claude-intelligence-suite-portable.js

# Create data directory
mkdir -p /tmp/claude-intelligence
chmod 755 /tmp/claude-intelligence
```

**Memory issues:**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 claude-intelligence-suite.js

# Or set environment variable
export NODE_OPTIONS="--max-old-space-size=4096"
```

**Network connectivity:**
```bash
# Test local connectivity
curl http://localhost:3050/health

# Test network connectivity  
curl http://192.168.1.100:3050/health

# Check firewall
sudo ufw status
```

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug
npx @claude-ai/intelligence-suite

# Trace network requests
export DEBUG=*
npx @claude-ai/intelligence-suite

# Profile performance
node --prof claude-intelligence-suite.js
```

### Recovery Procedures

```bash
# Complete reset
rm -rf /tmp/claude-intelligence
pkill -f claude-intelligence
npx @claude-ai/intelligence-suite

# Partial reset (keep data)
pkill -f claude-intelligence
npx @claude-ai/intelligence-suite

# Service restart
sudo systemctl restart claude-intelligence
```

---

**🎯 Goal: Universal deployment of Claude Intelligence Suite on any project to minimize productivity degradation through maximum contextual data access.**