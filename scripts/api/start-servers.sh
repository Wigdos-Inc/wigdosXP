#!/bin/bash

# WigTube Server Startup Script
# This script starts both the upload server and MySQL API server
# Prevents duplicate server instances

echo "🚀 Starting WigTube Servers..."
echo ""

# Change to the API directory
cd "$(dirname "$0")"

# Check if upload server is already running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Upload Server already running on port 3001"
    UPLOAD_ALREADY_RUNNING=true
else
    UPLOAD_ALREADY_RUNNING=false
fi

# Check if MySQL API server is already running
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ MySQL API Server already running on port 3002"
    MYSQL_ALREADY_RUNNING=true
else
    MYSQL_ALREADY_RUNNING=false
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

# Start Upload Server (port 3001) if not running
if [ "$UPLOAD_ALREADY_RUNNING" = false ]; then
    echo "📤 Starting Upload Server (port 3001)..."
    nohup node upload-server.js > /tmp/upload-server.log 2>&1 &
    UPLOAD_PID=$!
    echo "   PID: $UPLOAD_PID"
    sleep 1
fi

# Start MySQL API Server (port 3002) if not running
if [ "$MYSQL_ALREADY_RUNNING" = false ]; then
    echo "📊 Starting MySQL API Server (port 3002)..."
    nohup node mysql-api-server.js > /tmp/mysql-api.log 2>&1 &
    MYSQL_PID=$!
    echo "   PID: $MYSQL_PID"
    sleep 1
fi

# Wait for servers to start
sleep 2

# Test the servers
echo ""
echo "🧪 Testing servers..."

# Test Upload Server
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "   ✅ Upload Server: Running"
else
    echo "   ❌ Upload Server: Failed to start"
fi

# Test MySQL API Server
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "   ✅ MySQL API Server: Running"
else
    echo "   ❌ MySQL API Server: Failed to start"
fi

echo ""
echo "📋 Server PIDs saved to:"
echo "   Upload Server: $UPLOAD_PID"
echo "   MySQL API Server: $MYSQL_PID"
echo ""
echo "📝 Logs available at:"
echo "   Upload Server: /tmp/upload-server.log"
echo "   MySQL API Server: /tmp/mysql-api.log"
echo ""
echo "🛑 To stop the servers, run:"
echo "   kill $UPLOAD_PID $MYSQL_PID"
echo ""
echo "✨ WigTube servers are ready!"
