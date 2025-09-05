# Docker Networking Troubleshooting Runbook

## Quick Reference Card
```bash
# Emergency localhost fix (2 minutes)
sudo systemctl restart docker
./apply-docker-fix.sh

# Health check
node -e "const http = require('http'); const server = http.createServer((req, res) => res.end('OK')); server.listen(3999, '127.0.0.1', () => { console.log('✅ Localhost OK'); server.close(); }).on('error', (err) => console.log('❌ Localhost failed:', err.message));"
```

## Symptoms & Root Causes

### Symptom: "Connection refused" on localhost
**Root Cause**: Docker bridge network conflict with localhost binding
**Fix Time**: 2-5 minutes
**Frequency**: After system restart or Docker updates

### Symptom: Development server starts but unreachable
**Root Cause**: Docker iptables rules blocking localhost traffic
**Fix Time**: 30 seconds
**Frequency**: Sporadic after container operations

### Symptom: Port already in use (but nothing listening)
**Root Cause**: Ghost Docker networking state
**Fix Time**: 1 minute
**Frequency**: After crashed containers

## Diagnostic Procedures

### Level 1: Quick Health Check (30 seconds)
```bash
# Test localhost binding
node -e "
const http = require('http');
const server = http.createServer((req, res) => res.end('OK'));
server.listen(3999, '127.0.0.1', () => {
  console.log('✅ Localhost binding works');
  server.close();
}).on('error', (err) => {
  console.log('❌ Localhost binding failed:', err.message);
});"

# Check Docker status
systemctl is-active docker && echo "✅ Docker running" || echo "❌ Docker stopped"

# Check for port conflicts
ss -tulpn | grep :300
```

### Level 2: Network Analysis (2 minutes)
```bash
# Check Docker networks
docker network ls

# Check bridge interfaces
ip addr show docker0 2>/dev/null || echo "No docker0 interface"

# Check routing conflicts
ip route | grep docker

# Check iptables Docker rules
sudo iptables -L -n | grep docker | head -5
```

### Level 3: Deep Investigation (5 minutes)
```bash
# Docker daemon logs
sudo journalctl -u docker.service --since "1 hour ago" --no-pager | tail -20

# Network namespace issues
sudo ip netns list

# Container networking state
docker ps -a
docker network inspect bridge
```

## Fix Procedures

### Fix 1: Standard Docker Restart (2 minutes)
```bash
# Stop Docker completely
sudo systemctl stop docker.socket
sudo systemctl stop docker

# Clean network interfaces (if safe)
sudo ip link delete docker0 2>/dev/null || true

# Restart Docker
sudo systemctl start docker
sudo systemctl start docker.socket

# Verify fix
node -e "const http = require('http'); const server = http.createServer().listen(3999, '127.0.0.1', () => { console.log('✅ Fixed'); server.close(); });"
```

### Fix 2: Apply Permanent Configuration (5 minutes)
```bash
# Run our automated fix
./apply-docker-fix.sh

# Verify daemon.json applied
cat /etc/docker/daemon.json

# Restart to apply
sudo systemctl restart docker

# Test development environment
npm run dev
```

### Fix 3: Nuclear Option (10 minutes)
**⚠️ Use only when other fixes fail**
```bash
# Backup running containers
docker ps -a > docker-containers-backup.txt

# Stop all containers
docker stop $(docker ps -aq) 2>/dev/null || true

# Reset Docker networking
sudo systemctl stop docker
sudo rm -rf /var/lib/docker/network
sudo systemctl start docker

# Recreate development network
docker network create --driver bridge --subnet=172.31.1.0/24 dev-network

# Test localhost
curl -f http://localhost:3001/ || echo "Still broken - escalate"
```

## Prevention Strategies

### 1. Proactive Configuration
```bash
# Apply on first setup
./apply-docker-fix.sh

# Add to system startup
echo "@reboot $(whoami) /path/to/project/apply-docker-fix.sh" | crontab -
```

### 2. Development Workflow
```bash
# Always test localhost after restart
npm start

# Monitor for conflicts
alias docker-health="docker network ls && ip route | grep docker"
```

### 3. Team Onboarding
```bash
# Include in setup checklist
- [ ] Docker installed and configured
- [ ] Custom daemon.json applied
- [ ] Localhost binding tested
- [ ] Development server working
```

## Escalation Criteria

**Escalate to Infrastructure Team when:**
- Fix procedures don't resolve issue within 10 minutes
- Docker daemon fails to start after configuration changes
- System-wide networking issues (not just localhost)
- Recurring issues after permanent fixes applied

**Escalate to Development Team when:**
- Application-specific networking issues
- Port conflicts with other development tools
- Performance issues with Docker containers

## Monitoring & Alerts

### Daily Health Checks
```bash
# Add to daily standup checklist
./docker-localhost-health-check.sh
```

### Weekly Maintenance
```bash
# Clean up unused networks
docker network prune -f

# Verify configuration still applied
diff /etc/docker/daemon.json docker-daemon-config.json
```

## Known Issues & Workarounds

### Issue: Docker Desktop vs Docker CE
**Problem**: Different networking behavior between Docker Desktop and Docker CE
**Workaround**: Use Docker CE for development environments
**Permanent Fix**: Standardize on Docker CE across team

### Issue: VPN Interference
**Problem**: Corporate VPN can conflict with Docker networking
**Workaround**: Disconnect VPN during development
**Permanent Fix**: Configure VPN to exclude Docker subnets

### Issue: Windows WSL2 Networking
**Problem**: WSL2 has different Docker networking behavior
**Workaround**: Use Windows-specific Docker configuration
**Permanent Fix**: Document WSL2-specific setup procedures

## Success Metrics

**Target Recovery Times:**
- Level 1 diagnostics: <30 seconds
- Standard fix application: <2 minutes
- Complete environment rebuild: <5 minutes

**Reliability Targets:**
- 95% of Docker restarts should not require manual intervention
- <1 networking issue per developer per month after fixes applied
- Zero production deployments blocked by localhost issues

## Update History

| Date | Change | Reason |
|------|--------|---------|
| 2025-07-10 | Initial creation | Post-mortem from localhost issues |
| | Added automated fixes | apply-docker-fix.sh script created |
| | Added health checks | Proactive monitoring |

## Related Documentation

- [Environment Setup Guide](environment-setup-automation.md)
- [Emergency Deployment Procedures](emergency-deployment-procedures.md)
- [Node.js Migration Checklist](nodejs-migration-checklist.md)
