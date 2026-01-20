# Dynamic Port Configuration for WigTube Servers

## Overview

The WigTube upload and API servers now support **dynamic port configuration**, allowing you to run multiple instances or avoid port conflicts.

## Features

✅ **Configurable Ports** - Set custom ports via environment variables  
✅ **Auto Port Detection** - Automatically finds available ports if default is occupied  
✅ **Multiple Instances** - Run servers on different ports simultaneously  
✅ **Frontend Integration** - Browser automatically uses configured port  

## Quick Start

### Default Ports (No Configuration Needed)

```bash
bash scripts/api/start-servers.sh
```

- Upload Server: `3001`
- MySQL API Server: `3002`

### Custom Ports

Set environment variables before starting:

```bash
# Upload Server on port 4001
export UPLOAD_SERVER_PORT=4001
bash scripts/api/start-servers.sh

# Or inline
UPLOAD_SERVER_PORT=4001 bash scripts/api/start-servers.sh
```

### Multiple Instances

Run multiple upload servers on different ports:

```bash
# Terminal 1
UPLOAD_SERVER_PORT=3001 node scripts/api/upload-server.js &

# Terminal 2
UPLOAD_SERVER_PORT=3003 node scripts/api/upload-server.js &

# Terminal 3
UPLOAD_SERVER_PORT=3004 node scripts/api/upload-server.js &
```

## Frontend Configuration

### Automatic Detection (Recommended)

The WigTube frontend automatically detects the upload server port using `localStorage`:

1. Open WigTube in your browser
2. Open browser console (F12)
3. Set the port:

```javascript
localStorage.setItem('wigtubeUploadPort', '3001');
```

4. Refresh the page

### Helper Script

After starting servers, run:

```bash
node scripts/api/set-upload-port.js
```

This will display the exact command to run in your browser console.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `UPLOAD_SERVER_PORT` | Port for video upload server | `3001` |
| `MYSQL_API_PORT` | Port for MySQL API server | `3002` |
| `TEMP_UPLOAD_DIR` | Directory for temporary uploads | `../../temp-uploads` |
| `VIDEO_REPO_PATH` | Path to external video repository | `/workspaces/Videoswigtube-EEEEEE` |

## Port Forwarding in Codespaces

The following ports are pre-configured for forwarding in `.devcontainer/devcontainer.json`:

- `3001` - Upload Server (Default)
- `3002` - MySQL API (Default)
- `3003-3005` - Alternative Upload Server Ports

**Important:** Make sure your port visibility is set to **PUBLIC** in the PORTS tab for uploads to work!

## Troubleshooting

### Port Already in Use

The startup script automatically detects occupied ports and finds alternatives:

```bash
⚠️  Port 3001 is occupied by another process
   🔄 Will use alternative port: 3003
```

### Check Running Servers

```bash
# List processes on ports
lsof -i :3001
lsof -i :3002
lsof -i :3003

# Or check all ports
netstat -tuln | grep 300
```

### View Server Logs

```bash
tail -f /tmp/upload-server.log
tail -f /tmp/mysql-api.log
```

### Stop Servers

```bash
bash scripts/api/stop-servers.sh

# Or manually
pkill -f upload-server.js
pkill -f mysql-api-server.js
```

## Examples

### Development with Custom Ports

```bash
# Start servers on custom ports
UPLOAD_SERVER_PORT=4001 MYSQL_API_PORT=4002 bash scripts/api/start-servers.sh

# Configure browser
# In browser console:
localStorage.setItem('wigtubeUploadPort', '4001');
```

### Testing Multiple Upload Servers

```bash
# Start 3 upload servers
for port in 3001 3003 3004; do
  UPLOAD_SERVER_PORT=$port node scripts/api/upload-server.js > /tmp/upload-$port.log 2>&1 &
done

# Check they're all running
curl http://localhost:3001/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

## Architecture Changes

### Before (Hardcoded)

- Upload server always on port 3001
- No flexibility for conflicts or multiple instances
- Manual port changes required editing multiple files

### After (Dynamic)

- Ports configurable via environment variables
- Auto-detection of available ports
- Frontend uses localStorage for port configuration
- Support for multiple simultaneous instances

## Related Files

- [`scripts/api/upload-server.js`](scripts/api/upload-server.js) - Upload server with port config
- [`scripts/api/mysql-api-server.js`](scripts/api/mysql-api-server.js) - MySQL API with port config
- [`scripts/api/start-servers.sh`](scripts/api/start-servers.sh) - Startup script with auto-detection
- [`scripts/api/set-upload-port.js`](scripts/api/set-upload-port.js) - Helper for browser config
- [`scripts/apps/browser/wigtube.js`](scripts/apps/browser/wigtube.js) - Frontend port detection
- [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) - Port forwarding config
