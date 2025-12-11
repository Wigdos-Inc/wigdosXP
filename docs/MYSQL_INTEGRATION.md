# WigTube MySQL Integration Guide

## 🎯 Overview

WigTube now uses **MySQL database** instead of Firebase Firestore for storing video metadata. Video files are still stored in the external GitHub repository (Videoswigtube-EEEEEE).

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WigTube System                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User uploads video via WigTube UI                       │
│                                                             │
│  2. Video file → Upload Server (port 3001)                  │
│     └─> Saves to: /workspaces/Videoswigtube-EEEEEE/videos/ │
│                                                             │
│  3. Metadata → MySQL API Server (port 3002)                 │
│     └─> Saves to: MySQL database (localhost:3306)          │
│                                                             │
│  4. Video URL points to GitHub raw content:                 │
│     https://raw.githubusercontent.com/Danie-GLR/            │
│     Videoswigtube-EEEEEE/main/videos/filename.mp4           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Components Created

### 1. MySQL Database
- **Location**: `localhost:3306`
- **Database**: `wigtube`
- **User**: `wigtube_user` / `wigtube_password`

#### Tables:
- `videos` - Main video metadata (title, description, uploader, URL, etc.)
- `video_tags` - Many-to-many relationship for tags
- `video_ratings` - User ratings (1-5 stars)
- `video_comments` - Comments with optional images
- `favorites` - User favorites tracking

### 2. MySQL API Server
- **File**: `/workspaces/wigdosXP/scripts/api/mysql-api-server.js`
- **Port**: `3002`
- **Status**: ✅ Running

#### Endpoints:
```
GET    /api/videos                    - Get all public videos
GET    /api/videos/:id                - Get video by ID
GET    /api/videos/uploader/:id       - Get videos by uploader
POST   /api/videos                    - Create new video
DELETE /api/videos/:id                - Delete video
POST   /api/videos/:id/view           - Increment view count
POST   /api/videos/:id/rate           - Add/update rating
GET    /api/videos/:id/ratings        - Get video ratings
POST   /api/favorites                 - Add to favorites
DELETE /api/favorites/:userId/:videoId - Remove from favorites
GET    /api/favorites/:userId         - Get user favorites
GET    /health                        - API health check
```

### 3. WigTubeDB MySQL Client
- **File**: `/workspaces/wigdosXP/scripts/apps/browser/wigtube-db-mysql.js`
- **Purpose**: JavaScript API wrapper for MySQL endpoints
- **Fallback**: localStorage when API is offline

#### Key Functions:
```javascript
// Video operations
await WigTubeDB.getAllVideos()
await WigTubeDB.getVideoById(videoId)
await WigTubeDB.getVideosByUploader(uploaderId)
await WigTubeDB.createVideo(videoData)
await WigTubeDB.deleteVideo(videoId)

// View operations
await WigTubeDB.incrementViewCount(videoId)
await WigTubeDB.getViewCount(videoId)

// Rating operations
await WigTubeDB.addRating(videoId, rating)
await WigTubeDB.getUserRating(videoId)
await WigTubeDB.getAverageRating(videoId)

// Favorites
await WigTubeDB.addToFavorites(videoId, title, thumbnail)
await WigTubeDB.removeFromFavorites(videoId)
WigTubeDB.getFavorites()
WigTubeDB.isFavorited(videoId)

// Search
await WigTubeDB.searchVideos(query)

// Utility
WigTubeDB.formatTimestamp(timestamp)
WigTubeDB.formatViewCount(count)
WigTubeDB.calculateStarRating(ratings)
```

### 4. Upload Server
- **File**: `/workspaces/wigdosXP/scripts/api/upload-server.js`
- **Port**: `3001`
- **Purpose**: Saves video files to external repository
- **Status**: ✅ Running

### 5. Updated HTML Files
The following files now use the MySQL database:
- `/workspaces/wigdosXP/apps/browser/pages/wigtube.html`
- `/workspaces/wigdosXP/apps/browser/pages/wigtube-player.html`
- `/workspaces/wigdosXP/apps/browser/pages/wigtube-init.html`

## 🧪 Testing

A test page has been created to verify the MySQL integration:

**Test Page**: `/workspaces/wigdosXP/apps/browser/pages/mysql-test.html`

### Test Features:
1. API Health Check
2. Get All Videos
3. Create Test Video
4. Rate Test Video
5. WigTubeDB Integration Test
6. Full Test Suite (creates, reads, updates, deletes)

### To Run Tests:
1. Make sure both servers are running:
   - Upload Server: `http://localhost:3001`
   - MySQL API: `http://localhost:3002`
2. Open `mysql-test.html` in the browser
3. Click "Run Full Test Suite"

