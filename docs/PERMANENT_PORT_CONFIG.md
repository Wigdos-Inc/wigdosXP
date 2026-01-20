# Permanent Port Configuration for WigTube

## Overview
This repository is configured to **automatically make ports PUBLIC** when any new Codespace is created. No manual port configuration is needed.

## How It Works

### 1. Repository-Level Configuration
- **`.devcontainer/devcontainer.json`**: Defines port forwarding and visibility settings
- **`.codespaces/settings.json`**: GitHub Codespaces-specific port configuration
- **`.github/codespaces-prebuilds.json`**: Prebuild configuration for faster startup

### 2. Automatic Port Setup
When a new Codespace is created from this repository:

✅ **Ports 3001 & 3002 are automatically PUBLIC**
✅ **Port forwarding is pre-configured**
✅ **Servers start automatically on container creation**
✅ **URLs work immediately when clicked**

### 3. Pre-Configured Ports

| Port | Service | Visibility | Auto-Forward |
|------|---------|------------|--------------|
| 3001 | 🚀 Upload Server | Public | Yes (notify) |
| 3002 | 📊 MySQL API | Public | Yes (silent) |
| 3000 | 🌐 WigTube App | Public | Yes (browser) |
| 3003-3005 | Alt Upload Servers | Public | Yes (silent) |
| 5520 | Live Server | Public | Yes (notify) |

## For New Codespace Users

### When You Create a New Codespace:
1. Click "Create Codespace" on the repository
2. Wait for the container to initialize (~30 seconds)
3. Ports are **automatically public** - no action needed
4. Links like `https://[codespace]-3001.app.github.dev` work immediately

### Testing Port Availability
Open the **PORTS** tab in VS Code (bottom panel):
- All ports should show "Visibility: Public"
- Port 3001 should show "🚀 WigTube Upload Server"
- Port 3002 should show "📊 WigTube MySQL API"

## Lifecycle Scripts

### On Codespace Creation (runs once)
```bash
scripts/api/init-ports-early.sh
```
- Binds ports immediately
- Sets visibility to public
- Starts placeholder servers

### On Container Start (runs on every start)
```bash
scripts/api/start-servers.sh
```
- Starts upload server on port 3001
- Starts MySQL API on port 3002
- Replaces placeholder servers with real ones

### On Reconnect/Attach
```bash
scripts/api/ensure-servers-running.sh
```
- Checks if servers are running
- Restarts if needed

## Troubleshooting

### "Port is not public" Error
This should never happen with the new configuration. If it does:

1. **Check PORTS tab**: Verify ports show "Public"
2. **Rebuild container**: 
   ```bash
   # In VS Code Command Palette (Ctrl+Shift+P):
   Codespaces: Rebuild Container
   ```
3. **Manual override** (last resort):
   ```bash
   gh codespace ports visibility 3001:public -c $CODESPACE_NAME
   gh codespace ports visibility 3002:public -c $CODESPACE_NAME
   ```

### Servers Not Starting
Check logs:
```bash
tail -f /tmp/upload-server.log
tail -f /tmp/mysql-api.log
```

Manually start servers:
```bash
bash scripts/api/start-servers.sh
```

### Port Already in Use
The scripts automatically find alternate ports if needed:
```bash
# Will use 3003, 3004, etc. if 3001 is occupied
UPLOAD_SERVER_PORT=3003 bash scripts/api/start-servers.sh
```

## For Repository Maintainers

### Modifying Port Configuration
Edit these files:
1. **`.devcontainer/devcontainer.json`** - Primary configuration
2. **`.codespaces/settings.json`** - Codespaces-specific settings
3. **`scripts/api/init-ports-early.sh`** - Early initialization logic

### Adding New Ports
1. Add to `forwardPorts` array in `.devcontainer/devcontainer.json`
2. Add port attributes with `"visibility": "public"`
3. Update initialization script if needed

### Testing Changes
```bash
# Rebuild the container to test new configuration
# Command Palette: Codespaces: Rebuild Container
```

## Benefits of This Setup

✅ **Zero Manual Configuration** - Users don't need to make ports public
✅ **Links Work Immediately** - No 302 redirect errors
✅ **Persistent Configuration** - Settings are version-controlled
✅ **Fast Startup** - Servers start automatically
✅ **Reliable** - Multiple fallback mechanisms

## Related Documentation
- [FIX_PORT_302_ERROR.md](./FIX_PORT_302_ERROR.md) - Old manual fix (now automated)
- [DYNAMIC_PORT_CONFIG.md](./DYNAMIC_PORT_CONFIG.md) - Port customization options
- [UPLOAD_SERVER_SETUP.md](./UPLOAD_SERVER_SETUP.md) - Server setup guide
