#!/bin/bash

# Ensure WigTube servers are running
# This script is called on container attach to ensure servers start after reconnect

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if upload server is running
if pgrep -f "upload-server.js" > /dev/null; then
    echo "✅ Upload server already running"
else
    echo "🚀 Starting upload server..."
    cd "$SCRIPT_DIR"
    UPLOAD_SERVER_PORT=3001 nohup node upload-server.js > /tmp/upload-server.log 2>&1 &
    sleep 2
    if pgrep -f "upload-server.js" > /dev/null; then
        echo "✅ Upload server started on port 3001"
    else
        echo "❌ Failed to start upload server"
    fi
fi

# Auto-forward ports using VS Code API (works better than gh CLI)
if [ -n "$CODESPACE_NAME" ]; then
    # The devcontainer.json should handle port forwarding automatically
    # But we can verify it's accessible
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Upload server is accessible on port 3001"
        echo "🔗 Public URL: https://${CODESPACE_NAME}-3001.app.github.dev"
    fi
fi
