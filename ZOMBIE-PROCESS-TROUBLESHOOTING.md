# Zombie Process Troubleshooting Guide

## Overview

This guide documents common zombie process issues that block development environment startup, specifically Chrome/Chromium processes that persist after browser automation sessions and Node.js processes from previous development sessions.

## Common Symptoms

- **Port conflicts**: Development server can't bind to expected port (3001 switches to 3002)
- **Startup delays**: Services take longer to start due to port scanning
- **Unexpected behavior**: Previous session state affecting new development work
- **Resource consumption**: Stale processes consuming memory and CPU

## Root Causes

### 1. Zombie Chrome Processes
**Pattern**: Chrome/Chromium processes from screenshot capture, presentation mode, or automated testing
```bash
# Example process signatures:
chrome --remote-debugging-port=9222 --screenshot
chromium --headless --disable-gpu --presentation
```

**Why they persist**:
- Browser automation tools (Playwright, Puppeteer) don't always clean up properly
- Screenshot capture tools leave background processes
- System crashes or force-kills during browser automation

### 2. Long-Running Node.js Processes
**Pattern**: Vite dev servers, API servers, or npm processes from previous sessions
```bash
# Example process signatures:
node dev-api-server.js
npm run dev
vite --port 3001
```

**Why they persist**:
- Improper shutdown (Ctrl+Z instead of Ctrl+C)
- Terminal session ended without stopping processes
- Process backgrounded and forgotten

## Automated Detection & Resolution

The enhanced `dev-startup-optimized.sh` script now includes:

### Zombie Process Detection
```bash
# Chrome/Chromium detection
if [[ "$process_info" == *"chrome"* ]] || [[ "$process_info" == *"chromium"* ]]; then
    warning "🧟 ZOMBIE CHROME DETECTED: $process_name (PID: $pid)"
    warning "📊 Process details: $process_info"
    if [[ "$process_info" == *"presentation"* ]] || [[ "$process_info" == *"screenshot"* ]]; then
        warning "🖼️  Likely stale screenshot/presentation process from previous session"
    fi
fi
```

### Contextual Information
- **Process age**: Identifies processes running for hours/days
- **Process type**: Distinguishes between Chrome, Node, and other processes
- **Related processes**: Groups related Chrome processes for bulk cleanup
- **Manual intervention**: Provides specific commands if automatic cleanup fails

### Automatic Cleanup
1. **Graceful termination** (SIGTERM) with 2-second timeout
2. **Force kill** (SIGKILL) if process doesn't respond
3. **Related process cleanup** for Chrome automation sessions
4. **Port verification** to confirm cleanup success

## Manual Troubleshooting

### Quick Commands
```bash
# Find processes using specific port
lsof -i :3001

# Kill specific process by PID
kill -TERM 12345
kill -KILL 12345  # if TERM doesn't work

# Kill all Chrome processes (use with caution)
pkill -f chrome

# Kill all Node.js processes on specific port
pkill -f "node.*3001"

# Nuclear option - kill all development-related processes
pkill -f "vite\|dev-api-server\|chrome.*debug"
```

### Port-Specific Cleanup
```bash
# Free port 3001 specifically
sudo fuser -k 3001/tcp

# Or using lsof
sudo lsof -ti:3001 | xargs kill -9
```

## Prevention Strategies

### 1. Proper Shutdown Sequence
- Always use `Ctrl+C` to stop development servers
- Never use `Ctrl+Z` (backgrounds process instead of stopping)
- Use the cleanup functions in startup scripts

### 2. Session Management
- Use `npm start` instead of direct `npm run dev` calls
- Leverage built-in monitoring and cleanup in startup scripts
- Set up proper signal handlers in development tools

### 3. Process Monitoring
```bash
# Check for zombie processes before starting development
ps aux | grep -E "(chrome|node|vite)" | grep -v grep

# Monitor process age
ps -eo pid,ppid,etime,cpu,command | grep -E "(chrome|node|vite)"
```

## Historical Context

**Date**: August 13, 2025  
**Session Context**: Port 3001 was blocked by stale Chrome processes from July 23rd
**Resolution**: Enhanced startup script with zombie detection + manual process cleanup

### Recurring Patterns Observed
- Chrome processes from screenshot automation persist after script completion
- Node.js processes from previous development sessions block new startup
- Port conflicts cause frontend server to auto-switch from 3001 to 3002
- Each occurrence costs 5-15 minutes of debugging time

### Process Age Indicators
- **Recent** (minutes): Usually intentional, verify before killing
- **Hours**: Likely from today's development, safe to clean up
- **Days/Weeks**: Definitely zombie processes, clean up immediately

## Integration with Development Workflow

The enhanced startup script (`dev-startup-optimized.sh`) now provides:
- **Automatic detection** during port cleanup phase
- **Contextual warnings** about process types and ages  
- **Guided manual intervention** if automatic cleanup fails
- **Process grouping** for related Chrome automation sessions

This reduces debugging time from 15+ minutes to under 2 minutes for port conflicts.

## Future Improvements

1. **Proactive monitoring**: Daily cron job to identify long-running processes
2. **Browser automation cleanup**: Enhanced Playwright/Puppeteer exit handlers
3. **Resource limits**: Process monitoring with automatic cleanup thresholds
4. **Team documentation**: Share patterns with other developers