# Upload Server Setup for WigTube

## Problem: "Failed to fetch" on video upload

When uploading videos in GitHub Codespaces, you may see:
```
Failed to upload file

URL: https://workspace123-3001.app.github.dev/upload
Error: Failed to fetch
```

This happens because port 3001 is **not public** in Codespaces.

## Solution: Make Port 3001 Public

### Step 1: Open PORTS Tab
- Bottom panel in VS Code
- Look for the **PORTS** tab

### Step 2: Find Port 3001
- Look for port `3001` in the list
- If you don't see it, the server might not be running
  - Check: `pgrep -f "upload-server.js"`
  - Start it: `cd /workspaces/wigdosXP && nohup node scripts/api/upload-server.js > /tmp/upload-server.log 2>&1 &`

### Step 3: Make Port 3001 Public
- Right-click on port 3001
- Select **Port Visibility** → **Public**
- You should see it change from 🔒 (private) to 🔗 (public)

### Step 4: Retry Upload
- Refresh the WigTube page (Ctrl+Shift+R or Cmd+Shift+R)
- Try uploading again
- Console should log: `[Codespaces URL] Original: workspace123-5520.app.github.dev → workspace123-3001.app.github.dev`

## Troubleshooting

### Error: "Cannot connect to upload server"
1. Check if server is running: `pgrep -f "upload-server.js"`
2. Check server logs: `tail -20 /tmp/upload-server.log`
3. Verify port is visible: Look in PORTS tab for 3001

### Error: "Port is PRIVATE (redirecting to GitHub auth)"
- This means you need to make port 3001 public (see Step 3 above)
- GitHub redirects private ports to auth - that's why you see a 302 error

### Error: "File too large"
- Maximum file size in Codespaces is **100MB** (port forwarding limit)
- Compress video: `ffmpeg -i input.mp4 -c:v libx264 -crf 28 output.mp4`
- See: [VIDEO_COMPRESSION_GUIDE.md](VIDEO_COMPRESSION_GUIDE.md)

### Error: 413 Content Too Large
- Same as above - file exceeds 100MB limit

## How It Works

WigTube uses a two-port architecture:
- **Port 5520**: Web app (where you browse WigTube)
- **Port 3001**: Upload server (receives video files)

When you're in Codespaces:
- Page loads from: `https://workspace-5520.app.github.dev`
- Upload requests go to: `https://workspace-3001.app.github.dev` (must be public)

The URL replacement happens automatically in `wigtube-shared.js` function `getUploadServerUrl()`.

## Browser Console Debugging

After making port 3001 public, check browser console (F12):

1. **Health check URL should be HTTPS**:
   ```
   [Upload URL] /health → https://workspace-3001.app.github.dev/health
   ```

2. **Upload URL should be HTTPS**:
   ```
   [Upload URL] /upload → https://workspace-3001.app.github.dev/upload
   ```

3. **Server should respond**:
   ```
   ✅ Upload server is accessible
   ```

4. **File upload in progress**:
   ```
   Sending upload request...
   Response status: 200 OK
   ```

## Server Logs

Check what the server received:

```bash
tail -50 /tmp/upload-server.log
```

Should show:
```
📡 POST /upload endpoint called
Processing multipart form data
Received file: my-video.mp4 (45.2 MB)
...
✅ Upload successful
```

## Reference

- **Default upload port**: 3001 (configurable via `UPLOAD_SERVER_PORT` env var)
- **Max file size**: 100MB (GitHub Codespaces port forwarding limitation)
- **File saved to**: `/workspaces/wigdosXP/temp-uploads/`
- **Server restart**: `pkill -f "upload-server.js" && cd /workspaces/wigdosXP && nohup node scripts/api/upload-server.js > /tmp/upload-server.log 2>&1 &`
