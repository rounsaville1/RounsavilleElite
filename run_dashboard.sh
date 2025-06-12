#!/bin/bash

# Auto-Run R-COREX Dashboard from USB
# Place this on the USB root directory

# Define expected file
DASHBOARD_FILE="RCorex_Master_Dashboard.py"

# Define mount point (typical for EXFO Linux systems)
USB_MOUNT="/media/usb"  # Adjust based on actual mount if different

# Check if file exists and run it
if [ -f "$USB_MOUNT/$DASHBOARD_FILE" ]; then
    echo "Running R-COREX Dashboard from USB..."
    python3 "$USB_MOUNT/$DASHBOARD_FILE"
else
    echo "Dashboard file not found on USB."
fi

