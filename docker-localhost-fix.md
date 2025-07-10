# Docker Localhost Networking Fix & Prevention

## Current Issue
Docker v28.3.1 causing localhost connection refused errors after system restart, interfering with development servers (Vite, Node.js, etc.).

## Root Cause Analysis
- Docker bridge network `172.17.0.0/16` conflicts with localhost binding
- No custom daemon.json configuration 
- Default Docker networking interfering with local development

## Immediate Fix

### 1. Restart Docker Service Properly
```bash
# Stop Docker and socket
sudo systemctl stop docker.socket
sudo systemctl stop docker

# Clean up network interfaces
sudo ip link delete docker0 2>/dev/null || true

# Restart Docker
sudo systemctl start docker
sudo systemctl start docker.socket

# Verify status
sudo systemctl status docker
```

### 2. Create Custom Docker Configuration
```bash
# Create daemon.json with custom bridge IP
sudo tee /etc/docker/daemon.json <<EOF
{
  "bip": "172.31.0.1/24",
  "default-address-pools": [
    {
      "base": "172.31.0.0/16",
      "size": 24
    }
  ],
  "ip-forward": true,
  "iptables": true,
  "storage-driver": "overlay2"
}
EOF

# Restart Docker to apply changes
sudo systemctl restart docker
```

## Long-term Prevention

### 1. Update Docker to Latest Stable
```bash
# Update Docker CE to latest stable
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin

# Verify update
docker --version
```

### 2. Configure Development Environment
```bash
# Add user to docker group (if not already)
sudo usermod -aG docker $USER

# Create development-specific Docker network
docker network create --driver bridge \
  --subnet=172.31.1.0/24 \
  --gateway=172.31.1.1 \
  dev-network
```

### 3. Development Server Startup Script
```bash
# Add to dev-startup.sh
echo "# Docker health check" >> dev-startup.sh
echo "if ! docker network ls | grep -q dev-network; then" >> dev-startup.sh
echo "  docker network create --driver bridge --subnet=172.31.1.0/24 dev-network" >> dev-startup.sh
echo "fi" >> dev-startup.sh
```

## Monitoring & Troubleshooting

### Quick Health Check
```bash
# Test localhost binding
node -e "
const http = require('http');
const server = http.createServer((req, res) => res.end('OK'));
server.listen(3999, '127.0.0.1', () => {
  console.log('✅ Localhost binding works');
  server.close();
});
"

# Check Docker networks
docker network ls
ip route | grep docker
```

### Debug Commands
```bash
# Check Docker daemon logs
sudo journalctl -u docker.service --since "1 hour ago"

# Check iptables rules
sudo iptables -L -n | grep docker

# Test port binding
ss -tulpn | grep :300
```

## Update Schedule

### Automated Updates
```bash
# Add to crontab for weekly Docker updates
echo "0 2 * * 0 /usr/bin/apt update && /usr/bin/apt upgrade -y docker-ce docker-ce-cli" | sudo crontab -
```

### Manual Update Procedure
```bash
# Before updating Docker
docker ps -a  # Note running containers
docker images # Note images in use

# Update Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# Verify localhost works after update
curl -s http://localhost:3999/ || echo "❌ Localhost broken after update"
```

## Emergency Recovery

If localhost breaks after Docker update:
```bash
# Nuclear option: Reset Docker networking
sudo systemctl stop docker
sudo rm -rf /var/lib/docker/network
sudo systemctl start docker

# Test localhost immediately
npm run dev
```

## Integration with CLAUDE.md

Add to project documentation:
```markdown
**Docker Localhost Fix**: If development servers fail with "connection refused":
1. Run: `sudo systemctl restart docker`
2. Test: `curl http://localhost:3001/`
3. If still broken: See `docker-localhost-fix.md`
```