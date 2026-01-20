#!/bin/bash

# WigTube Server Startup Script
# This script starts both the upload server and MySQL API server
# Prevents duplicate server instances
# Supports custom ports via environment variables

echo "🚀 Starting WigTube Servers..."
echo ""

# Change to the API directory
cd "$(dirname "$0")"

# Set default ports (can be overridden with env vars)
UPLOAD_SERVER_PORT=${UPLOAD_SERVER_PORT:-3001}
MYSQL_API_PORT=${MYSQL_API_PORT:-3002}

echo "🔧 Configuration:"
echo "   Upload Server Port: $UPLOAD_SERVER_PORT (set via UPLOAD_SERVER_PORT env var)"
echo "   MySQL API Port: $MYSQL_API_PORT (set via MYSQL_API_PORT env var)"
echo ""

# Function to find available port starting from given port
find_available_port() {
    local start_port=$1
    local port=$start_port
    while [ $port -lt $((start_port + 100)) ]; do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo $port
            return 0
        fi
        port=$((port + 1))
    done
    echo $start_port  # fallback
    return 1
}

# Check if upload server is already running on the configured port
if curl -s http://localhost:$UPLOAD_SERVER_PORT/health > /dev/null 2>&1; then
    echo "✅ Upload Server already running on port $UPLOAD_SERVER_PORT"
    UPLOAD_ALREADY_RUNNING=true
else
    UPLOAD_ALREADY_RUNNING=false
    # Check if port is occupied by something else
    if lsof -Pi :$UPLOAD_SERVER_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $UPLOAD_SERVER_PORT is occupied by another process"
        NEW_PORT=$(find_available_port $((UPLOAD_SERVER_PORT + 1)))
        echo "   🔄 Will use alternative port: $NEW_PORT"
        UPLOAD_SERVER_PORT=$NEW_PORT
    fi
fi

# Check if MySQL API server is already running
if curl -s http://localhost:$MYSQL_API_PORT/health > /dev/null 2>&1; then
    echo "✅ MySQL API Server already running on port $MYSQL_API_PORT"
    MYSQL_ALREADY_RUNNING=true
else
    MYSQL_ALREADY_RUNNING=false
    # Check if port is occupied by something else
    if lsof -Pi :$MYSQL_API_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $MYSQL_API_PORT is occupied by another process"
        NEW_PORT=$(find_available_port $((MYSQL_API_PORT + 1)))
        echo "   🔄 Will use alternative port: $NEW_PORT"
        MYSQL_API_PORT=$NEW_PORT
    fi
fi

# If both are running, exit
if [ "$UPLOAD_ALREADY_RUNNING" = true ] && [ "$MYSQL_ALREADY_RUNNING" = true ]; then
    echo ""
    echo "✨ All servers are already running!"
    exit 0
fi

# Clone external video repository if it doesn't exist
if [ ! -d "/workspaces/Videoswigtube-EEEEEE" ]; then
    echo "📦 Cloning external video repository..."
    cd /workspaces && git clone https://github.com/Danie-GLR/Videoswigtube-EEEEEE.git
    cd /workspaces/Videoswigtube-EEEEEE
    git config user.name "Danie-GLR"
    git config user.email "danie@wigtube.com"
    git remote set-url origin https://$GITHUB_TOKEN@github.com/Danie-GLR/Videoswigtube-EEEEEE.git
    echo "✅ External video repository ready"
    cd "$(dirname "$0")"
fi

# Start Upload Server if not running
if [ "$UPLOAD_ALREADY_RUNNING" = false ]; then
    echo "📤 Starting Upload Server on port $UPLOAD_SERVER_PORT..."
    UPLOAD_SERVER_PORT=$UPLOAD_SERVER_PORT nohup node upload-server.js > /tmp/upload-server.log 2>&1 &
    UPLOAD_PID=$!
    echo "   PID: $UPLOAD_PID"
    sleep 1
fi

# Start MySQL API Server if not running
if [ "$MYSQL_ALREADY_RUNNING" = false ]; then
    echo "📊 Starting MySQL API Server on port $MYSQL_API_PORT..."
    MYSQL_API_PORT=$MYSQL_API_PORT nohup node mysql-api-server.js > /tmp/mysql-api.log 2>&1 &
    MYSQL_PID=$!
    echo "   PID: $MYSQL_PID"
    sleep 1
fi

# Wait for servers to start
sleep 2

# Attempt to make port 3001 public automatically (only in Codespaces)
if [ -n "$CODESPACE_NAME" ]; then
    echo ""
    echo "🔓 Attempting to make port $UPLOAD_SERVER_PORT public..."
    if command -v gh &> /dev/null; then
        if gh codespace ports visibility $UPLOAD_SERVER_PORT:public -c "$CODESPACE_NAME" 2>/dev/null; then
            echo "   ✅ Port $UPLOAD_SERVER_PORT is now public"
        else
            echo "   ⚠️  Could not automatically set port visibility"
            echo "   📋 Manually set port $UPLOAD_SERVER_PORT to public in the PORTS tab"
        fi
    else
        echo "   ⚠️  gh CLI not available"
        echo "   📋 Manually set port $UPLOAD_SERVER_PORT to public in the PORTS tab"
    fi
fi

# Test the servers
echo ""
echo "🧪 Testing servers..."

# Test Upload Server
if curl -s http://localhost:$UPLOAD_SERVER_PORT/health > /dev/null 2>&1; then
    echo "   ✅ Upload Server: Running on port $UPLOAD_SERVER_PORT"
else
    echo "   ❌ Upload Server: Failed to start on port $UPLOAD_SERVER_PORT"
fi

# Test MySQL API Server
if curl -s http://localhost:$MYSQL_API_PORT/health > /dev/null 2>&1; then
    echo "   ✅ MySQL API Server: Running on port $MYSQL_API_PORT"
else
    echo "   ❌ MySQL API Server: Failed to start on port $MYSQL_API_PORT"
fi

echo ""
echo "📋 Server PIDs saved to:"
echo "   Upload Server: $UPLOAD_PID (port $UPLOAD_SERVER_PORT)"
echo "   MySQL API Server: $MYSQL_PID (port $MYSQL_API_PORT)"
echo ""
echo "📝 Logs available at:"
echo "   Upload Server: /tmp/upload-server.log"
echo "   MySQL API Server: /tmp/mysql-api.log"
echo ""
echo "💾 Port configuration saved for WigTube frontend"
echo "   Upload Port: $UPLOAD_SERVER_PORT (use localStorage.setItem('wigtubeUploadPort', '$UPLOAD_SERVER_PORT'))"
echo ""
echo "🛑 To stop the servers, run:"
echo "   kill $UPLOAD_PID $MYSQL_PID"
echo ""
echo "✨ WigTube servers are ready!"
