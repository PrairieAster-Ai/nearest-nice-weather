# BrowserToolsMCP Server Troubleshooting Guide

## **Current Status**
✅ **Server is running and healthy** on localhost:3025  
✅ **Server responds to health checks**  
✅ **Chrome extension is configured correctly**  

## **Common Issues and Solutions**

### **1. Server Not Accessible in Chrome DevTools**

**Symptoms:**
- Chrome extension not connecting to server
- DevTools panel shows "Server not found"
- Screenshots not working

**Diagnosis:**
```bash
# Check server status
./scripts/browsertools-monitor.sh diagnose

# Quick health check
curl http://localhost:3025/health
```

**Solutions:**

#### **A. Restart Server (Quick Fix)**
```bash
# Restart server
./scripts/browsertools-monitor.sh restart

# Or restart all development services
./dev-startup.sh
```

#### **B. Chrome Extension Issues**
1. **Check extension status:**
   - Open Chrome → Extensions → Developer Mode
   - Ensure "BrowserToolsMCP" is enabled
   - Check for errors in extension console

2. **Reload extension:**
   - Click "Reload" button in Chrome Extensions
   - Refresh the page you're debugging

3. **Clear extension storage:**
   ```javascript
   // In Chrome extension console
   chrome.storage.local.clear()
   ```

#### **C. Port Conflicts**
```bash
# Check what's using port 3025
lsof -i :3025

# Kill conflicting processes
pkill -f browsertools-mcp-server

# Restart with clean slate
./dev-startup.sh
```

### **2. Server Keeps Stopping**

**Symptoms:**
- Server starts but dies after few minutes
- Health checks fail intermittently
- Process not found in `ps aux`

**Solutions:**

#### **A. Use Process Monitor (Recommended)**
```bash
# Start with automatic restart monitoring
./scripts/browsertools-monitor.sh monitor

# This will:
# - Monitor server every 30 seconds
# - Auto-restart if health checks fail
# - Log all restart attempts
```

#### **B. Use PM2 for Production-Like Management**
```bash
# Install PM2 globally
npm install -g pm2

# Start all services including BrowserToolsMCP
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs browsertools-mcp-server

# Restart specific service
pm2 restart browsertools-mcp-server
```

#### **C. Check System Resources**
```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check if system is swapping
swapon -s
```

### **3. Chrome Extension Connection Issues**

**Symptoms:**
- Extension loads but can't connect to server
- Screenshot function fails
- Console shows connection errors

**Solutions:**

#### **A. Verify Extension Configuration**
The extension is already configured for localhost:3025, but verify:
```javascript
// In Chrome extension background page console
chrome.storage.local.get(['browserConnectorSettings'], (result) => {
  console.log('Settings:', result);
});
```

#### **B. Test Manual Connection**
```bash
# Test server endpoints
curl http://localhost:3025/identity
curl http://localhost:3025/health
curl -X POST http://localhost:3025/current-url -H "Content-Type: application/json" -d '{"url":"test","tabId":123}'
```

#### **C. Check CORS Issues**
The server already has CORS enabled, but check console for errors:
```javascript
// In browser console
fetch('http://localhost:3025/identity')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### **4. Development Environment Issues**

**Symptoms:**
- Server starts but other services fail
- Port conflicts between services
- Environment variables not set

**Solutions:**

#### **A. Clean Restart**
```bash
# Kill all development processes
pkill -f "node.*vite"
pkill -f "node.*dev-api-server"
pkill -f "browsertools-mcp-server"

# Wait and restart
sleep 3
./dev-startup.sh
```

#### **B. Check Environment Variables**
```bash
# Verify required environment variables
./scripts/validate-env.sh

# Check .env file
cat .env
```

#### **C. Verify All Services**
```bash
# Check all service ports
lsof -i :3001  # Frontend
lsof -i :4000  # API
lsof -i :3025  # BrowserToolsMCP
lsof -i :3050  # Intelligence Suite
```

## **Prevention Strategies**

### **1. Automatic Monitoring**
Add to your shell startup file (`~/.bashrc` or `~/.zshrc`):
```bash
# Start BrowserToolsMCP monitor on development startup
alias dev-start='cd /home/robertspeer/Projects/GitRepo/nearest-nice-weather && ./dev-startup.sh'
alias browsertools-monitor='cd /home/robertspeer/Projects/GitRepo/nearest-nice-weather && ./scripts/browsertools-monitor.sh monitor'
```

### **2. Health Check Integration**
The `dev-startup.sh` script now includes:
- ✅ Health checks for all services
- ✅ Automatic BrowserToolsMCP monitoring
- ✅ Process cleanup before restart
- ✅ Connection validation

### **3. Process Management**
Choose one of these approaches:

#### **PM2 (Recommended for Development)**
```bash
# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Auto-start on system boot (optional)
pm2 startup
```

#### **Systemd Service (For System-Wide)**
```bash
# Copy service file
sudo cp scripts/browsertools-service.service /etc/systemd/system/

# Enable and start service
sudo systemctl enable browsertools-service
sudo systemctl start browsertools-service

# Check status
sudo systemctl status browsertools-service
```

### **4. Development Workflow**
```bash
# Daily startup routine
./dev-startup.sh                    # Start all services
./scripts/browsertools-monitor.sh status  # Verify BrowserToolsMCP

# During development
./scripts/browsertools-monitor.sh diagnose  # If issues occur

# End of day
pm2 stop all  # If using PM2
# or
pkill -f "node.*" # Kill all Node processes
```

## **Emergency Recovery**

If nothing works:

1. **Full Reset:**
   ```bash
   # Kill everything
   pkill -f node
   
   # Clear ports
   sudo lsof -ti:3025 | xargs sudo kill -9
   
   # Restart Docker (if needed)
   sudo systemctl restart docker
   
   # Clean restart
   ./dev-startup.sh
   ```

2. **Chrome Extension Reset:**
   - Remove and reinstall Chrome extension
   - Clear Chrome extension storage
   - Reload extension and target pages

3. **Check System Resources:**
   ```bash
   # Free up memory
   sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
   
   # Check disk space
   df -h
   ```

## **Monitoring Commands**

```bash
# Real-time monitoring
./scripts/browsertools-monitor.sh monitor

# Status check
./scripts/browsertools-monitor.sh status

# Full diagnostic
./scripts/browsertools-monitor.sh diagnose

# PM2 monitoring (if using PM2)
pm2 monit
```

## **Log Files**

Check these locations for debugging:
- `/tmp/browsertools-server.log` - Server output
- Browser console - Extension errors
- `pm2 logs browsertools-mcp-server` - PM2 logs (if using PM2)
- Chrome extension console - Extension diagnostics