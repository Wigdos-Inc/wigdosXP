# Video Compression Guide for WigTube Uploads

## The Issue

GitHub Codespaces has a **100MB limit** for port-forwarded file uploads. Your 29 MB file is getting a 413 error because of size limits in the port forwarding infrastructure.

## Solutions

### Option 1: Use FFmpeg (Recommended - Command Line)

**Simple compression (fastest):**
```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 output.mp4
```

**Better compression (takes longer, smaller file):**
```bash
ffmpeg -i input.mp4 -c:v libx265 -crf 28 -c:a aac -b:a 128k output.mp4
```

**Ultra compression (for really large files):**
```bash
ffmpeg -i input.mp4 -c:v libx265 -crf 32 -preset slow -c:a aac -b:a 96k output.mp4
```

**For 720p resolution (reduce quality):**
```bash
ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -crf 28 -c:a aac -b:a 128k output.mp4
```

### Option 2: Use HandBrake (GUI Tool)

1. Download: https://handbrake.fr/
2. Open your video
3. Select "Fast 720p" or "Normal" preset
4. Click "Start Encode"
5. Upload the output file

### Option 3: Compress Online

Free tools (no installation needed):
- https://www.cloudconvert.com/ - Video conversion
- https://www.freeconvert.com/ - Video compression
- https://www.online-convert.com/ - Video converter

## File Size Targets

- **Recommended:** 10-50 MB
- **Maximum:** 100 MB (hard limit)
- **Target bitrate:** 2-4 Mbps for 720p

## Quick Reference

| Resolution | Quality | Bitrate | ~Duration |
|-----------|---------|---------|-----------|
| 1080p | High | 5 Mbps | 180 MB / 3 min |
| 1080p | Medium | 3 Mbps | 112 MB / 5 min |
| 720p | High | 3 Mbps | 112 MB / 8 min |
| 720p | Medium | 2 Mbps | 50 MB / 6 min |

## Check Your File Size

```bash
# On Mac/Linux:
ls -lh yourfile.mp4

# Get file size in MB:
du -h yourfile.mp4
```

## Example: Compress a 29MB file

If your original file is 29 MB, this command should get it under 20 MB:

```bash
ffmpeg -i original.mp4 -c:v libx264 -crf 28 -preset fast -c:a aac -b:a 128k compressed.mp4
```

This will:
- Use H.264 codec
- CRF 28 (good quality, smaller file)
- Fast encoding speed
- 128 kbps audio (still good quality)

Expected output: **15-25 MB** ✅
