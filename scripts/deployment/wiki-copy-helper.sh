#!/bin/bash

# Wiki Copy Helper Script
# This script displays wiki content for easy copying to GitHub web interface

echo "📚 Wiki Content Copy Helper"
echo "==========================="
echo ""
echo "This script will display wiki content for easy copying."
echo "Use this with the GitHub wiki web interface."
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_menu() {
    echo "Select a wiki page to display:"
    echo "------------------------------"
    echo "1) Home Page"
    echo "2) Developer Quick Start Guide"
    echo "3) API Reference"
    echo "4) Frontend Architecture"
    echo "5) Database Schema"
    echo "6) Show deployment instructions"
    echo "7) Exit"
    echo ""
    echo -n "Enter choice [1-7]: "
}

show_deployment_instructions() {
    echo -e "${YELLOW}Wiki Deployment Instructions${NC}"
    echo "============================"
    echo ""
    echo "1. Go to: https://github.com/PrairieAster-Ai/nearest-nice-weather/wiki"
    echo "2. Click 'Create the first page' or 'New Page'"
    echo "3. Copy the content displayed by this script"
    echo "4. Paste into the wiki editor"
    echo "5. Click 'Save Page'"
    echo ""
    echo "Page Titles to Use:"
    echo "-------------------"
    echo "• Home (for the home page - use default)"
    echo "• Developer Quick Start Guide"
    echo "• API Reference"
    echo "• Frontend Architecture"
    echo "• Database Schema"
    echo ""
    echo -e "${GREEN}Press Enter to continue...${NC}"
    read
}

display_file_content() {
    local file="$1"
    local title="$2"

    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}$title${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
    echo ""
    echo "COPY EVERYTHING BELOW THIS LINE:"
    echo "--------------------------------"
    cat "$file"
    echo ""
    echo "--------------------------------"
    echo "END OF CONTENT"
    echo ""
    echo -e "${YELLOW}Instructions:${NC}"
    echo "1. Select and copy all text between the dashed lines above"
    echo "2. Go to GitHub wiki and create/edit the page"
    echo "3. Paste the content"
    echo "4. Save the page"
    echo ""
    echo -e "${GREEN}Press Enter to return to menu...${NC}"
    read
}

# Main loop
while true; do
    clear
    show_menu
    read choice

    case $choice in
        1)
            display_file_content "wiki-deployment/Home.md" "HOME PAGE CONTENT"
            ;;
        2)
            display_file_content "wiki-deployment/Developer-Quick-Start-Guide.md" "DEVELOPER QUICK START GUIDE CONTENT"
            ;;
        3)
            display_file_content "wiki-deployment/API-Reference.md" "API REFERENCE CONTENT"
            ;;
        4)
            display_file_content "wiki-deployment/Frontend-Architecture.md" "FRONTEND ARCHITECTURE CONTENT"
            ;;
        5)
            display_file_content "wiki-deployment/Database-Schema.md" "DATABASE SCHEMA CONTENT"
            ;;
        6)
            clear
            show_deployment_instructions
            ;;
        7)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${YELLOW}Invalid choice. Please select 1-7.${NC}"
            sleep 2
            ;;
    esac
done