## 🚀 Starting the Servers

### Start Both Servers:
```bash
# Terminal 1 - Upload Server
cd /workspaces/wigdosXP/scripts/api
node upload-server.js

# Terminal 2 - MySQL API Server
cd /workspaces/wigdosXP/scripts/api
node mysql-api-server.js
```

Both servers are currently running in the background.

## 📊 Database Schema

### Videos Table
```sql
CREATE TABLE videos (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    uploader_id VARCHAR(100) NOT NULL,
    uploader_name VARCHAR(100) NOT NULL,
    upload_date BIGINT NOT NULL,
    duration VARCHAR(20),
    thumbnail TEXT,
    video_url TEXT NOT NULL,
    category VARCHAR(50),
    visibility VARCHAR(20) DEFAULT 'public',
    view_count INT DEFAULT 0,
    INDEX idx_uploader (uploader_id),
    INDEX idx_category (category),
    INDEX idx_visibility (visibility),
    INDEX idx_upload_date (upload_date)
);
```

### Video Tags Table
```sql
CREATE TABLE video_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id VARCHAR(50) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_video (video_id),
    INDEX idx_tag (tag)
);
```

### Video Ratings Table
```sql
CREATE TABLE video_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_video_rating (video_id, user_id),
    INDEX idx_video (video_id),
    INDEX idx_user (user_id)
);
```

## 🔧 Configuration

### MySQL Connection (in mysql-api-server.js)
```javascript
const pool = mysql.createPool({
    host: 'localhost',
    user: 'wigtube_user',
    password: 'wigtube_password',
    database: 'wigtube',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
```

### API URL (in wigtube-db-mysql.js)
```javascript
const API_URL = 'http://localhost:3002/api';
```

## 📝 Usage Example

### Uploading a Video:
```javascript
const videoData = {
    title: 'My Awesome Video',
    description: 'This is a test video',
    uploaderId: 'john_doe',
    uploaderName: 'John Doe',
    duration: '3:45',
    thumbnail: 'https://example.com/thumb.jpg',
    videoUrl: 'https://raw.githubusercontent.com/Danie-GLR/Videoswigtube-EEEEEE/main/videos/my-video.mp4',
    category: 'Gaming',
    tags: ['gameplay', 'tutorial'],
    visibility: 'public'
};

const videoId = await WigTubeDB.createVideo(videoData);
console.log('Video created:', videoId);
```

### Rating a Video:
```javascript
await WigTubeDB.addRating('video_1234567890', 5);
const avgRating = await WigTubeDB.getAverageRating('video_1234567890');
console.log('Average rating:', avgRating);
```

## ⚡ Performance

- **MySQL**: Fast queries with proper indexing
- **Connection Pooling**: Reuses connections for better performance
- **Offline Fallback**: localStorage cache when API is unavailable
- **GitHub Raw URLs**: Direct video streaming without database overhead

## 🔐 Security

- SQL injection prevention: Using parameterized queries
- User authentication: Required for uploads, ratings, and favorites
- Guest restrictions: Guests can view but not interact
- CORS enabled: API accessible from WigTube frontend

## 🎯 Next Steps

1. **Commit videos to external repository**:
   ```bash
   cd /workspaces/Videoswigtube-EEEEEE
   git add videos/
   git commit -m "Add uploaded videos"
   git push origin main
   ```

2. **Optional: Migrate existing Firestore data to MySQL**
   - Export data from Firestore
   - Import using the MySQL API

3. **Monitor server logs** for errors or performance issues

4. **Scale**: If needed, can move MySQL to a dedicated server

## 📚 Files Modified/Created

### Created:
- `/scripts/api/mysql-setup.sql` - Database schema
- `/scripts/api/mysql-api-server.js` - Express API server
- `/scripts/api/package.json` - Node.js dependencies
- `/scripts/apps/browser/wigtube-db-mysql.js` - MySQL client
- `/apps/browser/pages/mysql-test.html` - Test suite

### Modified:
- `/apps/browser/pages/wigtube.html`
- `/apps/browser/pages/wigtube-player.html`
- `/apps/browser/pages/wigtube-init.html`

### Unchanged (still functional):
- `/scripts/apps/browser/wigtube.js` - Main WigTube logic
- `/scripts/apps/browser/wigtube-player.js` - Video player
- `/scripts/api/upload-server.js` - File upload handler

## ✅ Status

- ✅ MySQL installed and running
- ✅ Database schema created
- ✅ MySQL API server running (port 3002)
- ✅ Upload server running (port 3001)
- ✅ WigTube frontend updated
- ✅ Test suite available

**System is ready for video uploads!** 🎉
