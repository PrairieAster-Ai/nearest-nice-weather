#!/bin/bash

# Claude Intelligence Suite - Universal Installer
# Portable deployment for any project

set -e

SUITE_VERSION="1.0.0"
BASE_URL="https://raw.githubusercontent.com/claude-ai/intelligence-suite/main"
INSTALL_DIR="."
GLOBAL_INSTALL=false
PROJECT_NAME=""
BASE_PORT=3050

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print banner
print_banner() {
    echo -e "${BLUE}"
    echo "🧠 Claude Intelligence Suite Installer"
    echo "======================================"
    echo -e "${NC}"
    echo "Minimize productivity degradation through contextual data access"
    echo "Version: $SUITE_VERSION"
    echo ""
}

# Show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -g, --global         Install globally (requires npm)"
    echo "  -d, --directory DIR  Install to specific directory"
    echo "  -p, --project NAME   Set project name"
    echo "  -b, --base-port PORT Set base port (default: 3050)"
    echo "  --npm                Install via NPM package"
    echo "  --direct             Download portable script directly"
    echo ""
    echo "Examples:"
    echo "  $0                           # Install in current directory"
    echo "  $0 -g                        # Global install via NPM"
    echo "  $0 -d /opt/claude            # Install to /opt/claude"
    echo "  $0 -p my-project -b 4000     # Set project name and base port"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed"
        echo "Please install Node.js from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

    if [ "$MAJOR_VERSION" -lt 14 ]; then
        print_error "Node.js version 14 or higher is required (current: $NODE_VERSION)"
        exit 1
    fi

    print_success "Node.js $NODE_VERSION found"

    # Check npm for global install
    if [ "$GLOBAL_INSTALL" = true ]; then
        if ! command -v npm &> /dev/null; then
            print_error "NPM is required for global installation"
            exit 1
        fi
        print_success "NPM found"
    fi

    # Check curl for direct download
    if [ "$GLOBAL_INSTALL" = false ]; then
        if ! command -v curl &> /dev/null; then
            print_error "curl is required for direct download"
            exit 1
        fi
        print_success "curl found"
    fi
}

# Detect project information
detect_project() {
    print_status "Detecting project information..."

    # Detect project name if not provided
    if [ -z "$PROJECT_NAME" ]; then
        if [ -f "package.json" ]; then
            PROJECT_NAME=$(grep '"name"' package.json | cut -d'"' -f4 | head -1)
            print_status "Detected project name from package.json: $PROJECT_NAME"
        elif [ -d ".git" ]; then
            REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
            if [ ! -z "$REMOTE_URL" ]; then
                PROJECT_NAME=$(basename "$REMOTE_URL" .git)
                print_status "Detected project name from git: $PROJECT_NAME"
            fi
        fi

        if [ -z "$PROJECT_NAME" ]; then
            PROJECT_NAME=$(basename "$(pwd)")
            print_status "Using directory name as project: $PROJECT_NAME"
        fi
    fi

    # Detect project type
    PROJECT_TYPE="Generic"
    if [ -f "package.json" ]; then
        if grep -q "react" package.json; then
            PROJECT_TYPE="React"
        elif grep -q "vue" package.json; then
            PROJECT_TYPE="Vue"
        elif grep -q "angular" package.json; then
            PROJECT_TYPE="Angular"
        elif grep -q "next" package.json; then
            PROJECT_TYPE="Next.js"
        elif grep -q "express" package.json; then
            PROJECT_TYPE="Express"
        else
            PROJECT_TYPE="Node.js"
        fi
    elif [ -f "requirements.txt" ] || [ -f "setup.py" ]; then
        PROJECT_TYPE="Python"
    elif [ -f "Cargo.toml" ]; then
        PROJECT_TYPE="Rust"
    elif [ -f "go.mod" ]; then
        PROJECT_TYPE="Go"
    elif [ -f "pom.xml" ]; then
        PROJECT_TYPE="Java"
    fi

    print_success "Project type detected: $PROJECT_TYPE"
}

# Check port availability
check_ports() {
    print_status "Checking port availability..."

    PORTS_NEEDED=10
    for i in $(seq 0 $((PORTS_NEEDED - 1))); do
        PORT=$((BASE_PORT + i))
        if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $PORT is in use"
        fi
    done

    print_status "Base port: $BASE_PORT (will use ports $BASE_PORT-$((BASE_PORT + PORTS_NEEDED - 1)))"
}

# Install via NPM
install_npm() {
    print_status "Installing Claude Intelligence Suite via NPM..."

    if [ "$GLOBAL_INSTALL" = true ]; then
        print_status "Installing globally..."
        npm install -g @claude-ai/intelligence-suite
        print_success "Global installation complete"
        echo ""
        echo "Usage:"
        echo "  cd your-project"
        echo "  claude-intelligence"
    else
        print_status "Installing locally..."
        npm install @claude-ai/intelligence-suite
        print_success "Local installation complete"
        echo ""
        echo "Usage:"
        echo "  npx @claude-ai/intelligence-suite"
    fi
}

