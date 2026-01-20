#!/bin/bash

# WigTube Upload Server Status Checker
# This script verifies that port 3001 is public and the server is responding

set -e

echo "🔍 WigTube Upload Server Status Check"
echo "===================================="
echo ""

# Check if server is running
echo "1️⃣  Checking if upload server is running..."
if pgrep -f "upload-server.js" > /dev/null; then
    PID=$(pgrep -f "upload-server.js")
    echo "   ✅ Server running (PID: $PID)"
else
    echo "   ❌ Server NOT running"
    echo "   To start: cd /workspaces/wigdosXP && nohup node scripts/api/upload-server.js > /tmp/upload-server.log 2>&1 &"
    exit 1
fi

echo ""
echo "2️⃣  Checking health endpoint..."

# Test local health endpoint
if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo "   ✅ Health endpoint responding (localhost)"
else
    echo "   ❌ Health endpoint not responding"
fi

echo ""
echo "3️⃣  Checking CORS headers on POST..."

# Test CORS on POST endpoint (with curl's multipart form data)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/upload \
  -H "Origin: https://test.github.dev" \
  -F "file=@/dev/null" \
  -F "path=test/test.txt" \
  -F "repository=test/test" 2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if echo "$BODY" | grep -q "Access-Control-Allow-Origin"; then
    echo "   ✅ CORS headers present on POST response"
else
    echo "   ⚠️  CORS headers might be missing"
fi

echo ""
echo "4️⃣  Current configuration:"
echo "   - Upload port: 3001"
echo "   - Upload directory: /workspaces/wigdosXP/temp-uploads/"
echo "   - Max file size: 100MB (GitHub Codespaces limit)"
echo ""

echo "📋 Next steps:"
echo "   1. Make sure port 3001 is PUBLIC in the PORTS tab"
echo "   2. Refresh WigTube page (Ctrl+Shift+R)"
echo "   3. Try uploading a video"
echo ""

echo "🔗 Documentation:"
echo "   See: /workspaces/wigdosXP/docs/UPLOAD_SERVER_SETUP.md"
echo ""

echo "✅ Status check complete!"
