# 🧠 Claude Intelligence Suite (Portable)

**Minimize productivity degradation through contextual data access**

A portable, project-agnostic intelligence system that provides Claude AI with comprehensive contextual data about your development environment. Works with any project type - React, Node.js, Python, Go, Rust, and more.

## 🎯 Key Benefits

- **Proactive Issue Detection**: Catch problems before they impact productivity
- **Real-time Context**: Give Claude AI complete visibility into your development environment
- **Universal Compatibility**: Works with any project type and platform
- **Zero Dependencies**: Self-contained system with minimal requirements
- **Instant Setup**: Get running in under 60 seconds

## 🚀 Quick Start

### Option 1: Direct Download
```bash
# Download and run in your project directory
curl -O https://raw.githubusercontent.com/claude-ai/intelligence-suite/main/claude-intelligence-suite-portable.js
chmod +x claude-intelligence-suite-portable.js
./claude-intelligence-suite-portable.js
```

### Option 2: NPM Global Install
```bash
# Install globally
npm install -g @claude-ai/intelligence-suite

# Run in any project
cd your-project
claude-intelligence
```

### Option 3: NPX (No Install)
```bash
# Run directly with npx
npx @claude-ai/intelligence-suite
```

### Option 4: As Module
```javascript
const ClaudeIntelligence = require('@claude-ai/intelligence-suite');

const options = {
  projectName: 'my-awesome-project',
  basePort: 4000,
  enabledTools: ['system', 'git', 'context'],
  logLevel: 'info'
};

const suite = new ClaudeIntelligence(options);
```

## 📊 Dashboard Access

After starting, access your intelligence dashboard at:
```
http://localhost:3050
```

## 🛠️ Intelligence Tools

### System Monitor
- **Real-time resource monitoring**: CPU, memory, disk, network
- **Process analysis**: Top processes, resource usage patterns
- **Performance alerts**: Proactive issue detection

### Git Intelligence
- **Collaboration analysis**: Commit patterns, author productivity
- **Context transfer tracking**: Quality of knowledge sharing
- **Velocity metrics**: Development speed and consistency

### Database Intelligence *(auto-detected)*
- **Query performance**: Slow query detection and analysis
- **Connection monitoring**: Pool usage and optimization
- **Schema evolution**: Track database changes over time

### Context API
- **Unified data access**: Single endpoint for all intelligence data
- **Business alignment**: Project goals and productivity metrics
- **Recommendations**: Actionable insights for optimization

## ⚙️ Configuration Options

```javascript
const options = {
  // Project identification
  projectName: 'auto-detected',        // Your project name
  
  // Network configuration  
  basePort: 3050,                      // Starting port (uses 10 consecutive ports)
  
  // Tool selection
  enabledTools: [                      // Choose which tools to enable
    'system',                          // System resource monitoring
    'git',                            // Git collaboration analysis
    'database',                       // Database performance (auto-detected)
    'context'                         // Unified context API
  ],
  
  // Data and logging
  dataDir: '/tmp/claude-intelligence',  // Data storage directory
  logLevel: 'info',                    // Logging verbosity: debug, info, warn, error
  autoDetectServices: true,            // Automatically detect databases, etc.
  
  // Environment detection
  detectProjectType: true,             // Auto-detect React, Node.js, Python, etc.
  detectRunningServices: true         // Check for running development servers
};
```

## 🌍 Environment Variables

Configure via environment variables for easy deployment:

```bash
export PROJECT_NAME="my-project"
export BASE_PORT=4000
export ENABLED_TOOLS="system,git,context"
export LOG_LEVEL="debug"
export DATA_DIR="/custom/data/path"

claude-intelligence
```

## 📋 Supported Project Types

The intelligence suite automatically detects and optimizes for:

- **React** / **Vue** / **Angular** - Frontend frameworks
- **Node.js** / **Express** / **Fastify** - Backend frameworks  
- **Next.js** / **Nuxt** - Full-stack frameworks
- **Python** - Django, Flask, FastAPI projects
- **Go** - Go module projects
- **Rust** - Cargo projects
- **Java** - Maven projects
- **Docker** - Containerized applications
- **Generic** - Any project type

