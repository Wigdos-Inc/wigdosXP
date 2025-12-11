#!/bin/bash

# WigTube Server Startup Script
# This script starts both the upload server and MySQL API server

echo "🚀 Starting WigTube Servers..."
echo ""

# Change to the API directory
cd "$(dirname "$0")"

# Check if MySQL is running
if ! sudo service mysql status | grep -q "running"; then
    echo "⚠️  MySQL is not running. Starting MySQL..."
    sudo service mysql start
    sleep 2
fi

# Start Upload Server (port 3001)
echo "📤 Starting Upload Server (port 3001)..."
nohup node upload-server.js > /tmp/upload-server.log 2>&1 &
UPLOAD_PID=$!
echo "   PID: $UPLOAD_PID"

# Wait a moment
sleep 1

# Start MySQL API Server (port 3002)
echo "📊 Starting MySQL API Server (port 3002)..."
nohup node mysql-api-server.js > /tmp/mysql-api.log 2>&1 &
MYSQL_PID=$!
echo "   PID: $MYSQL_PID"

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
