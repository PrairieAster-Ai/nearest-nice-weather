#!/bin/bash
# File System Permissions Validation & Fix Script
# Validates and fixes common Node.js development server permission issues

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() { echo -e "${BLUE}🔍 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_header "Node.js Development Server Permission Validator"
echo "=================================================="
echo ""

# 1. Check basic user permissions
print_header "Step 1: User & Group Validation"
USER_ID=$(id -u)
GROUP_ID=$(id -g)
USER_NAME=$(whoami)
GROUPS=$(groups)

print_info "Current user: $USER_NAME (UID: $USER_ID, GID: $GROUP_ID)"
print_info "Groups: $GROUPS"

if [[ $USER_ID -eq 0 ]]; then
    print_error "Running as root - this can cause permission issues"
    exit 1
else
    print_success "Running as non-root user"
fi

# Check if user is in docker group (common requirement)
if groups | grep -q docker; then
    print_success "User is in docker group"
else
    print_warning "User not in docker group - may need: sudo usermod -aG docker $USER_NAME"
fi

# 2. Check Node.js installation permissions
print_header "Step 2: Node.js Installation Validation"
NODE_PATH=$(which node)
NPM_PATH=$(which npm)
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

print_info "Node.js: $NODE_VERSION at $NODE_PATH"
print_info "npm: $NPM_VERSION at $NPM_PATH"

# Check if node/npm are executable
if [[ -x "$NODE_PATH" ]]; then
    print_success "Node.js is executable"
else
    print_error "Node.js is not executable: $NODE_PATH"
fi

if [[ -x "$NPM_PATH" ]]; then
    print_success "npm is executable"
else
    print_error "npm is not executable: $NPM_PATH"
fi

# 3. Check project directory permissions
print_header "Step 3: Project Directory Validation"
PROJECT_DIR=$(pwd)
print_info "Project directory: $PROJECT_DIR"

# Check if we can read/write in project directory
if [[ -r "$PROJECT_DIR" && -w "$PROJECT_DIR" ]]; then
    print_success "Project directory is readable and writable"
else
    print_error "Project directory lacks read/write permissions"
fi

# 4. Check node_modules permissions
print_header "Step 4: node_modules Validation"
if [[ -d "node_modules" ]]; then
    print_info "node_modules directory exists"

    # Check node_modules/.bin permissions
    if [[ -d "node_modules/.bin" ]]; then
        BIN_PERMS=$(ls -ld node_modules/.bin | cut -d' ' -f1)
        print_info "node_modules/.bin permissions: $BIN_PERMS"

        # Check if .bin directory is executable
        if [[ -x "node_modules/.bin" ]]; then
            print_success "node_modules/.bin is executable"
        else
            print_warning "node_modules/.bin is not executable"
        fi

        # Check key executable files
        EXECUTABLES=("vite" "npm" "npx" "node")
        for exe in "${EXECUTABLES[@]}"; do
            if [[ -f "node_modules/.bin/$exe" ]]; then
                if [[ -x "node_modules/.bin/$exe" ]]; then
                    print_success "node_modules/.bin/$exe is executable"
                else
                    print_warning "node_modules/.bin/$exe is not executable"
                fi
            fi
        done
    else
        print_warning "node_modules/.bin directory not found"
    fi
else
    print_warning "node_modules directory not found - run npm install"
fi

# 5. Check dist directory permissions (if exists)
print_header "Step 5: Build Output Validation"
if [[ -d "dist" ]]; then
    DIST_PERMS=$(ls -ld dist | cut -d' ' -f1)
    print_info "dist directory permissions: $DIST_PERMS"

    if [[ -r "dist" && -w "dist" ]]; then
        print_success "dist directory is readable and writable"
    else
        print_warning "dist directory lacks read/write permissions"
    fi
else
    print_info "dist directory not found (will be created on build)"
fi

# 6. Check temporary directory permissions
print_header "Step 6: Temporary Directory Validation"
TEMP_DIR="/tmp"
if [[ -w "$TEMP_DIR" ]]; then
    print_success "Temporary directory is writable"
else
    print_error "Temporary directory is not writable"
fi

# 7. Check for common permission issues
print_header "Step 7: Common Issue Detection"

# Check for restrictive umask
CURRENT_UMASK=$(umask)
print_info "Current umask: $CURRENT_UMASK"
if [[ "$CURRENT_UMASK" == "0077" || "$CURRENT_UMASK" == "077" ]]; then
    print_warning "Restrictive umask detected - may cause permission issues"
fi

# Check for selinux (if present)
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    print_info "SELinux status: $SELINUX_STATUS"
    if [[ "$SELINUX_STATUS" == "Enforcing" ]]; then
        print_warning "SELinux enforcing - may cause permission issues"
    fi
fi

# 8. Permission fixing section
print_header "Step 8: Permission Fixes"
echo ""
echo "The following fixes can be applied:"
echo "1. Fix node_modules permissions"
echo "2. Fix project directory permissions"
echo "3. Create proper cache directories"
echo "4. Fix npm global permissions"
echo ""

FIX_NEEDED=false

# Check if node_modules needs fixing
if [[ -d "node_modules" ]]; then
    if ! find node_modules -type f -name "*.js" -executable | head -1 | grep -q .; then
        print_warning "node_modules executables may need permission fix"
        FIX_NEEDED=true
    fi
fi

if $FIX_NEEDED; then
    read -p "Apply permission fixes? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Applying permission fixes..."

        # Fix node_modules permissions
        if [[ -d "node_modules" ]]; then
            print_info "Fixing node_modules permissions..."
            chmod -R u+rwX,g+rX,o+rX node_modules/ 2>/dev/null || {
                print_warning "Some node_modules permission fixes failed (non-critical)"
            }

            # Ensure .bin executables are executable
            if [[ -d "node_modules/.bin" ]]; then
                chmod +x node_modules/.bin/* 2>/dev/null || {
                    print_warning "Some .bin executables couldn't be made executable"
                }
            fi
        fi

        # Fix npm cache permissions
        NPM_CACHE_DIR=$(npm config get cache)
        if [[ -d "$NPM_CACHE_DIR" ]]; then
            print_info "Fixing npm cache permissions..."
            chmod -R u+rwX "$NPM_CACHE_DIR" 2>/dev/null || {
                print_warning "npm cache permission fix failed (may need sudo)"
            }
        fi

        # Create/fix npm global directory
        NPM_PREFIX=$(npm config get prefix)
        if [[ ! -d "$NPM_PREFIX/lib/node_modules" ]]; then
            print_info "Creating npm global directory..."
            mkdir -p "$NPM_PREFIX/lib/node_modules" 2>/dev/null || {
                print_warning "Could not create npm global directory"
            }
        fi

        print_success "Permission fixes applied"
    else
        print_info "Permission fixes skipped"
    fi
else
    print_success "No permission fixes needed"
fi

# 9. Final validation
print_header "Step 9: Final Validation"

# Test creating a simple Node.js server
print_info "Testing Node.js server creation..."
cat > /tmp/test-server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Permission test successful');
});
server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  console.log(`Test server on port ${port}`);
  server.close();
});
EOF

if timeout 5 node /tmp/test-server.js 2>/dev/null; then
    print_success "Node.js server creation test passed"
else
    print_error "Node.js server creation test failed"
fi

# Clean up
rm -f /tmp/test-server.js

echo ""
print_header "Permission Validation Complete"
echo "============================================"
echo ""
print_info "Next steps:"
echo "1. If fixes were applied, restart your development server"
echo "2. Try running: npm run dev"
echo "3. If issues persist, check system logs: journalctl -u docker.service"
echo "4. For persistent issues, consider: sudo systemctl restart docker"
echo ""
