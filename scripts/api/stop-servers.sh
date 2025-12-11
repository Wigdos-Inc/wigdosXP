#!/bin/bash

# WigTube Server Stop Script
# This script stops both the upload server and MySQL API server

echo "🛑 Stopping WigTube Servers..."
echo ""

# Find and kill the processes
UPLOAD_PIDS=$(ps aux | grep "node upload-server.js" | grep -v grep | awk '{print $2}')
MYSQL_PIDS=$(ps aux | grep "node mysql-api-server.js" | grep -v grep | awk '{print $2}')

if [ -n "$UPLOAD_PIDS" ]; then
    echo "📤 Stopping Upload Server..."
    kill $UPLOAD_PIDS 2>/dev/null
    echo "   ✅ Upload Server stopped (PIDs: $UPLOAD_PIDS)"
else
    echo "   ⚠️  Upload Server not running"
fi

if [ -n "$MYSQL_PIDS" ]; then
    echo "📊 Stopping MySQL API Server..."
    kill $MYSQL_PIDS 2>/dev/null
    echo "   ✅ MySQL API Server stopped (PIDs: $MYSQL_PIDS)"
else
    echo "   ⚠️  MySQL API Server not running"
fi

echo ""
echo "✨ All WigTube servers stopped"