# Install via direct download
install_direct() {
    print_status "Downloading Claude Intelligence Suite..."

    # Create install directory
    if [ "$INSTALL_DIR" != "." ]; then
        mkdir -p "$INSTALL_DIR"
    fi

    # Download main script
    SCRIPT_PATH="$INSTALL_DIR/claude-intelligence-suite.js"
    curl -fsSL "$BASE_URL/claude-intelligence-suite-portable.js" -o "$SCRIPT_PATH"
    chmod +x "$SCRIPT_PATH"

    # Download configuration template
    CONFIG_PATH="$INSTALL_DIR/claude-intelligence-config.js"
    cat > "$CONFIG_PATH" << EOF
// Claude Intelligence Suite Configuration
// Customize these settings for your project

module.exports = {
  projectName: '$PROJECT_NAME',
  basePort: $BASE_PORT,
  enabledTools: ['system', 'git', 'context'],
  logLevel: 'info',
  autoDetectServices: true,

  // Uncomment to customize data directory
  // dataDir: '/custom/data/path',

  // Uncomment to disable specific tools
  // enabledTools: ['system', 'context'], // Skip git, database
};
EOF

    # Create startup script
    STARTUP_PATH="$INSTALL_DIR/start-claude-intelligence.sh"
    cat > "$STARTUP_PATH" << EOF
#!/bin/bash
# Claude Intelligence Suite Startup Script

cd "\$(dirname "\$0")"

# Load configuration
export PROJECT_NAME="$PROJECT_NAME"
export BASE_PORT=$BASE_PORT

echo "🧠 Starting Claude Intelligence Suite..."
echo "Project: $PROJECT_NAME"
echo "Type: $PROJECT_TYPE"
echo "Dashboard: http://localhost:$BASE_PORT"
echo ""

node claude-intelligence-suite.js
EOF
    chmod +x "$STARTUP_PATH"

    print_success "Direct installation complete"
    echo ""
    echo "Files installed:"
    echo "  $SCRIPT_PATH"
    echo "  $CONFIG_PATH"
    echo "  $STARTUP_PATH"
    echo ""
    echo "Usage:"
    echo "  $STARTUP_PATH"
    echo "  # OR"
    echo "  node $SCRIPT_PATH"
}

# Create systemd service (Linux only)
create_systemd_service() {
    if [ "$(uname)" = "Linux" ] && command -v systemctl &> /dev/null; then
        print_status "Creating systemd service..."

        SERVICE_PATH="/etc/systemd/system/claude-intelligence.service"
        WORKING_DIR="$(pwd)"

        sudo tee "$SERVICE_PATH" > /dev/null << EOF
[Unit]
Description=Claude Intelligence Suite
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$WORKING_DIR
ExecStart=node $WORKING_DIR/claude-intelligence-suite.js
Restart=always
Environment=PROJECT_NAME=$PROJECT_NAME
Environment=BASE_PORT=$BASE_PORT

[Install]
WantedBy=multi-user.target
EOF

        sudo systemctl daemon-reload
        print_success "Systemd service created: $SERVICE_PATH"
        echo ""
        echo "Service commands:"
        echo "  sudo systemctl start claude-intelligence"
        echo "  sudo systemctl enable claude-intelligence  # Auto-start on boot"
        echo "  sudo systemctl status claude-intelligence"
    fi
}

# Show post-install information
show_post_install() {
    echo ""
    print_success "🎉 Claude Intelligence Suite installation complete!"
    echo ""
    echo "📋 Project Information:"
    echo "  Name: $PROJECT_NAME"
    echo "  Type: $PROJECT_TYPE"
    echo "  Directory: $(pwd)"
    echo ""
    echo "🌐 Access Points:"
    echo "  Dashboard: http://localhost:$BASE_PORT"
    echo "  WebSocket: ws://localhost:$((BASE_PORT + 1))"
    echo "  API: http://localhost:$BASE_PORT/status"
    echo ""
    echo "🚀 Quick Start:"
    if [ "$GLOBAL_INSTALL" = true ]; then
        echo "  claude-intelligence"
    elif [ -f "./start-claude-intelligence.sh" ]; then
        echo "  ./start-claude-intelligence.sh"
    else
        echo "  npx @claude-ai/intelligence-suite"
    fi
    echo ""
    echo "📚 Documentation:"
    echo "  https://github.com/claude-ai/intelligence-suite"
    echo ""
    echo "🆘 Support:"
    echo "  https://github.com/claude-ai/intelligence-suite/issues"
    echo ""
}

# Main installation logic
main() {
    print_banner

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -g|--global)
                GLOBAL_INSTALL=true
                shift
                ;;
            -d|--directory)
                INSTALL_DIR="$2"
                shift 2
                ;;
            -p|--project)
                PROJECT_NAME="$2"
                shift 2
                ;;
            -b|--base-port)
                BASE_PORT="$2"
                shift 2
                ;;
            --npm)
                INSTALL_METHOD="npm"
                shift
                ;;
            --direct)
                INSTALL_METHOD="direct"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Set default install method
    if [ -z "$INSTALL_METHOD" ]; then
        if [ "$GLOBAL_INSTALL" = true ]; then
            INSTALL_METHOD="npm"
        else
            INSTALL_METHOD="direct"
        fi
    fi

    # Run installation steps
    check_prerequisites
    detect_project
    check_ports

    case $INSTALL_METHOD in
        npm)
            install_npm
            ;;
        direct)
            install_direct
            create_systemd_service
            ;;
        *)
            print_error "Invalid install method: $INSTALL_METHOD"
            exit 1
            ;;
    esac

    show_post_install
}

# Run main function
main "$@"