## 🔌 API Endpoints

### Master Control
- `GET /` - Interactive dashboard
- `GET /status` - System status and tool information
- `GET /config` - Configuration details
- `GET /environment` - Environment detection results
- `GET /health` - Health check for all tools

### Tool Management
- `GET /tools` - List all intelligence tools
- `POST /start?tool=<name>` - Start specific tool
- `POST /stop?tool=<name>` - Stop specific tool
- `POST /restart?tool=<name>` - Restart specific tool

### WebSocket Stream
- `ws://localhost:3051` - Real-time intelligence data stream

### Individual Tool APIs
- `http://localhost:3052` - System Monitor API
- `http://localhost:3054` - Database Intelligence API
- `http://localhost:3056` - Git Intelligence API
- `http://localhost:3058` - Context API

## 🔧 Integration Examples

### Docker Compose
```yaml
version: '3.8'
services:
  claude-intelligence:
    image: node:16
    working_dir: /app
    volumes:
      - .:/app
    ports:
      - "3050-3059:3050-3059"
    command: npx @claude-ai/intelligence-suite
    environment:
      - PROJECT_NAME=my-docker-project
      - BASE_PORT=3050
```

### GitHub Actions
```yaml
name: Claude Intelligence
on: [push, pull_request]
jobs:
  intelligence:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - name: Start Claude Intelligence
        run: |
          npx @claude-ai/intelligence-suite &
          sleep 10
          curl http://localhost:3050/health
```

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
      PROJECT_NAME: 'production-project',
      BASE_PORT: 3050,
      LOG_LEVEL: 'info'
    }
  }]
};
```

## 🚨 Troubleshooting

### Port Conflicts
```bash
# Check if ports are in use
lsof -i :3050-3059

# Use different base port
BASE_PORT=4000 claude-intelligence
```

### Permission Issues
```bash
# Ensure script is executable
chmod +x claude-intelligence-suite-portable.js

# Or run with node directly
node claude-intelligence-suite-portable.js
```

### Missing Dependencies
```bash
# Install optional dependencies for enhanced features
npm install ws pg  # WebSocket and PostgreSQL support
```

### Platform Compatibility
- **Linux**: Full feature support
- **macOS**: Full feature support  
- **Windows**: Core features (some system monitoring limitations)
- **Docker**: Full support in Linux containers

## 📚 Use Cases

### Solo Development
- **Real-time monitoring** of development environment
- **Git productivity** tracking and optimization
- **System resource** awareness and management

### Team Collaboration
- **Shared intelligence** across team members
- **Collaboration pattern** analysis and improvement
- **Context transfer** quality measurement

### CI/CD Integration
- **Build environment** monitoring and optimization
- **Performance regression** detection
- **Deployment health** tracking

### Claude AI Collaboration
- **Maximum context** for informed decision-making
- **Proactive issue** detection and resolution
- **Productivity optimization** through data-driven insights

## 🔐 Security & Privacy

- **Local-only data**: All intelligence data stays on your machine
- **No external calls**: No data transmitted to external services
- **Configurable access**: Control which tools and data are exposed
- **Process isolation**: Each tool runs in its own context

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/claude-ai/intelligence-suite.git
cd intelligence-suite
npm install
npm start
```

### Testing
```bash
npm test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/claude-ai/intelligence-suite/issues)
- **Documentation**: [Full documentation](https://claude-ai.github.io/intelligence-suite)
- **Community**: [Discussions and Q&A](https://github.com/claude-ai/intelligence-suite/discussions)

## 🎯 Roadmap

- [ ] **Enhanced Database Support** - MySQL, MongoDB, Redis integration
- [ ] **Cloud Deployment** - AWS, GCP, Azure one-click deployment
- [ ] **Performance Profiling** - Code-level performance analysis
- [ ] **Security Scanning** - Vulnerability detection and reporting
- [ ] **Custom Plugins** - Extensible intelligence tool framework
- [ ] **Machine Learning** - Predictive analytics and anomaly detection

---

**Built for Claude AI collaboration • Minimize productivity degradation • Maximize contextual intelligence**