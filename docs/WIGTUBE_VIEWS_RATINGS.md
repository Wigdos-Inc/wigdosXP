# WigTube Views & Rating System

## Overview

WigTube now has a fully functional views and rating system integrated with Firebase Firestore. All videos start at **0 views** and **0 ratings** (☆☆☆☆☆).

## Features

### 📊 View Tracking
- **Automatic increment**: Views are counted after 3 seconds of watching
- **Real-time sync**: View counts sync across all users via Firestore
- **Formatted display**: Shows as "0 views", "420 views", "1.2K views", "1.5M views", etc.
- **Persistent**: Stored in Firestore database, not just localStorage

### ⭐ Rating System
- **5-star rating**: Users can rate videos from 1-5 stars
- **One rating per user**: Prevents duplicate ratings from same user
- **Average calculation**: Shows average rating as stars (★★★☆☆)
- **Rating count**: Displays number of total ratings
- **Interactive buttons**: Easy-to-use rating buttons on video player page

### 💾 Data Storage
- **Primary**: Firebase Firestore (online, real-time)
- **Fallback**: localStorage (offline mode)
- **Collections**:
  - `wigtube_data`: Video metadata and stats
  - `wigtube_comments`: Video comments
  - `wigtube_user_ratings`: User rating tracking (prevents duplicates)

## Setup Instructions

### 1. Initialize the Database

**Option A: Using the Admin Page**
1. Open `apps/browser/pages/wigtube-init.html` in your browser
2. Click "🚀 Initialize WigTube Database"
3. Wait for all 17 videos to be created
4. Done! All videos now start at 0 views and 0 ratings

**Option B: Using Browser Console**
1. Open WigTube in your browser
2. Open Developer Console (F12)
3. Type: `initializeWigTubeDatabase()`
4. Press Enter and wait for completion

### 2. Firestore Indexes

The required indexes are already configured in `firebase/firestore.indexes.json`:
- Videos by visibility + upload date
- Videos by visibility + view count
- Videos by category + upload date  
- Comments by video + timestamp

Deploy with: `firebase deploy --only firestore:indexes`

### 3. Firestore Rules

Current rules (in `firebase/firestore.rules`) are **wide open for testing**:
```
allow read, write: if true;
```

⚠️ **For production**, implement proper authentication and permissions.

## Usage

### For Users

**Watching Videos:**
1. Click any video thumbnail to open the player
2. After 3 seconds, the view count automatically increments
3. View count updates in real-time

**Rating Videos:**
1. Scroll to the video stats section
2. Click one of the 5 rating buttons (⭐ 1 through ⭐ 5)
3. Your rating is saved immediately
4. Average rating and total count update instantly
5. You can only rate each video once

### For Developers

**Getting Video Stats:**
```javascript
// Get video with stats
const video = await WigTubeDB.getVideoById('video-id');
console.log(video.viewCount); // 42
console.log(video.ratings); // [5, 4, 5, 3, 5]

// Increment views
const newCount = await WigTubeDB.incrementViewCount('video-id');

// Add rating (1-5 stars)
await WigTubeDB.addRating('video-id', 5, 'user-id');

// Get user's rating
const userRating = await WigTubeDB.getUserRating('video-id', 'user-id');

// Get average
const avg = await WigTubeDB.getAverageRating('video-id');
```

**Creating New Videos:**
```javascript
const newVideo = await WigTubeDB.createVideo({
    title: 'My Awesome Video',
    description: 'Description here',
    uploaderId: 'user123',
    uploaderName: 'CoolUser',
    duration: '5:30',
    thumbnail: 'path/to/thumb.png',
    videoUrl: 'path/to/video.mp4',
    category: 'gaming',
    tags: ['gaming', 'fun', 'cool'],
    visibility: 'public'
});
// Automatically starts at 0 views, 0 ratings, 0 comments
```

## File Structure

```
scripts/apps/browser/
├── wigtube-db.js          # Main database API
├── wigtube-init.js        # Initialization script
├── wigtube.js             # Video listing page (updated)
└── wigtube-player.js      # Video player page (updated)

apps/browser/pages/
├── wigtube.html           # Main listing page (updated)
├── wigtube-player.html    # Player page (updated)
└── wigtube-init.html      # Admin initialization tool

firebase/
├── firestore.rules        # Security rules (currently open)
└── firestore.indexes.json # Query indexes
```

## API Reference

### WigTubeDB.getAllVideos()
Returns array of all public videos with stats.

### WigTubeDB.getVideoById(videoId)
Returns single video object with all metadata and stats.

### WigTubeDB.createVideo(videoData)
Creates new video starting at 0 views/ratings.

### WigTubeDB.incrementViewCount(videoId)
Adds 1 to view count, returns new total.

### WigTubeDB.addRating(videoId, rating, userId)
Adds 1-5 star rating. Prevents duplicates per user.

### WigTubeDB.getUserRating(videoId, userId)
Gets user's existing rating or null.

### WigTubeDB.getAverageRating(videoId)
Calculates average rating (0-5).

### WigTubeDB.formatViewCount(count)
Formats number as "420 views", "1.2K views", etc.

### WigTubeDB.calculateStarRating(ratingsArray)
Converts rating array to star string "★★★☆☆".

## Troubleshooting

**Videos still show old view counts:**
- Clear localStorage: `localStorage.clear()`
- Refresh the page
- Check if Firebase is connected: `WigTubeDB.isOnline()`

**Ratings not saving:**
- Check browser console for errors
- Verify Firestore rules allow writes
- Make sure Firebase config is correct

**"WigTubeDB is not defined" error:**
- Ensure scripts are loaded in correct order:
  1. Firebase SDK
  2. firebaseconfig.js
  3. wigtube-db.js
  4. wigtube.js or wigtube-player.js

**Initialization fails:**
- Check Firebase connection
- Verify Firestore is enabled in Firebase Console
- Check browser console for specific errors

## Next Steps

- [ ] Implement user authentication (Firebase Auth)
- [ ] Add proper Firestore security rules based on auth
- [ ] Add "trending" view (sort by views in last 24h)
- [ ] Add "top rated" view (sort by average rating)
- [ ] Track unique views per user
- [ ] Add rating breakdown chart (how many 5-star, 4-star, etc.)
- [ ] Add view history for logged-in users

## Notes

- All videos are initialized at **0 views** and **0 ratings**
- View counts increment after 3 seconds of viewing
- Ratings are 1-5 stars (one per user)
- System works offline with localStorage fallback
- Firestore provides real-time sync across users
- Windows XP aesthetic is preserved throughout
