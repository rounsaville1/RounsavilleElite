#!/bin/bash
# Bluetooth Control System - Startup Script

echo "🔵 Starting Bluetooth Control System..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "   Install with: brew install python3 (macOS) or apt-get install python3 (Linux)"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check Bluetooth permissions (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected - checking Bluetooth permissions..."
    echo "   Make sure Terminal has Bluetooth permissions in System Preferences"
fi

# Check Bluetooth permissions (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Linux detected - checking Bluetooth permissions..."
    if ! groups | grep -q bluetooth; then
        echo "⚠️  User not in 'bluetooth' group"
        echo "   Add with: sudo usermod -a -G bluetooth $USER"
        echo "   Then log out and back in"
    fi
fi

# Create config if doesn't exist
if [ ! -f "config.yaml" ]; then
    echo "⚙️  Creating default config..."
    cat > config.yaml << 'EOF'
bluetooth:
  scan_interval: 30
  auto_reconnect: true
  connection_timeout: 10
  max_devices: 20

transitional_control:
  default_duration: 2.0
  default_easing: "ease-in-out"
  frame_rate: 30

automation:
  enabled: true
  location:
    latitude: 37.7749
    longitude: -122.4194
  timezone: "America/Los_Angeles"

server:
  host: "0.0.0.0"
  port: 8080
  websocket_port: 8081

logging:
  level: "INFO"
  file: "bluetooth_control.log"
EOF
fi

# Start the system
echo ""
echo "🚀 Starting Bluetooth Control System..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   Dashboard: http://localhost:8080/index.html"
echo "   API:       http://localhost:8080/api/status"
echo "   WebSocket: ws://localhost:8081"
echo ""
echo "   Press Ctrl+C to stop"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd src && python3 web_server.py

# Deactivate on exit
deactivate
