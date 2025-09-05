#!/bin/bash

# Comprehensive Development Environment Health Check
# Uses Claude Intelligence Suite for enhanced monitoring

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

HEALTH_SCORE=0
MAX_SCORE=100

print_header() {
    echo -e "${BLUE}"
    echo "🏥 Nearest Nice Weather - Development Environment Health Check"
    echo "=============================================================="
    echo -e "${NC}"
    echo "Generated: $(date)"
    echo "Intelligence Source: Claude Intelligence Suite"
    echo ""
}

print_score() {
    local score=$1
    local max=$2
    local percentage=$((score * 100 / max))

    if [ $percentage -ge 90 ]; then
        echo -e "${GREEN}🏆 EXCELLENT: $score/$max ($percentage%)${NC}"
    elif [ $percentage -ge 80 ]; then
        echo -e "${GREEN}⭐ GOOD: $score/$max ($percentage%)${NC}"
    elif [ $percentage -ge 70 ]; then
        echo -e "${YELLOW}⚠️ FAIR: $score/$max ($percentage%)${NC}"
    else
        echo -e "${RED}❌ NEEDS ATTENTION: $score/$max ($percentage%)${NC}"
    fi
}

check_service() {
    local name=$1
    local url=$2
    local points=$3

    if curl -s "$url" >/dev/null 2>&1; then
        echo -e "   ✅ $name: ${GREEN}Running${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + points))
        return 0
    else
        echo -e "   ❌ $name: ${RED}Not responding${NC}"
        return 1
    fi
}

check_database() {
    local name=$1
    local command=$2
    local points=$3

    if eval "$command" >/dev/null 2>&1; then
        echo -e "   ✅ $name: ${GREEN}Connected${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + points))
        return 0
    else
        echo -e "   ❌ $name: ${RED}Connection failed${NC}"
        return 1
    fi
}

get_intelligence_data() {
    if curl -s http://localhost:3050/health >/dev/null 2>&1; then
        local system_data=$(curl -s http://localhost:3052/system-resources 2>/dev/null)
        local context_data=$(curl -s http://localhost:3058/business-context 2>/dev/null)

        # Extract CPU and memory data
        if [ ! -z "$system_data" ]; then
            CPU_USAGE=$(echo "$system_data" | jq -r '.cpu.usage // "N/A"')
            MEMORY_USAGE=$(echo "$system_data" | jq -r '.memory.percentage // "N/A"')
            CPU_CORES=$(echo "$system_data" | jq -r '.cpu.cores // "N/A"')
            MEMORY_TOTAL=$(echo "$system_data" | jq -r '.memory.total // "N/A"')
        fi

        # Extract recommendations
        if [ ! -z "$context_data" ]; then
            RECOMMENDATIONS=$(echo "$context_data" | jq -r '.recommendations[]' 2>/dev/null | head -3)
        fi
    fi
}

print_header

echo "📊 CORE DEVELOPMENT SERVICES"
echo "=============================="

# Check core services
check_service "Frontend (Vite)" "http://localhost:3001/" 20
check_service "API Server" "http://localhost:4000/api/health" 20
check_service "API Proxy" "http://localhost:3001/api/weather-locations?limit=1" 15

echo ""
echo "🗄️ DATABASE SERVICES"
echo "===================="

# Check database
check_database "PostgreSQL (Local)" "docker exec weather-postgres psql -U postgres -d weather_intelligence -c 'SELECT 1;'" 15

echo ""
echo "🧠 INTELLIGENCE MONITORING"
echo "=========================="

# Check intelligence services
check_service "Intelligence Suite" "http://localhost:3050/health" 10
check_service "System Monitor" "http://localhost:3052/system-resources" 5
check_service "Context API" "http://localhost:3058/business-context" 5

# Git intelligence is problematic, so we'll check differently
if curl -s http://localhost:3050/status | jq -r '.tools[] | select(.key=="git") | .status' 2>/dev/null | grep -q "running"; then
    echo -e "   ✅ Git Intelligence: ${GREEN}Running${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 5))
else
    echo -e "   ⚠️ Git Intelligence: ${YELLOW}Stopped (known issue)${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 2))  # Partial credit
fi

echo ""
echo "💾 RESOURCE ANALYSIS"
echo "===================="

# Get intelligence data
get_intelligence_data

if [ "$CPU_USAGE" != "N/A" ]; then
    echo -e "   CPU Usage: $CPU_USAGE% (${CPU_CORES} cores)"
    if [ "$CPU_USAGE" -lt 80 ]; then
        echo -e "   ✅ CPU: ${GREEN}Healthy${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + 5))
    else
        echo -e "   ⚠️ CPU: ${YELLOW}High utilization${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + 2))
    fi
else
    echo -e "   ❌ CPU: ${RED}Data unavailable${NC}"
fi

if [ "$MEMORY_USAGE" != "N/A" ]; then
    echo -e "   Memory Usage: $MEMORY_USAGE% (${MEMORY_TOTAL}MB total)"
    if [ "$MEMORY_USAGE" -lt 70 ]; then
        echo -e "   ✅ Memory: ${GREEN}Excellent${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + 5))
    else
        echo -e "   ⚠️ Memory: ${YELLOW}Moderate usage${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + 3))
    fi
else
    echo -e "   ❌ Memory: ${RED}Data unavailable${NC}"
fi

echo ""
echo "🎯 INTELLIGENT RECOMMENDATIONS"
echo "==============================="

if [ ! -z "$RECOMMENDATIONS" ]; then
    echo "$RECOMMENDATIONS" | while read -r rec; do
        echo "   💡 $rec"
    done
    echo ""
else
    echo "   📋 Enable Context API for intelligent recommendations"
    echo ""
fi

echo "🏥 OVERALL HEALTH ASSESSMENT"
echo "============================="

print_score $HEALTH_SCORE $MAX_SCORE

echo ""
echo "📋 SUMMARY"
echo "=========="

if [ $HEALTH_SCORE -ge 90 ]; then
    echo -e "${GREEN}🎉 Your development environment is in excellent condition!${NC}"
    echo "   All critical services are running optimally."
elif [ $HEALTH_SCORE -ge 80 ]; then
    echo -e "${GREEN}👍 Your development environment is in good condition.${NC}"
    echo "   Minor optimizations available."
elif [ $HEALTH_SCORE -ge 70 ]; then
    echo -e "${YELLOW}⚠️ Your development environment needs some attention.${NC}"
    echo "   Several services may need restart or configuration."
else
    echo -e "${RED}🚨 Your development environment needs immediate attention.${NC}"
    echo "   Critical services are not responding."
fi

echo ""
echo "🛠️ QUICK ACTIONS"
echo "================"
echo "   🔄 Restart all: ./dev-startup.sh"
echo "   🧠 Start intelligence: ./start-intelligence-tools.sh"
echo "   📊 Detailed status: curl http://localhost:3050/status | jq ."
echo "   🗄️ Database shell: docker exec -it weather-postgres psql -U postgres -d weather_intelligence"

exit 0
