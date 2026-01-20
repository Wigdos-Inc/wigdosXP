# WigTube Documentation

## Overview
WigTube is a video platform integrated into WigdosXP, using Cloudflare infrastructure with Firebase backend for data storage.

## Architecture

```
┌─────────────────────────────────────────┐
│           WigTube System                │
├─────────────────────────────────────────┤
│                                         │
│  Frontend (Browser)                     │
│  ├─ wigtube.html - Main video listing  │
│  ├─ wigtube-player.html - Video player │
│  └─ wigtube.js - Main logic             │
│                                         │
│  Backend (Cloudflare + Firebase)        │
│  ├─ Firebase Firestore - Metadata      │
│  ├─ localStorage - Offline fallback    │
│  └─ GitHub - Video file storage         │
│                                         │
└─────────────────────────────────────────┘
```

## Components

### Core Files

**HTML Pages:**
- `apps/browser/pages/wigtube.html` - Main video listing page
- `apps/browser/pages/wigtube-player.html` - Video player page

**JavaScript Modules:**
- `scripts/apps/browser/wigtube.js` - Main WigTube logic
- `scripts/apps/browser/wigtube-player.js` - Video player functionality
- `scripts/apps/browser/wigtube-db.js` - Unified database module
- `scripts/apps/browser/wigtube-db-common.js` - Shared database utilities
- `scripts/apps/browser/wigtube-debug.js` - Debug logging utilities

**Stylesheets:**
- `styles/apps/browser/wigtube.css` - Main page styles
- `styles/apps/browser/wigtube-player.css` - Player page styles

### Database API (wigtube-db.js)

The unified database module provides methods for:

#### Video Operations
```javascript
// Get all videos
await WigTubeDB.getAllVideos()

// Get specific video
await WigTubeDB.getVideoById(videoId)

// Get videos by uploader
await WigTubeDB.getVideosByUploader(uploaderId)

// Create new video
await WigTubeDB.createVideo(videoData)

// Delete video
await WigTubeDB.deleteVideo(videoId)
```

#### View Operations
```javascript
// Increment view count
await WigTubeDB.incrementViewCount(videoId)

// Get view count
await WigTubeDB.getViewCount(videoId)
```

#### Rating Operations
```javascript
// Add or update rating
await WigTubeDB.addRating(videoId, rating) // 1-5 stars

// Get user's rating
await WigTubeDB.getUserRating(videoId)

// Get average rating
await WigTubeDB.getAverageRating(videoId)
```

#### Search
```javascript
// Search videos by query
await WigTubeDB.searchVideos(query)
```

#### Utility Functions
```javascript
// Format timestamp to relative time
WigTubeDB.formatTimestamp(timestamp) // "2 days ago"

// Format view count
WigTubeDB.formatViewCount(1500) // "1.5K views"

// Calculate star rating
WigTubeDB.calculateStarRating(ratings) // "★★★★☆"
```

## Data Storage

### Firebase Firestore Structure
```
wigtube/
├─ data - Document containing videos map
├─ wigtube_comments - Document containing comments map
└─ user_ratings - Document containing ratings map
```

### localStorage Fallback
When offline, data is cached in localStorage under the key `wigtube_offline_data`.

## Features

- **Video Upload** - Upload videos with metadata (title, description, tags, etc.)
- **Video Playback** - Stream videos from GitHub repository
- **Comments** - Add comments to videos (with optional images)
- **Ratings** - Rate videos 1-5 stars
- **Search** - Search videos by title, description, or tags
- **Favorites** - Save favorite videos
- **User Channels** - View videos by uploader
- **Offline Support** - Automatic fallback to localStorage

## Usage Example

### Creating a Video
```javascript
const videoData = {
    title: 'My Video',
    description: 'Video description',
    uploaderId: 'username',
    uploaderName: 'Display Name',
    duration: '3:45',
    thumbnail: 'url/to/thumbnail.jpg',
    videoUrl: 'url/to/video.mp4',
    category: 'Gaming',
    tags: ['gameplay', 'tutorial'],
    visibility: 'public'
};

const videoId = await WigTubeDB.createVideo(videoData);
```

### Rating a Video
```javascript
// User rates video 5 stars
await WigTubeDB.addRating(videoId, 5);

// Get average rating
const avgRating = await WigTubeDB.getAverageRating(videoId);
console.log('Average:', avgRating); // e.g., 4.5
```

## Debug Mode

Enable debug logging by adding `?debug` to the URL:
```
apps/browser/pages/wigtube.html?debug
```

Debug logs will appear in the browser console with module prefixes like `[WigTubeDB]`.

## System Requirements

- Modern web browser with JavaScript enabled
- Internet connection for Cloudflare/Firebase (optional with offline mode)
- localStorage support for offline functionality

## Changelog

### v2.0 - Cloudflare Migration (Current)
- ✅ Consolidated to unified database module
- ✅ Removed MySQL server dependencies
- ✅ Removed migration tools
- ✅ Simplified documentation
- ✅ Using Cloudflare infrastructure with Firebase backend

### v1.0 - Initial Release
- Firebase Firestore integration
- Video upload and playback
- Comments and ratings
- Offline localStorage fallback
