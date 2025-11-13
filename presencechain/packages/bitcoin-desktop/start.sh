#!/bin/bash

# Bitcoin Desktop Application Launcher
# For Joseph Michael Rounsaville

set -e

echo "🚀 Bitcoin Full Node Desktop Application"
echo "👤 Owner: Joseph Michael Rounsaville"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Bitcoin Core is installed
check_bitcoin_core() {
    echo -e "${BLUE}Checking Bitcoin Core installation...${NC}"
    if command -v bitcoind &> /dev/null; then
        echo -e "${GREEN}✓ Bitcoin Core found: $(which bitcoind)${NC}"
        bitcoind --version | head -n 1
    else
        echo -e "${RED}✗ Bitcoin Core not found!${NC}"
        echo "Please install Bitcoin Core from: https://bitcoin.org/en/download"
        exit 1
    fi
}

# Check Node.js
check_nodejs() {
    echo -e "${BLUE}Checking Node.js installation...${NC}"
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
    else
        echo -e "${RED}✗ Node.js not found!${NC}"
        echo "Please install Node.js from: https://nodejs.org/"
        exit 1
    fi
}

# Install dependencies
install_deps() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    if [ ! -d "node_modules" ]; then
        npm install
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Dependencies already installed${NC}"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Select an option:"
    echo "1) Run in Development Mode"
    echo "2) Build Application"
    echo "3) Run Built Application"
    echo "4) Package for Distribution"
    echo "5) Check System Requirements"
    echo "6) Exit"
    echo ""
    read -p "Enter choice [1-6]: " choice

    case $choice in
        1)
            echo -e "${BLUE}Starting development mode...${NC}"
            npm run dev
            ;;
        2)
            echo -e "${BLUE}Building application...${NC}"
            npm run build
            echo -e "${GREEN}✓ Build complete${NC}"
            ;;
        3)
            echo -e "${BLUE}Starting application...${NC}"
            npm start
            ;;
        4)
            echo ""
            echo "Package for:"
            echo "1) Windows"
            echo "2) macOS"
            echo "3) Linux"
            echo "4) All platforms"
            read -p "Enter choice [1-4]: " pkg_choice

            case $pkg_choice in
                1) npm run package:win ;;
                2) npm run package:mac ;;
                3) npm run package:linux ;;
                4) npm run package ;;
                *) echo "Invalid choice" ;;
            esac
            ;;
        5)
            check_bitcoin_core
            check_nodejs
            echo ""
            echo "Storage Requirements:"
            echo "  - Minimum: 500GB free space"
            echo "  - Recommended: 1TB+"
            echo ""
            echo "RAM Requirements:"
            echo "  - Minimum: 4GB"
            echo "  - Recommended: 8GB+"
            ;;
        6)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice"
            show_menu
            ;;
    esac
}

# Main execution
main() {
    cd "$(dirname "$0")"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Bitcoin Full Node Desktop Application"
    echo "  For Joseph Michael Rounsaville"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    check_bitcoin_core
    check_nodejs
    install_deps

    show_menu
}

main
