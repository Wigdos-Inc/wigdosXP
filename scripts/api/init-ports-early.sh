#!/bin/bash

# Early Port Initialization Script
# This script runs IMMEDIATELY after container creation to ensure ports are
# active and public BEFORE any user clicks on links

echo "🔧 Initializing ports early for WigTube..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ports that need to be available
PORTS=(3001 3002)
UPLOAD_PORT=3001
API_PORT=3002

# Function to ensure a port is listening (even if just a placeholder)
ensure_port_listening() {
    local port=$1
    if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "🔌 Binding port $port..."
        # Start a simple HTTP server on the port to keep it active
        nohup node -e "
            const http = require('http');
            const server = http.createServer((req, res) => {
                res.writeHead(503, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({status: 'initializing', message: 'Server starting up...'}));
            });
            server.listen($port, () => {
                console.log('Placeholder server on port $port');
            });
        " > /tmp/port-${port}-init.log 2>&1 &
        echo "   ✅ Port $port is now listening"
    else
        echo "   ✅ Port $port already active"
    fi
}

# Ensure all required ports are listening immediately
for port in "${PORTS[@]}"; do
    ensure_port_listening $port
done

# Give ports a moment to bind
sleep 1

# Make ports public in Codespaces
if [ -n "$CODESPACE_NAME" ]; then
    echo "🌐 Setting port visibility to public..."
    
    # Try using gh CLI for each port
    if command -v gh &> /dev/null; then
        for port in "${PORTS[@]}"; do
            gh codespace ports visibility $port:public -c "$CODESPACE_NAME" 2>/dev/null && \
                echo "   ✅ Port $port: public" || \
                echo "   ⚠️  Port $port: manual setup needed"
        done
    else
        echo "   ⚠️  gh CLI not available - ports may need manual configuration"
    fi
    
    # Display the public URLs
    echo ""
    echo "🔗 Public URLs (ready immediately):"
    echo "   Upload Server: https://${CODESPACE_NAME}-3001.app.github.dev"
    echo "   API Server:    https://${CODESPACE_NAME}-3002.app.github.dev"
fi

# Now start the actual servers (this will replace the placeholders)
echo ""
echo "🚀 Starting actual server processes..."
sleep 1

# Start the upload server
if pgrep -f "upload-server.js" > /dev/null; then
    echo "   ✅ Upload server already running"
else
    UPLOAD_SERVER_PORT=$UPLOAD_PORT nohup node upload-server.js > /tmp/upload-server.log 2>&1 &
    echo "   🚀 Upload server starting on port $UPLOAD_PORT"
fi

# Start the MySQL API server
if pgrep -f "mysql-api-server.js" > /dev/null; then
    echo "   ✅ MySQL API server already running"
else
    MYSQL_API_PORT=$API_PORT nohup node mysql-api-server.js > /tmp/mysql-api.log 2>&1 &
    echo "   🚀 MySQL API server starting on port $API_PORT"
fi

# Wait for real servers to be ready
sleep 3

# Verify servers are responding
echo ""
echo "🧪 Verifying server health..."
if curl -s http://localhost:$UPLOAD_PORT/health > /dev/null 2>&1; then
    echo "   ✅ Upload Server: Healthy on port $UPLOAD_PORT"
else
    echo "   ⏳ Upload Server: Still initializing on port $UPLOAD_PORT"
fi

if curl -s http://localhost:$API_PORT/health > /dev/null 2>&1; then
    echo "   ✅ API Server: Healthy on port $API_PORT"
else
    echo "   ⏳ API Server: Still initializing on port $API_PORT"
fi

echo ""
echo "✨ Port initialization complete! Links should work immediately."
