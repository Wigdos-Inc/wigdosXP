// WigTube Video Player JavaScript - 2003 YouTube Style
// Note: Shared utilities (debugLog, getVideoRepoConfig, generateVideoUrl, loadVideoWithFallback) 
// are loaded from wigtube-shared.js

// debugLog is provided by wigtube-db.js which loads first

// ============================================
// Centralized WigTube Data Management
// ============================================

/**
 * Get all WigTube data from a single localStorage key
 */
function getWigTubeData() {
    const data = localStorage.getItem('wigtube_data');
    if (!data) {
        return {
            playlists: {},
            favorites: [],
            flagged: [],
            comments: {},
            videoStats: {}
        };
    }
    return JSON.parse(data);
}

/**
 * Save all WigTube data to a single localStorage key
 */
function saveWigTubeData(data) {
    localStorage.setItem('wigtube_data', JSON.stringify(data));
}

/**
 * Get a specific property from WigTube data
 */
function getWigTubeProperty(property) {
    const data = getWigTubeData();
    return data[property];
}

/**
 * Update a specific property in WigTube data
 */
function updateWigTubeProperty(property, value) {
    const data = getWigTubeData();
    data[property] = value;
    saveWigTubeData(data);
}

// Video data will be loaded from JSON file
let videoDataArray = [];
let videoData = {};
let albumTracksData = {};
let albumMetadataArray = [];

// Load and initialize video data (uses shared utility from wigtube-shared.js)
async function initializePlayerVideoData() {
    const data = await loadVideoDataFromJSON('../../scripts/apps/browser/wigtube-data.json');
    if (data) {
        videoDataArray = data.videos;
        
        // Convert array to object format for player
        videoData = {};
        videoDataArray.forEach(video => {
            videoData[video.id] = video;
        });
        
        albumTracksData = data.albums;
        albumMetadataArray = data.albumMetadata;
        
        return true;
    }
    console.warn('Failed to load video data, using fallback dataset');
    return false;
}

// Fallback video data structure

// Note: durationToSeconds() and secondsToDuration() are now in wigtube-shared.js

// Helper function to calculate total album duration from track IDs
function calculateAlbumDuration(trackIds) {
    let totalSeconds = 0;
    trackIds.forEach(trackId => {
        const video = videoData[trackId];
        if (video) {
            totalSeconds += durationToSeconds(video.duration);
        }
    });
    return secondsToDuration(totalSeconds);
}

// Album/Playlist data - will be loaded from JSON and converted to object format
let albumData = {};

// Related videos for the sidebar - using proper thumbnails from main wigtube data
const relatedVideos = [
    {
        id: 'yo Darren',
        title: 'Yo Darren',
        uploader: 'Codemittens',
        duration: '01:41',
        thumbnail: 'assets/images/thumbnail/yodarren.png'
    },
    {
        id: 'epic-minecraft-castle-build',
        title: 'Epic Minecraft Castle Build',
        uploader: 'Steve',
        duration: '02:45',
        thumbnail: 'assets/images/thumbnail/steve.png'
    },
    {
        id: 'jolly',
        title: 'Jolly Flight',
        uploader: 'Santa Claus',
        duration: '00:16',
        thumbnail: 'assets/images/thumbnail/santa.png'
    },
    {
        id: 'blackman',
        title: 'freddy fazbear is about to get his dingaling touched',
        uploader: 'fredbear',
        duration: '00:08',
        thumbnail: 'assets/images/thumbnail/blackman.png'
    },
    {
        id: 'fredrick-fazbear-touches-youtubers-dingalings',
        title: 'Fredrick Fazbear Touches Youtubers Dingalings',
        uploader: 'fredbear',
        duration: '04:34',
        thumbnail: 'assets/images/thumbnail/dingaling.png'
    },
    {
        id: 'fnaf-squid-games-real',
        title: 'Fnaf squid games real',
        uploader: 'MrPenis',
        duration: '00:56',
        thumbnail: 'assets/images/thumbnail/mr.png'
    }
];

// Global variables
let currentVideo = null;
let currentVideoId = null; // Track current video ID
let videoElement = null;
let isPlaying = false;
let currentTime = 0;
let duration = 0;
let selectedImage = null;
let videoSimulationInterval = null;
let currentAlbum = null;
let currentTrackIndex = 0;
let isPlayingAlbum = false;
let viewCountIncremented = false; // Track if view has been counted for current video

document.addEventListener('DOMContentLoaded', async function() {
    debugLog('DOM Content Loaded');
    
    // Load video data from JSON first
    const jsonLoaded = await initializePlayerVideoData();
    if (!jsonLoaded) {
        console.error('❌ Failed to load video data from JSON file!');
        console.error('Make sure scripts/apps/browser/wigtube-data.json exists and is valid.');
        document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Tahoma;"><h1>Error Loading Video Database</h1><p>Failed to load wigtube-data.json. Please check the console for details.</p></div>';
        videoData = {}; // Use empty object - JSON file is the single source of truth
        videoDataArray = [];
        albumTracksData = {};
        albumMetadataArray = [];
        return; // Stop execution if data fails to load
    } else {
        // Convert album metadata to object format with tracks
        albumData = {};
        albumMetadataArray.forEach(album => {
            albumData[album.id] = {
                ...album,
                tracks: albumTracksData[album.id] || [],
                get totalDuration() {
                    return calculateAlbumDuration(this.tracks);
                }
            };
        });
    }
    
    // Load username from localStorage
    const username = localStorage.getItem('username');
    debugLog('Username from localStorage:', username);
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay && username) {
        usernameDisplay.textContent = username;
        debugLog('Username display updated');
    }
    
    // Migrate old playlists to new WigTubeDB format
    if (username && username !== 'guest') {
        await migrateOldPlaylists();
    }
    
    debugLog('Setting up event listeners');
    setupEventListeners();
    
    debugLog('Initializing player and loading video');
    await initializePlayer();
    
    debugLog('Populating related videos');
    await populateRelatedVideos();
    
    // Note: loadComments() is now called from within loadVideo()
    debugLog('Player initialization complete');
});

async function initializePlayer() {
    debugLog('initializePlayer: Starting');
    // Get video ID or album ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    const albumId = urlParams.get('album');
    
    debugLog('initializePlayer: videoId=', videoId, 'albumId=', albumId);
    
    if (albumId && albumData[albumId]) {
        debugLog('initializePlayer: Loading album', albumId);
        // Load album playlist
        await loadAlbum(albumId);
    } else {
        debugLog('initializePlayer: Loading single video', videoId || 'epic-minecraft-castle-build');
        // Load single video
        await loadVideo(videoId || 'epic-minecraft-castle-build');
    }
}

async function loadVideo(videoId) {
    debugLog('loadVideo: Starting for', videoId);
    let video = videoData[videoId];
    
    // If video not found in local data, try to fetch from WigTubeDB
    if (!video && typeof WigTubeDB !== 'undefined') {
        debugLog('loadVideo: Video not in local data, fetching from WigTubeDB');
        try {
            const dbVideo = await WigTubeDB.getVideoById(videoId);
            if (dbVideo) {
                // Convert DB format to player format
                video = {
                    title: dbVideo.title,
                    uploader: dbVideo.uploaderName || dbVideo.uploaderId,
                    uploadDate: typeof WigTubeDB.formatTimestamp === 'function' ? 
                        WigTubeDB.formatTimestamp(dbVideo.uploadDate) : 'Recently',
                    duration: dbVideo.duration,
                    views: typeof WigTubeDB.formatViewCount === 'function' ? 
                        WigTubeDB.formatViewCount(dbVideo.viewCount || 0) : '0 views',
                    rating: '☆☆☆☆☆',
                    ratingCount: 0,
                    description: dbVideo.description || 'No description available',
                    videoFile: dbVideo.videoUrl,
                    thumbnail: dbVideo.thumbnail
                };
                debugLog('loadVideo: Video loaded from WigTubeDB', video);
            }
        } catch (error) {
            console.error('Error fetching video from WigTubeDB:', error);
            debugLog('loadVideo: ERROR fetching from WigTubeDB', error);
        }
    }
    
    if (!video) {
        console.error('Video not found:', videoId);
        debugLog('loadVideo: ERROR - Video data not found for', videoId);
        alert('Video not found! The video may have been deleted or does not exist.');
        return;
    }
    
    debugLog('loadVideo: Setting current video to', videoId);
    currentVideo = video;
    currentVideoId = videoId; // Store current video ID
    viewCountIncremented = false; // Reset view count flag for new video
    
    // Update page title
    document.title = `${video.title} - WigTube`;
    debugLog('loadVideo: Page title updated');
    
    // Check if WigTubeDB is available
    if (typeof WigTubeDB !== 'undefined') {
        debugLog('loadVideo: WigTubeDB available, fetching stats');
        try {
            // Get real-time stats from database
            const dbVideo = await WigTubeDB.getVideoById(videoId);
            
            let viewCount, ratingStars, ratingCount, likeCount, dislikeCount;
            
            if (dbVideo) {
                debugLog('loadVideo: DB video found', dbVideo);
                // Use database values
                viewCount = WigTubeDB.formatViewCount(dbVideo.viewCount || 0);
                ratingStars = WigTubeDB.calculateStarRating(dbVideo.ratings || []);
                ratingCount = (dbVideo.ratings || []).length;
                likeCount = dbVideo.likeCount || 0;
                dislikeCount = dbVideo.dislikeCount || 0;
            } else {
                debugLog('loadVideo: DB video not found, using zeros');
                // Initialize with zeros for new video
                viewCount = '0 views';
                ratingStars = '☆☆☆☆☆';
                ratingCount = 0;
                likeCount = 0;
                dislikeCount = 0;
            }
            
            debugLog('loadVideo: Stats -', { viewCount, ratingStars, ratingCount, likeCount, dislikeCount });
            
            // Update video information with real stats
            document.getElementById('videoTitle').textContent = video.title;
            
            // Make uploader name clickable
            const uploaderElement = document.getElementById('uploader');
            uploaderElement.innerHTML = `<span class="channel-link" data-channel="${video.uploader}" style="color: #0066cc; text-decoration: underline; cursor: pointer;">${video.uploader}</span>`;
            
            // Setup subscribe button
            setupSubscribeButton(video.uploader || video.uploaderId);
            
            document.getElementById('uploadDate').textContent = video.uploadDate;
            document.getElementById('viewCount').textContent = viewCount;
            document.getElementById('rating').textContent = ratingStars;
            document.getElementById('ratingCount').textContent = ratingCount;
            document.getElementById('videoDescription').textContent = video.description;
            document.getElementById('totalTime').textContent = video.duration;
            
            // Update like/dislike counts
            document.getElementById('likeCount').textContent = likeCount;
            document.getElementById('dislikeCount').textContent = dislikeCount;
            
            // Update like/dislike button states based on user's previous action
            const username = localStorage.getItem('username') || 'anonymous';
            const userAction = WigTubeDB.getUserLikeStatus(videoId, username);
            updateLikeDislikeButtons(userAction);
            
            debugLog('loadVideo: UI updated with stats');
            
        } catch (error) {
            console.error('Error loading video from database:', error);
            debugLog('loadVideo: ERROR loading from DB', error);
            // Fallback to hardcoded values
            await loadVideoFallback(videoId, video);
        }
    } else {
        debugLog('loadVideo: WigTubeDB not available, using fallback');
        // WigTubeDB not loaded, use fallback
        await loadVideoFallback(videoId, video);
    }
    
    // Always load comments after video info is loaded
    debugLog('loadVideo: Loading comments');
    await loadComments();
    
    // Show album section if this is a music video
    if (video.isMusic) {
        displayAlbumSection(video);
    } else {
        hideAlbumSection();
    }
    
    // Update favorite button text based on current status
    if (typeof WigTubeDB !== 'undefined') {
        const isFavorited = WigTubeDB.isFavorited(videoId);
        const favoriteBtn = document.querySelector('.action-btn');
        if (favoriteBtn) {
            favoriteBtn.textContent = isFavorited ? 'Remove from Favorites' : 'Add to Favorites';
        }
    }
    
    // Start buffering simulation
    startBuffering();
    
    // Update status
    updateStatus('Loading video: ' + video.title);
}

async function loadVideoFallback(videoId, video) {
    // Fallback method using localStorage-based stats
    const savedStats = loadVideoStats(videoId);
    
    document.getElementById('videoTitle').textContent = video.title;
    
    // Make uploader name clickable
    const uploaderElement = document.getElementById('uploader');
    uploaderElement.innerHTML = `<span class="channel-link" data-channel="${video.uploader}" style="color: #0066cc; text-decoration: underline; cursor: pointer;">${video.uploader}</span>`;
    
    // Setup subscribe button
    setupSubscribeButton(video.uploader || video.uploaderId);
    
    document.getElementById('uploadDate').textContent = video.uploadDate;
    document.getElementById('viewCount').textContent = savedStats.views;
    document.getElementById('rating').textContent = savedStats.ratingStars;
    document.getElementById('ratingCount').textContent = savedStats.ratingCount;
    document.getElementById('videoDescription').textContent = video.description;
    document.getElementById('totalTime').textContent = video.duration;
    
    // Note: View count will be incremented when user clicks play
}

function startBuffering() {
    const bufferingIndicator = document.getElementById('bufferingIndicator');
    const playButton = document.getElementById('playButton');
    const statusText = document.getElementById('statusText');
    
    // Show buffering, hide play button initially
    bufferingIndicator.style.display = 'block';
    playButton.style.display = 'none';
    
    // Simulate buffering progress
    let progress = 0;
    const bufferingInterval = setInterval(() => {
        progress += Math.random() * 15 + 5; // Random progress between 5-20%
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(bufferingInterval);
            
            // Buffering complete
            setTimeout(() => {
                bufferingIndicator.style.display = 'none';
                playButton.style.display = 'flex';
                enableControls();
                statusText.textContent = 'Video ready to play';
            }, 500);
        }
        
        // Update buffering bar (visual feedback)
        const bufferingProgress = document.getElementById('bufferingProgress');
        bufferingProgress.style.width = progress + '%';
        
        statusText.textContent = `Buffering: ${Math.round(progress)}%`;
    }, 200);
}

function enableControls() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const volumeSlider = document.querySelector('.volume-slider');
    
    playPauseBtn.disabled = false;
    stopBtn.disabled = false;
    volumeSlider.disabled = false;
}

function setupEventListeners() {
    // Play button click
    document.getElementById('playButton').addEventListener('click', function() {
        playVideo();
    });
    
    // Control buttons
    document.getElementById('playPauseBtn').addEventListener('click', function() {
        if (isPlaying) {
            pauseVideo();
        } else {
            playVideo();
        }
    });
    
    document.getElementById('stopBtn').addEventListener('click', function() {
        stopVideo();
    });
    
    // Progress bar click
    document.querySelector('.progress-bar').addEventListener('click', function(e) {
        if (duration > 0) {
            const rect = this.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            seekTo(percentage * duration);
        }
    });
    
    // Volume slider
    const volumeSlider = document.querySelector('.volume-slider');
    volumeSlider.addEventListener('input', function() {
        const volume = this.value / 100;
        setVolume(volume);
    });
    
    // Action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.textContent;
            handleActionButton(action);
        });
    });
    
    // Like button
    document.getElementById('likeBtn').addEventListener('click', async function(e) {
        e.stopPropagation(); // Prevent action button handler from firing
        await handleLikeDislike('like');
    });
    
    // Dislike button
    document.getElementById('dislikeBtn').addEventListener('click', async function(e) {
        e.stopPropagation(); // Prevent action button handler from firing
        await handleLikeDislike('dislike');
    });
    
    // Add to Playlist button
    document.getElementById('addToPlaylistBtn').addEventListener('click', async function(e) {
        e.stopPropagation(); // Prevent action button handler from firing
        if (currentVideoId) {
            await showAddToPlaylistMenu(currentVideoId);
        }
    });
    
    // Comment form
    document.querySelector('.comment-submit').addEventListener('click', function() {
        const commentInput = document.querySelector('.comment-input');
        const comment = commentInput.value.trim();
        
        // Check if user is logged in (not a guest)
        const username = localStorage.getItem('username');
        if (!username || username.toLowerCase() === 'guest') {
            alert('⚠️ Comment Error\\n\\nGuest accounts cannot post comments.\\n\\nPlease log in with a registered account to comment.');
            return;
        }
        
        if (comment || selectedImage) {
            addComment(comment, selectedImage);
            commentInput.value = '';
            removeImagePreview();
        } else {
            alert('⚠️ Comment Error\\n\\nPlease enter a comment or select an image before posting.\\n\\nComments must have at least some content.');
        }
    });

    // Image upload handling
    document.getElementById('imageUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImage = e.target.result;
                showImagePreview(selectedImage);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Channel link click handler - navigate to channel page
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('channel-link')) {
            const channelName = e.target.getAttribute('data-channel');
            if (channelName) {
                // Navigate back to main WigTube page with channel parameter
                window.location.href = `apps/browser/pages/wigtube.html?channel=${encodeURIComponent(channelName)}`;
            }
        }
    });
}

function playVideo() {
    debugLog('playVideo: Starting');
    const playButton = document.getElementById('playButton');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const statusText = document.getElementById('statusText');
    
    // Check if currentVideo is loaded
    if (!currentVideo) {
        console.error('No video loaded');
        debugLog('playVideo: ERROR - No current video');
        alert('No video loaded! Please select a video to play.');
        return;
    }
    
    // Hide big play button
    playButton.style.display = 'none';
    
    // Update button text
    playPauseBtn.textContent = 'Pause';
    
    // Set playing state
    isPlaying = true;
    
    // Update status
    statusText.textContent = `Playing: ${currentVideo.title}`;
    
    // Increment view count on first play only
    if (!viewCountIncremented) {
        debugLog('playVideo: Incrementing view count (first play)');
        viewCountIncremented = true;
        const videoId = currentVideoId || getVideoIdFromURL();
        
        debugLog('playVideo: Video ID for view increment:', videoId);
        
        // Try WigTubeDB first (Firestore)
        if (typeof WigTubeDB !== 'undefined') {
            debugLog('playVideo: Using WigTubeDB for view increment');
            
            // Track in history
            WigTubeDB.addToHistory(videoId, {
                title: currentVideo.title,
                thumbnail: currentVideo.thumbnail,
                duration: currentVideo.duration,
                author: currentVideo.uploader
            });
            
            WigTubeDB.incrementViewCount(videoId, {
                title: currentVideo.title,
                description: currentVideo.description,
                uploader: currentVideo.uploader,
                uploadDate: currentVideo.uploadDate,
                duration: currentVideo.duration,
                thumbnail: currentVideo.thumbnail,
                videoFile: currentVideo.videoFile
            }).then(newViewCount => {
                document.getElementById('viewCount').textContent = WigTubeDB.formatViewCount(newViewCount);
                console.log(`View count updated: ${newViewCount}`);
                debugLog('playVideo: View count updated to', newViewCount);
                
                // Track view for achievements (for the video uploader)
                if (typeof WigTubeAchievements !== 'undefined' && currentVideo.uploader) {
                    WigTubeAchievements.onVideoViewed(currentVideo.uploader);
                }
            }).catch(error => {
                console.error('Error incrementing view count:', error);
                debugLog('playVideo: ERROR incrementing view count', error);
            });
        } else {
            debugLog('playVideo: Using localStorage fallback for view increment');
            // Fallback to localStorage
            incrementViewCount(videoId);
        }
    } else {
        debugLog('playVideo: View already counted, skipping increment');
    }
    
    debugLog('playVideo: Starting video playback');
    // Try to play actual video if available
    if (currentVideo.videoFile) {
        // If video element already exists, just resume playback
        if (videoElement) {
            debugLog('playVideo: Resuming existing video element');
            videoElement.play().catch(e => {
                console.log('Video play failed:', e);
                debugLog('playVideo: Video play failed', e);
            });
        } else {
            debugLog('playVideo: Creating new video element');
            // Create new video element
            createVideoElement();
        }
    } else {
        debugLog('playVideo: Starting video simulation (no file)');
        // Start video simulation for videos without files
        startVideoSimulation();
    }
}

function pauseVideo() {
    const playButton = document.getElementById('playButton');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const statusText = document.getElementById('statusText');
    
    isPlaying = false;
    playPauseBtn.textContent = 'Play';
    statusText.textContent = `Paused: ${currentVideo.title}`;
    
    // Keep the play button hidden when paused (don't show it again)
    playButton.style.display = 'none';
    
    // Clear the simulation interval
    if (videoSimulationInterval) {
        clearInterval(videoSimulationInterval);
        videoSimulationInterval = null;
    }
    
    // Pause the actual video element if it exists
    if (videoElement) {
        videoElement.pause();
    }
}

function stopVideo() {
    const playButton = document.getElementById('playButton');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const statusText = document.getElementById('statusText');
    const progressFill = document.getElementById('progressFill');
    const currentTimeDisplay = document.getElementById('currentTime');
    
    // Reset to stopped state
    isPlaying = false;
    currentTime = 0;
    
    // Clear the simulation interval
    if (videoSimulationInterval) {
        clearInterval(videoSimulationInterval);
        videoSimulationInterval = null;
    }
    
    // Update UI
    playButton.style.display = 'flex';
    playPauseBtn.textContent = 'Play';
    progressFill.style.width = '0%';
    currentTimeDisplay.textContent = '0:00';
    statusText.textContent = 'Stopped';
    
    // Remove video element
    if (videoElement) {
        videoElement.remove();
        videoElement = null;
    }
}

function createVideoElement() {
    // Create actual video element for supported files
    if (!currentVideo.videoFile) return;
    
    const videoScreen = document.getElementById('videoScreen');
    
    // If video element already exists, don't create a new one
    if (videoElement) {
        console.log('Video element already exists');
        return;
    }
    
    videoElement = document.createElement('video');
    
    videoElement.style.cssText = 'width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; z-index: 10;';
    videoElement.controls = false; // We handle controls ourselves
    
    // Preload metadata for better performance
    videoElement.preload = 'metadata';
    
    // Generate the proper video URL (handles both local and external repo)
    const videoUrl = generateVideoUrl(currentVideo.videoFile);
    const originalPath = currentVideo.videoFile;
    
    debugLog('Loading video from:', videoUrl);
    console.log('Video source URL:', videoUrl);
    console.log('Original path:', originalPath);
    
    // Set video source directly (better compatibility than <source> elements)
    videoElement.src = videoUrl;
    
    // Track if we've tried fallback
    let fallbackAttempted = false;
    
    // Add error handler with fallback to local assets
    videoElement.addEventListener('error', function(e) {
        console.warn('Video load error:', e);
        console.warn('Failed URL:', videoUrl);
        console.warn('Video error details:', {
            error: videoElement.error,
            networkState: videoElement.networkState,
            readyState: videoElement.readyState
        });
        
        // Try local fallback if this was an external URL and we haven't tried fallback yet
        if (!fallbackAttempted && originalPath.startsWith('assets/') && videoUrl !== originalPath) {
            fallbackAttempted = true;
            console.log('External URL failed, trying local fallback:', originalPath);
            debugLog('Attempting local fallback source:', originalPath);
            videoElement.src = originalPath;
            videoElement.load(); // Force reload with new source
            return; // Don't show error yet, give fallback a chance
        }
        
        // Show error message if both sources failed (or no fallback available)
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 30px;
            border-radius: 5px;
            text-align: center;
            max-width: 500px;
            font-family: Arial, sans-serif;
            z-index: 100;
        `;
        
        const fileName = currentVideo.videoFile.split('/').pop();
        const { owner, name, folder } = getVideoRepoConfig();
        errorMsg.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #ff6b6b;">❌ Video File Not Found</h3>
            <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.5;">
                The video file <strong>${fileName}</strong> couldn't be loaded.
            </p>
            <p style="margin: 0 0 5px 0; font-size: 11px; color: #999;">Tried loading from:</p>
            <p style="margin: 0 0 15px 0; font-size: 10px; color: #666; word-break: break-all;">${videoUrl}</p>
            <p style="margin: 0 0 15px 0; font-size: 12px; color: #ccc; line-height: 1.5;">
                To make this video playable:
            </p>
            <ol style="text-align: left; font-size: 12px; line-height: 1.8; color: #ddd; padding-left: 20px;">
                <li>Add the video file to the external repository: <code style="background: #333; padding: 2px 5px; border-radius: 3px;">${owner}/${name}</code></li>
                <li>Place it in the <code style="background: #333; padding: 2px 5px; border-radius: 3px;">${folder}/</code> folder</li>
                <li>Filename: <code style="background: #333; padding: 2px 5px; border-radius: 3px;">${fileName}</code></li>
                <li>Commit and push to the repository</li>
            </ol>
        `;
        
        videoScreen.appendChild(errorMsg);
    });
    
    // Set initial volume from slider
    const volumeSlider = document.querySelector('.volume-slider');
    videoElement.volume = volumeSlider.value / 100;
    
    // Add event listeners
    videoElement.addEventListener('loadedmetadata', function() {
        duration = this.duration;
        updateDurationDisplay();
    });
    
    videoElement.addEventListener('timeupdate', function() {
        currentTime = this.currentTime;
        updateProgressBar();
        updateTimeDisplay();
    });
    
    videoElement.addEventListener('ended', function() {
        // Check if we're playing an album and should autoplay next
        if (isPlayingAlbum && currentAlbum) {
            playNextTrack();
        } else {
            stopVideo();
            updateStatus('Video ended');
        }
    });
    
    // Add to screen and play
    videoScreen.appendChild(videoElement);
    videoElement.play().catch(e => {
        console.log('Video play failed:', e);
        // Fall back to simulation
        startVideoSimulation();
    });
}

function startVideoSimulation() {
    // Simulate video playback for videos without actual files
    if (!currentVideo.videoFile) {
        // Parse duration string (e.g., "10:24" -> seconds)
        const [minutes, seconds] = currentVideo.duration.split(':').map(Number);
        duration = minutes * 60 + seconds;
        
        // Clear any existing interval
        if (videoSimulationInterval) {
            clearInterval(videoSimulationInterval);
        }
        
        // Simulate playback
        videoSimulationInterval = setInterval(() => {
            if (!isPlaying) {
                clearInterval(videoSimulationInterval);
                videoSimulationInterval = null;
                return;
            }
            
            currentTime += 0.5; // Update every 500ms
            
            if (currentTime >= duration) {
                currentTime = duration;
                clearInterval(videoSimulationInterval);
                videoSimulationInterval = null;
                
                // Check if we're playing an album and should autoplay next
                if (isPlayingAlbum && currentAlbum) {
                    playNextTrack();
                } else {
                    stopVideo();
                    updateStatus('Video ended');
                }
                return;
            }
            
            updateProgressBar();
            updateTimeDisplay();
        }, 500);
    }
}

function updateProgressBar() {
    if (duration > 0) {
        const percentage = (currentTime / duration) * 100;
        document.getElementById('progressFill').style.width = percentage + '%';
    }
}

function updateTimeDisplay() {
    document.getElementById('currentTime').textContent = formatTime(currentTime);
}

function updateDurationDisplay() {
    document.getElementById('totalTime').textContent = formatTime(duration);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function seekTo(time) {
    currentTime = time;
    if (videoElement) {
        videoElement.currentTime = time;
    }
    updateProgressBar();
    updateTimeDisplay();
}

function setVolume(volume) {
    // Clamp volume between 0 and 1
    volume = Math.max(0, Math.min(1, volume));
    
    if (videoElement) {
        videoElement.volume = volume;
    }
    
    // Update status with volume percentage
    const volumePercent = Math.round(volume * 100);
    updateStatus(`Volume: ${volumePercent}%`);
}

function handleActionButton(action) {
    const videoId = getVideoIdFromURL();
    
    switch(action) {
        case 'Add to Favorites':
            addToFavorites(videoId);
            break;
        case 'Share Video':
            shareVideo(videoId);
            break;
        case 'Flag as Inappropriate':
            flagVideo(videoId);
            break;
    }
}

/**
 * Setup subscribe button for the video uploader
 */
async function setupSubscribeButton(channelName) {
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (!subscribeBtn || !channelName) return;
    
    const currentUser = localStorage.getItem('username') || 'guest';
    
    // Don't show subscribe button for guest users or if viewing own channel
    if (currentUser.toLowerCase() === 'guest' || currentUser === channelName) {
        subscribeBtn.style.display = 'none';
        return;
    }
    
    // Show the subscribe button
    subscribeBtn.style.display = 'inline-block';
    
    // Check if already subscribed
    if (typeof WigTubeDB !== 'undefined') {
        try {
            const isSubscribed = await WigTubeDB.isSubscribed(channelName);
            subscribeBtn.textContent = isSubscribed ? 'Subscribed ✓' : 'Subscribe';
            subscribeBtn.className = isSubscribed ? 'subscribe-btn subscribed' : 'subscribe-btn';
        } catch (error) {
            console.error('Error checking subscription status:', error);
        }
    }
    
    // Add click handler
    subscribeBtn.onclick = async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (typeof WigTubeDB === 'undefined') {
            alert('Database not available. Please try again later.');
            return;
        }
        
        try {
            const isSubscribed = await WigTubeDB.isSubscribed(channelName);
            
            if (isSubscribed) {
                // Unsubscribe
                const success = await WigTubeDB.unsubscribeFromChannel(channelName);
                if (success) {
                    subscribeBtn.textContent = 'Subscribe';
                    subscribeBtn.className = 'subscribe-btn';
                    updateStatus(`Unsubscribed from ${channelName}`);
                }
            } else {
                // Subscribe
                const success = await WigTubeDB.subscribeToChannel(channelName);
                if (success) {
                    subscribeBtn.textContent = 'Subscribed ✓';
                    subscribeBtn.className = 'subscribe-btn subscribed';
                    updateStatus(`Subscribed to ${channelName}!`);
                    
                    // Track achievement for gaining a subscriber
                    if (typeof WigTubeAchievements !== 'undefined') {
                        WigTubeAchievements.onSubscriberGained(channelName);
                    }
                } else {
                    alert('Unable to subscribe. You may already be subscribed or cannot subscribe to yourself.');
                }
            }
        } catch (error) {
            console.error('Error toggling subscription:', error);
            alert('Error updating subscription. Please try again.');
        }
    };
}

function addToFavorites(videoId) {
    // Use WigTubeDB if available
    if (typeof WigTubeDB !== 'undefined') {
        const isFavorited = WigTubeDB.isFavorited(videoId);
        
        if (isFavorited) {
            // Remove from favorites
            const removed = WigTubeDB.removeFromFavorites(videoId);
            if (removed) {
                // Visual feedback
                const favoriteBtn = document.querySelector('.action-btn');
                favoriteBtn.textContent = '☆ Removed from Favorites';
                favoriteBtn.style.background = '#ffcccc';
                
                setTimeout(() => {
                    favoriteBtn.textContent = 'Add to Favorites';
                    favoriteBtn.style.background = '';
                }, 2000);
                
                updateStatus(`Removed "${currentVideo.title}" from favorites`);
            }
        } else {
            // Add to favorites
            const added = WigTubeDB.addToFavorites(videoId, {
                title: currentVideo.title,
                thumbnail: currentVideo.thumbnail,
                duration: currentVideo.duration,
                author: currentVideo.uploader
            });
            
            if (added) {
                // Visual feedback
                const favoriteBtn = document.querySelector('.action-btn');
                favoriteBtn.textContent = '⭐ Added to Favorites';
                favoriteBtn.style.background = '#90EE90';
                
                setTimeout(() => {
                    favoriteBtn.textContent = 'Remove from Favorites';
                    favoriteBtn.style.background = '';
                }, 2000);
                
                updateStatus(`Added "${currentVideo.title}" to favorites`);
            }
        }
        
        return;
    }
    
    // Fallback to old method if WigTubeDB not available
    let favorites = getWigTubeProperty('favorites') || [];
    
    // Check if already in favorites
    if (favorites.includes(videoId)) {
        updateStatus('Video already in favorites');
        return;
    }
    
    // Add to favorites
    favorites.push(videoId);
    updateWigTubeProperty('favorites', favorites);
    
    // Visual feedback
    const favoriteBtn = document.querySelector('.action-btn');
    const originalText = favoriteBtn.textContent;
    favoriteBtn.textContent = '⭐ Added!';
    favoriteBtn.style.background = '#90EE90';
    
    setTimeout(() => {
        favoriteBtn.textContent = originalText;
        favoriteBtn.style.background = '';
    }, 2000);
    
    updateStatus(`Added "${currentVideo.title}" to favorites`);
}

function shareVideo(videoId) {
    // Create shareable URL
    const shareUrl = `${window.location.origin}/apps/browser/pages/wigtube-player.html?v=${videoId}`;
    
    // Try to use the Clipboard API if available
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            updateStatus('Video URL copied to clipboard!');
        }).catch(() => {
            showShareDialog(shareUrl);
        });
    } else {
        showShareDialog(shareUrl);
    }
    
    // Visual feedback
    const shareBtn = document.querySelectorAll('.action-btn')[1];
    const originalText = shareBtn.textContent;
    shareBtn.textContent = '🔗 Copied!';
    shareBtn.style.background = '#87CEEB';
    
    setTimeout(() => {
        shareBtn.textContent = originalText;
        shareBtn.style.background = '';
    }, 2000);
}

function showShareDialog(url) {
    // Create a temporary text area to copy the URL
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        updateStatus('Video URL copied to clipboard!');
    } catch (err) {
        updateStatus(`Share URL: ${url}`);
    }
    
    document.body.removeChild(textArea);
}

function flagVideo(videoId) {
    // Store flag in centralized storage (simulated reporting system)
    let flaggedVideos = getWigTubeProperty('flagged') || [];
    
    if (flaggedVideos.some(flag => flag.videoId === videoId)) {
        updateStatus('Video already flagged for review');
        return;
    }
    
    flaggedVideos.push({
        videoId: videoId,
        timestamp: Date.now(),
        title: currentVideo.title
    });
    
    updateWigTubeProperty('flagged', flaggedVideos);
    
    // Visual feedback
    const flagBtn = document.querySelectorAll('.action-btn')[2];
    const originalText = flagBtn.textContent;
    flagBtn.textContent = '🚨 Reported';
    flagBtn.style.background = '#FFB6C1';
    
    setTimeout(() => {
        flagBtn.textContent = originalText;
        flagBtn.style.background = '';
    }, 2000);
    
    updateStatus('Video flagged for moderation review');
}

async function deleteComment(commentId) {
    debugLog('deleteComment: Deleting comment', commentId);
    
    // Get current username
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername || currentUsername.toLowerCase() === 'guest') {
        alert('⚠️ Delete Error\\n\\nYou must be logged in to delete comments.');
        return;
    }
    
    const videoId = currentVideoId || getVideoIdFromURL();
    
    // Check if user is the author of this comment
    let commentAuthor = null;
    try {
        if (typeof WigTubeDB !== 'undefined') {
            const comments = await WigTubeDB.getComments(videoId);
            const comment = comments.find(c => c.id === commentId);
            commentAuthor = comment ? comment.author : null;
        } else {
            const allComments = getWigTubeProperty('comments') || {};
            const comments = allComments[videoId] || [];
            const comment = comments.find(c => c.id === commentId);
            commentAuthor = comment ? comment.author : null;
        }
        
        if (!commentAuthor) {
            alert('⚠️ Delete Error\\n\\nComment not found.');
            return;
        }
        
        // Check if current user is the author
        if (commentAuthor !== currentUsername) {
            alert('⚠️ Delete Error\\n\\nYou can only delete your own comments.\\n\\nThis comment belongs to: ' + commentAuthor);
            return;
        }
        
    } catch (error) {
        console.error('Error checking comment ownership:', error);
        alert('⚠️ Delete Error\\n\\nFailed to verify comment ownership.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this comment?')) {
        debugLog('deleteComment: User cancelled');
        return;
    }
    
    try {
        if (typeof WigTubeDB !== 'undefined') {
            debugLog('deleteComment: Using WigTubeDB');
            await WigTubeDB.deleteComment(videoId, commentId);
            updateStatus('Comment deleted');
            debugLog('deleteComment: Successfully deleted from Firestore');
        } else {
            debugLog('deleteComment: Using localStorage');
            // Fallback to localStorage
            const allComments = getWigTubeProperty('comments') || {};
            const comments = allComments[videoId] || [];
            allComments[videoId] = comments.filter(c => c.id !== commentId);
            updateWigTubeProperty('comments', allComments);
            updateStatus('Comment deleted');
            debugLog('deleteComment: Successfully deleted from localStorage');
        }
        
        // Reload comments to refresh the display
        await loadComments();
        debugLog('deleteComment: Comments reloaded');
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        debugLog('deleteComment: ERROR', error);
        updateStatus('Failed to delete comment');
    }
}

async function addComment(commentText, imageData = null) {
    debugLog('addComment: Starting', { text: commentText, hasImage: !!imageData });
    
    const timeString = 'Just now';
    
    // Get username from localStorage, default to 'Guest' if not found
    const username = localStorage.getItem('username') || 'Guest';
    
    // Prevent guest accounts from commenting
    if (!username || username.toLowerCase() === 'guest') {
        alert('⚠️ Comment Error\\n\\nGuest accounts cannot post comments.\\n\\nPlease log in with a registered account to comment.');
        return;
    }
    
    // Save comment to WigTubeDB (Firestore) first
    if (typeof WigTubeDB !== 'undefined') {
        const videoId = currentVideoId || getVideoIdFromURL();
        debugLog('addComment: Saving to WigTubeDB for video', videoId);
        try {
            await WigTubeDB.addComment(videoId, {
                author: username,
                text: commentText,
                image: imageData
            });
            console.log('Comment saved to Firestore');
            debugLog('addComment: Successfully saved to Firestore');
            updateStatus('Comment posted successfully');
            
            // Track achievement for commenting
            if (typeof WigTubeAchievements !== 'undefined') {
                WigTubeAchievements.onCommentPosted();
            }
            
            // Reload all comments from Firestore to prevent duplicates
            await loadComments();
            debugLog('addComment: Comments reloaded');
        } catch (error) {
            console.error('Error saving comment:', error);
            debugLog('addComment: ERROR saving to Firestore', error);
            updateStatus('Comment posted (offline mode)');
        }
    } else {
        debugLog('addComment: WigTubeDB not available, using localStorage');
        // Fallback to old localStorage method if WigTubeDB not available
        saveComment(commentText, imageData, timeString, username);
        updateStatus('Comment posted successfully');
        
        // Reload comments from localStorage
        loadComments();
    }
}

function saveComment(text, imageData, timeString, username = 'Guest') {
    debugLog('saveComment: Saving to localStorage');
    const videoId = getVideoIdFromURL();
    const allComments = getWigTubeProperty('comments') || {};
    const comments = allComments[videoId] || [];
    
    comments.unshift({
        text: text,
        image: imageData,
        time: timeString,
        author: username,
        timestamp: Date.now()
    });
    
    // Keep only last 50 comments to prevent storage bloat
    if (comments.length > 50) {
        comments.splice(50);
    }
    
    allComments[videoId] = comments;
    updateWigTubeProperty('comments', allComments);
    debugLog('saveComment: Saved to localStorage', comments.length, 'comments');
}

async function loadComments() {
    debugLog('loadComments: Starting');
    const videoId = currentVideoId || getVideoIdFromURL();
    debugLog('loadComments: Video ID:', videoId);
    const commentsList = document.querySelector('.comments-list');
    
    // Clear existing comments
    commentsList.innerHTML = '';
    
    let comments = [];
    
    // Try to load from WigTubeDB (Firestore)
    if (typeof WigTubeDB !== 'undefined') {
        debugLog('loadComments: Loading from WigTubeDB');
        try {
            comments = await WigTubeDB.getComments(videoId);
            console.log(`Loaded ${comments.length} comments from WigTubeDB`);
            debugLog('loadComments: Loaded', comments.length, 'comments from WigTubeDB');
        } catch (error) {
            console.error('Error loading comments from WigTubeDB:', error);
            debugLog('loadComments: ERROR loading from WigTubeDB', error);
            // Fallback to localStorage
            const allComments = getWigTubeProperty('comments') || {};
            comments = allComments[videoId] || [];
            debugLog('loadComments: Fallback -', comments.length, 'comments from localStorage');
        }
    } else {
        debugLog('loadComments: WigTubeDB not available, using localStorage');
        // Fallback to localStorage
        const allComments = getWigTubeProperty('comments') || {};
        comments = allComments[videoId] || [];
        debugLog('loadComments:', comments.length, 'comments from localStorage');
    }
    
    debugLog('loadComments: Displaying', comments.length, 'comments');
    
    // Get current username for comparison
    const currentUsername = localStorage.getItem('username');
    
    // Display comments
    for (const comment of comments) {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.dataset.commentId = comment.id; // Store comment ID for deletion
        
        let imageHTML = '';
        if (comment.image) {
            imageHTML = `<div class="comment-image"><img src="${comment.image}" alt="Comment image"></div>`;
        }
        
        // Get profile picture for comment author (async load from Firebase if needed)
        let profilePicHTML = '';
        let authorPfp = null;
        
        // First check cache
        if (window.getUserProfilePicture) {
            authorPfp = window.getUserProfilePicture(comment.author);
        }
        
        // If not in cache and not guest, load from Firebase user profile
        if (!authorPfp && comment.author && comment.author.toLowerCase() !== 'guest') {
            // Try to load from Firebase users collection
            if (window.firebaseAPI && window.firebaseAPI.db && window.firebaseOnline) {
                try {
                    const { doc, getDoc } = window.firebaseAPI;
                    const userDoc = await getDoc(doc(window.firebaseAPI.db, "users", comment.author));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.profilePicture) {
                            authorPfp = userData.profilePicture;
                            // Cache it for future use
                            localStorage.setItem(`pfp_${comment.author}`, authorPfp);
                        }
                    }
                } catch (e) {
                    console.error('Error loading profile picture from Firebase for', comment.author, e);
                }
            }
        }
        
        if (authorPfp) {
            profilePicHTML = `<img src="${authorPfp}" alt="${comment.author}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 8px; border: 1px solid #999;">`;
        } else {
            profilePicHTML = `<div style="width: 32px; height: 32px; border-radius: 50%; background: #ccc; margin-right: 8px; border: 1px solid #999; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #666;">${(comment.author || 'G').charAt(0).toUpperCase()}</div>`;
        }
        
        // Format timestamp
        let timeString = comment.time || 'Just now';
        if (comment.timestamp) {
            const commentDate = new Date(comment.timestamp);
            const now = new Date();
            const diffMs = now - commentDate;
            const diffSecs = Math.floor(diffMs / 1000);
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            const diffWeeks = Math.floor(diffMs / 604800000); // 7 days
            const diffMonths = Math.floor(diffMs / 2592000000); // 30 days
            const diffYears = Math.floor(diffMs / 31536000000); // 365 days
            
            if (diffSecs < 60) {
                timeString = 'Just now';
            } else if (diffMins < 60) {
                timeString = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
            } else if (diffHours < 24) {
                timeString = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else if (diffDays < 7) {
                timeString = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            } else if (diffWeeks < 4) {
                timeString = `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
            } else if (diffMonths < 12) {
                timeString = `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
            } else {
                timeString = `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
            }
        }
        
        // Only show delete button if current user is the author
        const isAuthor = currentUsername && (comment.author === currentUsername);
        const deleteButtonHTML = isAuthor 
            ? `<button class="comment-delete-btn" onclick="deleteComment('${comment.id}')" title="Delete comment">🗑️</button>`
            : '';
        
        // Reply button (show for logged-in users)
        const canReply = currentUsername && currentUsername !== 'guest';
        const replyButtonHTML = canReply
            ? `<button class="comment-reply-btn" onclick="toggleReplyBox('${comment.id}')" style="
                margin-left: 40px;
                margin-top: 8px;
                padding: 4px 10px;
                background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                color: #000;
                border: 2px outset #d4d0c8;
                cursor: pointer;
                font-size: 10px;
                font-family: 'MS Sans Serif', sans-serif;
            ">💬 Reply</button>`
            : '';
        
        commentElement.innerHTML = `
            <div class="comment-header" style="display: flex; align-items: center;">
                ${profilePicHTML}
                <div style="flex: 1;">
                    <div class="comment-author">${comment.author || 'Guest'}</div>
                    <div class="comment-time">${timeString}</div>
                </div>
                ${deleteButtonHTML}
            </div>
            <div class="comment-text" style="margin-left: 40px;">${comment.text}</div>
            ${imageHTML ? `<div style="margin-left: 40px;">${imageHTML}</div>` : ''}
            ${replyButtonHTML}
            <div id="replyBox_${comment.id}" style="display: none; margin-left: 40px; margin-top: 12px;">
                <textarea id="replyInput_${comment.id}" placeholder="Add a reply..." style="
                    width: 100%;
                    height: 60px;
                    padding: 8px;
                    border: 2px inset #d4d0c8;
                    font-size: 11px;
                    font-family: 'MS Sans Serif', sans-serif;
                    resize: vertical;
                "></textarea>
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                    <button onclick="submitReply('${comment.id}')" style="
                        padding: 4px 12px;
                        background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                        color: #000;
                        border: 2px outset #d4d0c8;
                        cursor: pointer;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                        font-weight: bold;
                    ">Post Reply</button>
                    <button onclick="toggleReplyBox('${comment.id}')" style="
                        padding: 4px 12px;
                        background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                        color: #000;
                        border: 2px outset #d4d0c8;
                        cursor: pointer;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">Cancel</button>
                </div>
            </div>
            <div id="replies_${comment.id}" style="margin-left: 40px; margin-top: 12px;"></div>
        `;
        
        commentsList.appendChild(commentElement);
        
        // Display replies if they exist
        if (comment.replies && comment.replies.length > 0) {
            displayReplies(comment.id, comment.replies);
        }
    }
    
    // Update comment count
    const commentCountSpan = document.getElementById('commentCount');
    if (commentCountSpan) {
        commentCountSpan.textContent = comments.length;
        debugLog('loadComments: Updated count to', comments.length);
    }
    
    debugLog('loadComments: Complete');
}

function getVideoIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v') || 'epic-minecraft-castle-build';
}

function getPlaylistIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('playlist');
}

function showImagePreview(imageData) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    previewImg.src = imageData;
    preview.style.display = 'block';
}

function removeImagePreview() {
    const preview = document.getElementById('imagePreview');
    const fileInput = document.getElementById('imageUpload');
    
    preview.style.display = 'none';
    fileInput.value = '';
    selectedImage = null;
}

async function populateRelatedVideos() {
    const relatedVideosList = document.getElementById('relatedVideosList');
    const currentVideoId = getVideoIdFromURL();
    const playlistId = getPlaylistIdFromURL();
    
    // Clear existing content
    relatedVideosList.innerHTML = '<div style="padding: 8px; font-size: 10px; color: #666;">Loading...</div>';
    
    // If in playlist mode, show playlist videos instead
    if (playlistId) {
        await populatePlaylistVideos(playlistId, currentVideoId);
        return;
    }
    
    try {
        // Get current video to check its tags
        const currentVideoData = await window.WigTubeDB.getVideoById(currentVideoId);
        const currentTags = currentVideoData?.tags || [];
        
        // Get all videos from database
        const allVideos = await window.WigTubeDB.getAllVideos();
        
        // Filter and score videos based on matching tags
        const scoredVideos = allVideos
            .filter(video => video.id !== currentVideoId && video.visibility === 'public')
            .map(video => {
                const videoTags = video.tags || [];
                // Count matching tags
                const matchingTags = videoTags.filter(tag => 
                    currentTags.some(currentTag => 
                        currentTag.toLowerCase() === tag.toLowerCase()
                    )
                ).length;
                
                return {
                    ...video,
                    matchScore: matchingTags
                };
            })
            .filter(video => video.matchScore > 0) // Only videos with at least 1 matching tag
            .sort((a, b) => {
                // Sort by match score first, then by view count
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore;
                }
                return (b.viewCount || 0) - (a.viewCount || 0);
            });
        
        // If we have tagged videos, use them; otherwise fall back to recent videos
        let selectedVideos = scoredVideos.slice(0, 20);
        
        if (selectedVideos.length < 5) {
            // Not enough tag matches, add some recent videos
            const recentVideos = allVideos
                .filter(video => video.id !== currentVideoId && video.visibility === 'public')
                .sort((a, b) => (b.uploadDate || 0) - (a.uploadDate || 0))
                .slice(0, 20 - selectedVideos.length);
            
            selectedVideos = [...selectedVideos, ...recentVideos];
        }
        
        // Clear loading message
        relatedVideosList.innerHTML = '';
        
        if (selectedVideos.length === 0) {
            relatedVideosList.innerHTML = '<div style="padding: 8px; font-size: 10px; color: #666;">No related videos found.</div>';
            return;
        }
        
        selectedVideos.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'related-video';
            videoElement.onclick = () => loadRelatedVideo(video.id);
            
            const thumbnailHtml = video.thumbnail ?
                `<img src="${video.thumbnail}" alt="${video.title}" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(45deg, #667eea, #764ba2)'; this.parentElement.innerHTML='<div style=\\'display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; width: 100%; height: 100%;\\'>📺</div>';">` :
                `<div style="background: linear-gradient(45deg, #667eea, #764ba2); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white;">📺</div>`;
            
            const viewCount = window.WigTubeDB.formatViewCount(video.viewCount || 0);
            const uploadDate = window.WigTubeDB.formatTimestamp(video.uploadDate);
            
            videoElement.innerHTML = `
                <div class="related-thumbnail">
                    ${thumbnailHtml}
                    <div class="related-duration">${video.duration || '0:00'}</div>
                </div>
                <div class="related-info">
                    <h4>${video.title || 'Untitled Video'}</h4>
                    <div class="related-meta">by ${video.uploaderName || video.uploader || 'Anonymous'}</div>
                    <div class="related-meta">${viewCount} • ${uploadDate}</div>
                </div>
            `;
            
            relatedVideosList.appendChild(videoElement);
        });
    } catch (error) {
        console.error('Error loading related videos:', error);
        relatedVideosList.innerHTML = '<div style="padding: 8px; font-size: 10px; color: #ff0000;">Error loading related videos.</div>';
    }
}

/**
 * Populate playlist videos in sidebar
 */
async function populatePlaylistVideos(playlistId, currentVideoId) {
    const relatedVideosList = document.getElementById('relatedVideosList');
    const username = localStorage.getItem('username') || 'guest';
    
    try {
        // Get playlist data
        const playlist = await window.WigTubeDB.getPlaylistById(playlistId, username);
        
        if (!playlist) {
            relatedVideosList.innerHTML = '<div style="padding: 8px; font-size: 10px; color: #ff0000;">Playlist not found.</div>';
            return;
        }
        
        // Update sidebar header to show playlist info
        const sidebarHeader = document.querySelector('.sidebar-header');
        if (sidebarHeader) {
            const currentIndex = playlist.videos.indexOf(currentVideoId) + 1;
            const totalVideos = playlist.videos.length;
            sidebarHeader.textContent = `${playlist.name}`;
            
            // Add playlist info below header
            const playlistInfo = document.createElement('div');
            playlistInfo.style.cssText = `
                padding: 8px;
                font-size: 10px;
                color: #666;
                border-bottom: 2px groove #d4d0c8;
                background: #f0f0f0;
            `;
            playlistInfo.textContent = `${currentIndex} / ${totalVideos} videos`;
            
            // Insert after header if not already there
            if (!sidebarHeader.nextElementSibling?.classList?.contains('playlist-info')) {
                playlistInfo.classList.add('playlist-info');
                sidebarHeader.parentElement.insertBefore(playlistInfo, relatedVideosList);
            }
        }
        
        // Clear loading message
        relatedVideosList.innerHTML = '';
        
        if (playlist.videos.length === 0) {
            relatedVideosList.innerHTML = '<div style="padding: 8px; font-size: 10px; color: #666;">No videos in this playlist.</div>';
            return;
        }
        
        // Load and display each video in the playlist
        for (let i = 0; i < playlist.videos.length; i++) {
            const videoId = playlist.videos[i];
            const video = await window.WigTubeDB.getVideoById(videoId);
            
            if (!video) continue;
            
            const isCurrentVideo = videoId === currentVideoId;
            
            const videoElement = document.createElement('div');
            videoElement.className = 'related-video';
            videoElement.style.cssText = `
                cursor: pointer;
                margin-bottom: 8px;
                padding: 8px;
                border: 2px ${isCurrentVideo ? 'inset' : 'outset'} #d4d0c8;
                background: ${isCurrentVideo ? '#e0e0e0' : '#f0f0f0'};
                position: relative;
            `;
            
            // Add video number badge
            const numberBadge = document.createElement('div');
            numberBadge.style.cssText = `
                position: absolute;
                top: 8px;
                left: 8px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: bold;
                border-radius: 2px;
                z-index: 1;
            `;
            numberBadge.textContent = i + 1;
            
            const thumbnailHtml = video.thumbnail ?
                `<img src="${video.thumbnail}" alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(45deg, #667eea, #764ba2)'; this.parentElement.innerHTML='<div style=\\'display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; width: 100%; height: 100%;\\'>📺</div>';">` :
                `<div style="background: linear-gradient(45deg, #667eea, #764ba2); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white;">📺</div>`;
            
            const viewCount = window.WigTubeDB.formatViewCount(video.viewCount || 0);
            
            videoElement.innerHTML = `
                <div class="related-thumbnail" style="position: relative;">
                    ${thumbnailHtml}
                    <div class="related-duration">${video.duration || '0:00'}</div>
                </div>
                <div class="related-info">
                    <h4 style="${isCurrentVideo ? 'color: #000080; font-weight: bold;' : ''}">${video.title || 'Untitled Video'}</h4>
                    <div class="related-meta">${video.uploader || 'Anonymous'}</div>
                    <div class="related-meta">${viewCount}</div>
                </div>
            `;
            
            videoElement.insertBefore(numberBadge, videoElement.firstChild);
            
            // Click handler to play this video in playlist context
            if (!isCurrentVideo) {
                videoElement.onclick = () => {
                    window.location.href = `wigtube-player.html?v=${videoId}&playlist=${playlistId}`;
                };
                
                videoElement.addEventListener('mouseenter', () => {
                    videoElement.style.background = '#e8e8e8';
                });
                
                videoElement.addEventListener('mouseleave', () => {
                    videoElement.style.background = '#f0f0f0';
                });
            } else {
                videoElement.style.cursor = 'default';
            }
            
            relatedVideosList.appendChild(videoElement);
        }
        
        // Add auto-play next functionality
        setupAutoPlayNext(playlist, currentVideoId, playlistId);
        
    } catch (error) {
        console.error('Error loading playlist videos:', error);
        relatedVideosList.innerHTML = '<div style="padding: 8px; font-size: 10px; color: #ff0000;">Error loading playlist.</div>';
    }
}

/**
 * Setup auto-play next video in playlist
 */
function setupAutoPlayNext(playlist, currentVideoId, playlistId) {
    const currentIndex = playlist.videos.indexOf(currentVideoId);
    const nextIndex = currentIndex + 1;
    
    // If there's a next video, set up auto-play
    if (nextIndex < playlist.videos.length) {
        const nextVideoId = playlist.videos[nextIndex];
        
        // Listen for video end event
        const checkVideoEnd = setInterval(() => {
            // In the simulated player, check if we've reached the end
            const progressFill = document.getElementById('progressFill');
            const currentTimeSpan = document.getElementById('currentTime');
            const totalTimeSpan = document.getElementById('totalTime');
            
            if (progressFill && currentTimeSpan && totalTimeSpan) {
                const currentWidth = parseFloat(progressFill.style.width || '0');
                
                // If video is at 100% (or very close), play next
                if (currentWidth >= 99.5) {
                    clearInterval(checkVideoEnd);
                    
                    // Small delay before auto-playing next
                    setTimeout(() => {
                        window.location.href = `?v=${nextVideoId}&playlist=${playlistId}`;
                    }, 1000);
                }
            }
        }, 500);
        
        // Clear interval when page unloads
        window.addEventListener('beforeunload', () => clearInterval(checkVideoEnd));
    }
}

async function loadRelatedVideo(videoId) {
    // Update URL and reload video
    const newUrl = `${window.location.pathname}?v=${videoId}`;
    window.history.pushState({}, '', newUrl);
    
    // Stop current video
    stopVideo();
    
    // Load new video
    await loadVideo(videoId);
    
    // Clear and repopulate related videos
    document.getElementById('relatedVideosList').innerHTML = '';
    await populateRelatedVideos();
    
    // Note: loadComments() is already called inside loadVideo()
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function goBack() {
    // Return to main WigTube page
    window.history.back();
}

function goBackToWigtube() {
    // Always navigate directly to WigTube homepage
    window.location.href = '/apps/browser/pages/wigtube.html';
}

function updateStatus(message) {
    document.getElementById('statusText').textContent = message;
}

// Handle browser back/forward buttons
window.addEventListener('popstate', async function(event) {
    await initializePlayer();
    // Note: loadComments() is already called inside loadVideo()
});

// Simulate early internet connection quality
setTimeout(() => {
    const connectionStatus = document.querySelector('.connection-status span');
    const connections = [
        'Connection: Dial-up (56k modem)',
        'Connection: DSL (Low Quality)',
        'Connection: Broadband (High Quality)',
        'Connection: T1 Line (Premium)'
    ];
    
    const randomConnection = connections[Math.floor(Math.random() * connections.length)];
    connectionStatus.textContent = randomConnection;
}, 2000);

// ============================================
// Album/Playlist Functions (2003 YouTube Style)
// ============================================

/**
 * Load an album/playlist and start autoplay
 */
async function loadAlbum(albumId) {
    const album = albumData[albumId];
    if (!album || !album.tracks || album.tracks.length === 0) {
        console.error('Album not found or empty:', albumId);
        await loadVideo('epic-minecraft-castle-build');
        return;
    }
    
    currentAlbum = album;
    currentTrackIndex = 0;
    isPlayingAlbum = true;
    
    // Display album playlist UI
    displayAlbumPlaylist(album);
    
    // Load first track
    const firstTrackId = album.tracks[0];
    await loadVideo(firstTrackId);
    
    updateStatus(`Playing album: ${album.title} (Track 1 of ${album.tracks.length})`);
}

/**
 * Display album playlist in 2003 YouTube style
 */
function displayAlbumPlaylist(album) {
    // Check if playlist section already exists
    let playlistSection = document.getElementById('albumPlaylistSection');
    
    if (!playlistSection) {
        // Create playlist section
        playlistSection = document.createElement('div');
        playlistSection.id = 'albumPlaylistSection';
        playlistSection.className = 'album-playlist-section';
        
        // Insert after video player
        const videoSection = document.querySelector('.video-section');
        if (videoSection) {
            videoSection.insertBefore(playlistSection, videoSection.firstChild.nextSibling);
        }
    }
    
    // 2003 YouTube style
    playlistSection.style.cssText = `
        background: #e8e8e8;
        border: 3px ridge #999;
        padding: 0;
        margin: 15px 0;
        font-family: 'Arial', sans-serif;
        box-shadow: 3px 3px 0px #666;
    `;
    
    // Build track list HTML
    let tracksHtml = '';
    album.tracks.forEach((trackId, index) => {
        const trackVideo = videoData[trackId];
        if (trackVideo) {
            const isCurrentTrack = index === currentTrackIndex;
            tracksHtml += `
                <div class="playlist-track ${isCurrentTrack ? 'current-track' : ''}" 
                     data-track-index="${index}"
                     style="
                         padding: 8px 10px;
                         border-bottom: 1px solid #ccc;
                         cursor: pointer;
                         background: ${isCurrentTrack ? '#ffffcc' : 'white'};
                         display: flex;
                         align-items: center;
                         transition: background 0.2s;
                     "
                     onmouseover="this.style.background='${isCurrentTrack ? '#ffffcc' : '#f0f0f0'}'"
                     onmouseout="this.style.background='${isCurrentTrack ? '#ffffcc' : 'white'}'">
                    <span style="font-weight: bold; color: #666; margin-right: 10px; min-width: 25px;">${index + 1}.</span>
                    <img src="${trackVideo.thumbnail}" 
                         style="width: 60px; height: 45px; object-fit: cover; border: 1px solid #999; margin-right: 10px;"
                         onerror="this.style.display='none';">
                    <div style="flex: 1;">
                        <div style="font-weight: ${isCurrentTrack ? 'bold' : 'normal'}; color: ${isCurrentTrack ? '#c00' : '#333'};">
                            ${isCurrentTrack ? '▶ ' : ''}${trackVideo.title}
                        </div>
                        <div style="font-size: 10px; color: #666;">
                            by ${trackVideo.uploader} • ${trackVideo.duration}
                        </div>
                    </div>
                    ${isCurrentTrack ? '<span style="color: #c00; font-weight: bold; margin-left: 10px;">NOW PLAYING</span>' : ''}
                </div>
            `;
        }
    });
    
    playlistSection.innerHTML = `
        <div style="
            background: linear-gradient(to bottom, #4d79cc, #3366cc);
            color: white;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 13px;
            border-bottom: 3px ridge #1a3d7a;
            display: flex;
            justify-content: space-between;
            align-items: center;
        ">
            <div>
                📀 <span style="font-size: 14px;">${album.title}</span>
                <span style="font-size: 10px; font-weight: normal; margin-left: 10px;">
                    (${album.tracks.length} tracks • ${album.totalDuration})
                </span>
            </div>
            <button onclick="closeAlbumPlaylist()" 
                    style="
                        background: white;
                        border: 2px outset #ddd;
                        padding: 2px 8px;
                        cursor: pointer;
                        font-size: 11px;
                        font-weight: bold;
                    ">
                ✕ Close
            </button>
        </div>
        <div style="
            padding: 10px;
            background: white;
            border-bottom: 1px solid #ccc;
            font-size: 11px;
            color: #555;
        ">
            <strong>Album by:</strong> ${album.creator} | 
            <strong>Created:</strong> ${album.created} | 
            <strong>Autoplay:</strong> <span style="color: green; font-weight: bold;">✓ ON</span>
        </div>
        <div style="max-height: 300px; overflow-y: auto; background: white;">
            ${tracksHtml}
        </div>
        <div style="
            padding: 8px 10px;
            background: #f0f0f0;
            border-top: 2px solid #999;
            font-size: 10px;
            color: #666;
            text-align: center;
        ">
            ${album.description}
        </div>
    `;
    
    playlistSection.style.display = 'block';
    
    // Add click handlers to tracks
    setTimeout(() => {
        document.querySelectorAll('.playlist-track').forEach(track => {
            track.addEventListener('click', function() {
                const trackIndex = parseInt(this.getAttribute('data-track-index'));
                jumpToTrack(trackIndex);
            });
        });
    }, 100);
}

/**
 * Play next track in album
 */
async function playNextTrack() {
    if (!currentAlbum || !isPlayingAlbum) return;
    
    currentTrackIndex++;
    
    // Check if we've reached the end of the album
    if (currentTrackIndex >= currentAlbum.tracks.length) {
        updateStatus(`Album finished: ${currentAlbum.title}`);
        isPlayingAlbum = false;
        currentAlbum = null;
        currentTrackIndex = 0;
        stopVideo();
        return;
    }
    
    // Load next track
    const nextTrackId = currentAlbum.tracks[currentTrackIndex];
    stopVideo();
    
    setTimeout(async () => {
        await loadVideo(nextTrackId);
        displayAlbumPlaylist(currentAlbum); // Refresh playlist UI
        
        // Auto-play next track
        setTimeout(() => {
            playVideo();
        }, 1000);
        
        updateStatus(`Playing track ${currentTrackIndex + 1} of ${currentAlbum.tracks.length}: ${videoData[nextTrackId].title}`);
    }, 500);
}

/**
 * Jump to specific track in album
 */
async function jumpToTrack(trackIndex) {
    if (!currentAlbum || trackIndex < 0 || trackIndex >= currentAlbum.tracks.length) return;
    
    currentTrackIndex = trackIndex;
    const trackId = currentAlbum.tracks[trackIndex];
    
    stopVideo();
    
    setTimeout(async () => {
        await loadVideo(trackId);
        displayAlbumPlaylist(currentAlbum); // Refresh playlist UI
        
        // Auto-play selected track
        setTimeout(() => {
            playVideo();
        }, 1000);
        
        updateStatus(`Playing track ${currentTrackIndex + 1} of ${currentAlbum.tracks.length}: ${videoData[trackId].title}`);
    }, 500);
}

/**
 * Close album playlist and return to normal mode
 */
function closeAlbumPlaylist() {
    const playlistSection = document.getElementById('albumPlaylistSection');
    if (playlistSection) {
        playlistSection.remove();
    }
    
    isPlayingAlbum = false;
    currentAlbum = null;
    currentTrackIndex = 0;
    
    updateStatus('Exited album mode');
}

/**
 * Create album browser page (to be called from main wigtube page)
 */
function createAlbumBrowser() {
    // This will be used to show all available albums
    let albumsHtml = '<div class="albums-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; padding: 20px;">';
    
    Object.values(albumData).forEach(album => {
        albumsHtml += `
            <div class="album-card" 
                 style="
                     background: white;
                     border: 2px solid #ccc;
                     border-top: 2px solid #fff;
                     border-left: 2px solid #fff;
                     padding: 10px;
                     cursor: pointer;
                     box-shadow: 2px 2px 0px #999;
                 "
                 onclick="window.location.href='apps/browser/pages/wigtube-player.html?album=${album.id}'">
                <img src="${album.thumbnail}" 
                     style="width: 100%; height: 150px; object-fit: cover; border: 1px solid #999;"
                     onerror="this.style.display='none';">
                <h3 style="font-size: 12px; margin: 8px 0 4px 0; color: #333;">${album.title}</h3>
                <div style="font-size: 10px; color: #666;">
                    ${album.tracks.length} tracks • ${album.totalDuration}
                </div>
                <div style="font-size: 10px; color: #999; margin-top: 4px;">
                    by ${album.creator}
                </div>
            </div>
        `;
    });
    
    albumsHtml += '</div>';
    return albumsHtml;
}

// ============================================
// Album Section Functions (2003 YouTube Style)
// ============================================

/**
 * Display album information for music videos
 */
function displayAlbumSection(video) {
    // Check if album section already exists
    let albumSection = document.getElementById('albumSection');
    
    if (!albumSection) {
        // Create album section
        albumSection = document.createElement('div');
        albumSection.id = 'albumSection';
        albumSection.className = 'album-section';
        
        // Insert after video description
        const videoInfo = document.querySelector('.video-info');
        if (videoInfo) {
            videoInfo.parentNode.insertBefore(albumSection, videoInfo.nextSibling);
        }
    }
    
    // Populate album section with 2003 YouTube style
    albumSection.style.cssText = `
        background: #f0f0f0;
        border: 2px solid #ccc;
        border-top: 2px solid #fff;
        border-left: 2px solid #fff;
        padding: 10px;
        margin: 15px 0;
        font-family: 'Arial', sans-serif;
        box-shadow: 2px 2px 0px #999;
    `;
    
    albumSection.innerHTML = `
        <div style="background: linear-gradient(to bottom, #3366cc, #2952a3); color: white; padding: 5px 10px; margin: -10px -10px 10px -10px; font-weight: bold; font-size: 14px; border-bottom: 2px solid #1a3d7a;">
            🎵 Album Information
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td rowspan="6" style="width: 120px; padding: 10px; vertical-align: top;">
                    <div style="border: 2px solid #999; background: white; padding: 5px;">
                        <img src="${video.albumArt || video.thumbnail}" 
                             alt="Album Art" 
                             style="width: 100px; height: 100px; display: block; border: 1px solid #ccc;"
                             onerror="this.src='assets/images/thumbnail/beats.png';">
                    </div>
                </td>
                <td style="padding: 5px; border-bottom: 1px dotted #ccc;">
                    <strong>Album:</strong> ${video.album || 'Unknown Album'}
                </td>
            </tr>
            <tr>
                <td style="padding: 5px; border-bottom: 1px dotted #ccc;">
                    <strong>Artist:</strong> ${video.artist || video.uploader}
                </td>
            </tr>
            <tr>
                <td style="padding: 5px; border-bottom: 1px dotted #ccc;">
                    <strong>Year:</strong> ${video.year || 'Unknown'}
                </td>
            </tr>
            <tr>
                <td style="padding: 5px; border-bottom: 1px dotted #ccc;">
                    <strong>Genre:</strong> ${video.genre || 'Music'}
                </td>
            </tr>
            <tr>
                <td style="padding: 5px; border-bottom: 1px dotted #ccc;">
                    <strong>Duration:</strong> ${video.duration}
                </td>
            </tr>
            <tr>
                <td style="padding: 5px;">
                    <div style="margin-top: 5px;">
                        <button onclick="addToPlaylist('${video.title}', this)" 
                                style="background: white; border: 2px outset #ddd; padding: 3px 10px; cursor: pointer; font-size: 11px; margin-right: 5px;">
                            ➕ Add to Playlist
                        </button>
                        <button onclick="downloadTrack('${video.title}', this)" 
                                style="background: white; border: 2px outset #ddd; padding: 3px 10px; cursor: pointer; font-size: 11px;">
                            💾 Download
                        </button>
                    </div>
                </td>
            </tr>
        </table>
        <div style="margin-top: 10px; padding: 8px; background: white; border: 1px solid #ccc; font-size: 11px; color: #666;">
            <strong>Note:</strong> This is a music video. Album information is displayed for your convenience.
        </div>
    `;
    
    albumSection.style.display = 'block';
}

/**
 * Hide album section for non-music videos
 */
function hideAlbumSection() {
    const albumSection = document.getElementById('albumSection');
    if (albumSection) {
        albumSection.style.display = 'none';
    }
}

// ============================================
// User Playlist Management System
// ============================================

/**
 * Get all user playlists from localStorage
 */
/**
 * Migrate old localStorage playlists to new WigTubeDB format
 */
async function migrateOldPlaylists() {
    const username = localStorage.getItem('username');
    if (!username || username === 'guest') return;
    
    // Check if migration already done
    const migrationKey = `wigtube_playlists_migrated_${username}`;
    if (localStorage.getItem(migrationKey)) return;
    
    // Get old playlists
    const oldPlaylists = getWigTubeProperty('playlists') || {};
    const playlistNames = Object.keys(oldPlaylists);
    
    if (playlistNames.length === 0) {
        // Mark as migrated even if no playlists
        localStorage.setItem(migrationKey, 'true');
        return;
    }
    
    debugLog('Migrating old playlists to WigTubeDB:', playlistNames);
    
    try {
        // Migrate each playlist
        for (const name of playlistNames) {
            const oldPlaylist = oldPlaylists[name];
            
            // Convert tracks to video IDs
            const videoIds = oldPlaylist.tracks
                .map(track => track.videoId)
                .filter(id => id); // Remove null/undefined
            
            // Create new playlist in WigTubeDB
            await WigTubeDB.createPlaylist({
                name: name,
                description: `Migrated from local storage on ${new Date().toLocaleDateString()}`,
                isPublic: false,
                owner: username
            });
            
            // Get the newly created playlist
            const newPlaylists = await WigTubeDB.getUserPlaylists(username);
            const newPlaylist = newPlaylists.find(p => p.name === name);
            
            if (newPlaylist && videoIds.length > 0) {
                // Add all videos to the playlist
                for (const videoId of videoIds) {
                    try {
                        await WigTubeDB.addVideoToPlaylist(newPlaylist.id, videoId, username);
                    } catch (err) {
                        console.warn('Failed to add video to migrated playlist:', videoId, err);
                    }
                }
            }
        }
        
        // Mark migration as complete
        localStorage.setItem(migrationKey, 'true');
        
        // Clear old playlists
        updateWigTubeProperty('playlists', {});
        
        debugLog('Playlist migration completed successfully');
    } catch (error) {
        console.error('Error migrating playlists:', error);
    }
}

/**
 * Get user playlists from WigTubeDB
 */
async function getUserPlaylists() {
    const username = localStorage.getItem('username');
    if (!username || username === 'guest') return [];
    
    try {
        return await WigTubeDB.getUserPlaylists(username);
    } catch (error) {
        console.error('Error getting playlists:', error);
        return [];
    }
}

/**
 * Create a new playlist
 */
async function createNewPlaylist(playlistName) {
    if (!playlistName || playlistName.trim() === '') {
        updateStatus('Please enter a playlist name');
        return false;
    }
    
    const username = localStorage.getItem('username');
    if (!username || username === 'guest') {
        updateStatus('Please log in to create playlists');
        return false;
    }
    
    try {
        // Check if playlist already exists
        const playlists = await getUserPlaylists();
        if (playlists.some(p => p.name === playlistName)) {
            updateStatus('Playlist already exists');
            return false;
        }
        
        // Create playlist in WigTubeDB
        await WigTubeDB.createPlaylist({
            name: playlistName,
            description: '',
            isPublic: false,
            owner: username
        });
        
        updateStatus(`Created playlist: ${playlistName}`);
        return true;
    } catch (error) {
        console.error('Error creating playlist:', error);
        updateStatus('Failed to create playlist');
        return false;
    }
}

/**
 * Delete a playlist
 */
async function deletePlaylist(playlistId) {
    const username = localStorage.getItem('username');
    if (!username || username === 'guest') return;
    
    try {
        const playlists = await getUserPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        
        if (!playlist) {
            updateStatus('Playlist not found');
            return;
        }
        
        if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
            await WigTubeDB.deletePlaylist(playlistId, username);
            updateStatus(`Deleted playlist: ${playlist.name}`);
            closePlaylistModal();
        }
    } catch (error) {
        console.error('Error deleting playlist:', error);
        updateStatus('Failed to delete playlist');
    }
}

/**
 * Show playlist selection modal
 */
async function showPlaylistModal(trackTitle, trackData, buttonElement) {
    const playlists = await getUserPlaylists();
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'playlistModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const playlistNames = playlists.map(p => p.name);
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #E0E0E0;
        border: 3px outset #fff;
        padding: 10px;
        min-width: 400px;
        max-width: 500px;
        max-height: 600px;
        overflow-y: auto;
        font-family: "MS Sans Serif", sans-serif;
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
    `;
    
    let playlistListHTML = '';
    if (playlists.length === 0) {
        playlistListHTML = '<div style="padding: 10px; text-align: center; color: #666;">No playlists yet. Create one below!</div>';
    } else {
        playlistListHTML = playlists.map(playlist => {
            const trackCount = playlist.videos?.length || 0;
            const videoIdToAdd = trackData?.videoId || currentVideoId;
            const isInPlaylist = playlist.videos && playlist.videos.includes(videoIdToAdd);
            
            return `
                <div style="
                    background: white;
                    border: 2px inset #ddd;
                    padding: 8px;
                    margin-bottom: 5px;
                    cursor: ${isInPlaylist ? 'not-allowed' : 'pointer'};
                    opacity: ${isInPlaylist ? '0.6' : '1'};
                " 
                onclick="${isInPlaylist ? '' : `addTrackToPlaylistById('${playlist.id}', '${playlist.name.replace(/'/g, "\\'")}', '${trackTitle.replace(/'/g, "\\'")}'); closePlaylistModal();`}"
                onmouseover="if(!${isInPlaylist}) this.style.background='#FFFFCC'"
                onmouseout="this.style.background='white'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: bold; font-size: 11px;">${playlist.name}</div>
                            <div style="font-size: 10px; color: #666;">${trackCount} video${trackCount !== 1 ? 's' : ''}</div>
                        </div>
                        <div>
                            ${isInPlaylist ? 
                                '<span style="color: green; font-size: 10px;">✓ Already added</span>' : 
                                '<button onclick="event.stopPropagation(); addTrackToPlaylistById(\'' + playlist.id + '\', \'' + playlist.name.replace(/'/g, "\\'") + '\', \'' + trackTitle.replace(/'/g, "\\'") + '\'); closePlaylistModal();" style="background: white; border: 2px outset #ddd; padding: 2px 8px; cursor: pointer; font-size: 10px;">Add</button>'
                            }
                            <button onclick="event.stopPropagation(); deletePlaylist('${playlist.id}'); setTimeout(() => showPlaylistModal('${trackTitle.replace(/'/g, "\\'")}', null, null), 300);" style="background: #FFB0B0; border: 2px outset #ddd; padding: 2px 8px; cursor: pointer; font-size: 10px; margin-left: 5px;">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    modalContent.innerHTML = `
        <div style="background: linear-gradient(to right, #000080, #1084d0); color: white; padding: 3px 5px; margin: -10px -10px 10px -10px; font-weight: bold; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
            <span>➕ Add to Playlist</span>
            <button onclick="closePlaylistModal()" style="background: #C0C0C0; border: 2px outset #fff; padding: 0px 6px; cursor: pointer; font-weight: bold; font-size: 16px; line-height: 18px;">×</button>
        </div>
        
        <div style="margin-bottom: 10px; padding: 8px; background: white; border: 2px inset #ddd;">
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">Track:</div>
            <div style="font-size: 10px;">${trackTitle}</div>
        </div>
        
        <div style="margin-bottom: 10px;">
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">Select Playlist:</div>
            <div style="max-height: 300px; overflow-y: auto;">
                ${playlistListHTML}
            </div>
        </div>
        
        <div style="background: #D0D0D0; border: 2px inset #ddd; padding: 8px; margin-top: 10px;">
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">Create New Playlist:</div>
            <div style="display: flex; gap: 5px;">
                <input type="text" id="newPlaylistName" placeholder="Playlist name..." 
                       onkeypress="if(event.key==='Enter') createNewPlaylistAndAdd('${trackTitle.replace(/'/g, "\\'")}')"
                       style="flex: 1; padding: 3px; border: 2px inset #ddd; font-family: 'MS Sans Serif', sans-serif; font-size: 11px;">
                <button onclick="createNewPlaylistAndAdd('${trackTitle.replace(/'/g, "\\'")}');" style="background: white; border: 2px outset #ddd; padding: 3px 12px; cursor: pointer; font-size: 11px; font-weight: bold;">Create & Add</button>
            </div>
        </div>
        
        <div style="margin-top: 10px; text-align: center;">
            <button onclick="openPlaylistManager()" style="background: white; border: 2px outset #ddd; padding: 5px 15px; cursor: pointer; font-size: 11px; margin-right: 5px;">📋 Manage Playlists</button>
            <button onclick="closePlaylistModal()" style="background: white; border: 2px outset #ddd; padding: 5px 15px; cursor: pointer; font-size: 11px;">Cancel</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePlaylistModal();
        }
    });
    
    // Prevent modal content clicks from closing
    modalContent.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Store button element for later feedback
    modal.dataset.buttonElement = buttonElement;
}

/**
 * Close playlist modal
 */
function closePlaylistModal() {
    const modal = document.getElementById('playlistModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Create new playlist and add track
 */
async function createNewPlaylistAndAdd(trackTitle) {
    const input = document.getElementById('newPlaylistName');
    const playlistName = input.value.trim();
    
    if (await createNewPlaylist(playlistName)) {
        // Get the newly created playlist
        const playlists = await getUserPlaylists();
        const newPlaylist = playlists.find(p => p.name === playlistName);
        if (newPlaylist) {
            await addTrackToPlaylistById(newPlaylist.id, playlistName, trackTitle);
        }
        closePlaylistModal();
    }
}

/**
 * Add track to specific playlist by ID
 */
async function addTrackToPlaylistById(playlistId, playlistName, trackTitle) {
    const username = localStorage.getItem('username');
    if (!username || username === 'guest') return;
    
    try {
        // Find the video ID from the title
        const videoId = currentVideoId || Object.keys(videoData || {}).find(key => 
            videoData[key].title === trackTitle
        );
        
        if (!videoId) {
            updateStatus('Video not found');
            return;
        }
        
        // Add video to playlist
        await WigTubeDB.addVideoToPlaylist(playlistId, videoId, username);
        updateStatus(`Added "${trackTitle}" to "${playlistName}"`);
    } catch (error) {
        console.error('Error adding video to playlist:', error);
        updateStatus('Failed to add video to playlist');
    }
}

/**
 * Main function to add to playlist - shows modal
 */
async function addToPlaylist(trackTitle, buttonElement) {
    await showPlaylistModal(trackTitle, null, buttonElement);
}

/**
 * Open playlist manager
 */
async function openPlaylistManager() {
    closePlaylistModal();
    
    const playlists = await getUserPlaylists();
    
    // Create manager modal
    const modal = document.createElement('div');
    modal.id = 'playlistManagerModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #E0E0E0;
        border: 3px outset #fff;
        padding: 10px;
        width: 80%;
        max-width: 800px;
        max-height: 80%;
        overflow-y: auto;
        font-family: "MS Sans Serif", sans-serif;
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
    `;
    
    let playlistsHTML = '';
    if (playlists.length === 0) {
        playlistsHTML = '<div style="padding: 20px; text-align: center; color: #666;">No playlists yet. Create your first playlist!</div>';
    } else {
        playlistsHTML = playlists.map(playlist => {
            const tracksHTML = (playlist.videos || []).map((videoId, idx) => {
                // Try to get video from local data, show ID if not available
                const video = videoData[videoId];
                const videoTitle = video ? video.title : `Video ${videoId.substring(0, 20)}...`;
                const videoDuration = video ? video.duration : 'Unknown';
                
                return `
                <div style="background: #F0F0F0; border: 1px solid #ccc; padding: 5px; margin: 3px 0; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <span style="font-size: 10px;">${idx + 1}. ${videoTitle}</span>
                        <span style="font-size: 9px; color: #666; margin-left: 10px;">(${videoDuration})</span>
                    </div>
                    <button onclick="removeTrackFromPlaylist('${playlist.id}', '${videoId}'); setTimeout(() => openPlaylistManager(), 300);" style="background: #FFB0B0; border: 2px outset #ddd; padding: 2px 8px; cursor: pointer; font-size: 9px;">Remove</button>
                </div>
            `;
            }).join('');
            
            const videoCount = playlist.videos?.length || 0;
            const createdDate = playlist.createdAt ? new Date(playlist.createdAt).toLocaleDateString() : 'Unknown';
            
            return `
                <div style="background: white; border: 2px inset #ddd; padding: 10px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <div style="font-weight: bold; font-size: 12px;">${playlist.name}</div>
                            <div style="font-size: 10px; color: #666;">${videoCount} video${videoCount !== 1 ? 's' : ''} • Created ${createdDate}</div>
                        </div>
                        <div>
                            <button onclick="playPlaylist('${playlist.id}'); closePlaylistManagerModal();" style="background: #90EE90; border: 2px outset #ddd; padding: 3px 10px; cursor: pointer; font-size: 10px; margin-right: 5px;">▶ Play</button>
                            <button onclick="deletePlaylist('${playlist.id}'); setTimeout(() => openPlaylistManager(), 300);" style="background: #FFB0B0; border: 2px outset #ddd; padding: 3px 10px; cursor: pointer; font-size: 10px;">Delete</button>
                        </div>
                    </div>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${tracksHTML || '<div style="padding: 10px; text-align: center; color: #999; font-size: 10px;">No videos in this playlist</div>'}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    modalContent.innerHTML = `
        <div style="background: linear-gradient(to right, #000080, #1084d0); color: white; padding: 3px 5px; margin: -10px -10px 10px -10px; font-weight: bold; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
            <span>📋 Playlist Manager</span>
            <button onclick="closePlaylistManagerModal()" style="background: #C0C0C0; border: 2px outset #fff; padding: 0px 6px; cursor: pointer; font-weight: bold; font-size: 16px; line-height: 18px;">×</button>
        </div>
        
        <div style="margin-bottom: 10px;">
            ${playlistsHTML}
        </div>
        
        <div style="background: #D0D0D0; border: 2px inset #ddd; padding: 8px;">
            <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">Create New Playlist:</div>
            <div style="display: flex; gap: 5px;">
                <input type="text" id="managerNewPlaylistName" placeholder="Playlist name..." 
                       onkeypress="if(event.key==='Enter') createNewPlaylistFromManager()"
                       style="flex: 1; padding: 3px; border: 2px inset #ddd; font-family: 'MS Sans Serif', sans-serif; font-size: 11px;">
                <button onclick="createNewPlaylistFromManager()" style="background: white; border: 2px outset #ddd; padding: 3px 12px; cursor: pointer; font-size: 11px; font-weight: bold;">Create</button>
            </div>
        </div>
        
        <div style="margin-top: 10px; text-align: center;">
            <button onclick="closePlaylistManagerModal()" style="background: white; border: 2px outset #ddd; padding: 5px 15px; cursor: pointer; font-size: 11px;">Close</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePlaylistManagerModal();
        }
    });
    
    // Prevent modal content clicks from closing
    modalContent.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

/**
 * Close playlist manager modal
 */
function closePlaylistManagerModal() {
    const modal = document.getElementById('playlistManagerModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Create new playlist from manager
 */
async function createNewPlaylistFromManager() {
    const input = document.getElementById('managerNewPlaylistName');
    const playlistName = input.value.trim();
    
    if (await createNewPlaylist(playlistName)) {
        await openPlaylistManager();
    }
}

/**
 * Remove track from playlist
 */
async function removeTrackFromPlaylist(playlistId, videoId) {
    const username = localStorage.getItem('username');
    if (!username || username === 'guest') return;
    
    try {
        await WigTubeDB.removeVideoFromPlaylist(playlistId, videoId, username);
        const video = videoData[videoId];
        const videoTitle = video ? video.title : videoId;
        updateStatus(`Removed "${videoTitle}" from playlist`);
    } catch (error) {
        console.error('Error removing video from playlist:', error);
        updateStatus('Failed to remove video from playlist');
    }
}

/**
 * Play a user playlist
 */
async function playPlaylist(playlistId) {
    const username = localStorage.getItem('username');
    if (!username || username === 'guest') return;
    
    try {
        const playlist = await WigTubeDB.getPlaylistById(playlistId, username);
        
        if (!playlist) {
            updateStatus('Playlist not found');
            return;
        }
        
        if (!playlist.videos || playlist.videos.length === 0) {
            updateStatus('Playlist is empty');
            return;
        }
        
        // Load first video (loadVideo will fetch from WigTubeDB if not in local videoData)
        const firstVideoId = playlist.videos[0];
        if (firstVideoId) {
            await loadVideo(firstVideoId);
            updateStatus(`Playing playlist: ${playlist.name}`);
            
            // Set up playlist queue with all video IDs (don't filter by videoData)
            currentAlbum = {
                name: playlist.name,
                tracks: playlist.videos.filter(id => id)
            };
            currentTrackIndex = 0;
            
            // Display playlist UI
            displayUserPlaylist(playlist);
        } else {
            updateStatus('Playlist is empty');
        }
    } catch (error) {
        console.error('Error playing playlist:', error);
        updateStatus('Failed to play playlist');
    }
}

/**
 * Display user playlist in the player
 */
function displayUserPlaylist(playlist) {
    let playlistSection = document.getElementById('albumPlaylistSection');
    
    if (!playlistSection) {
        playlistSection = document.createElement('div');
        playlistSection.id = 'albumPlaylistSection';
        playlistSection.className = 'album-playlist-section';
        
        const videoSection = document.querySelector('.video-section');
        if (videoSection && videoSection.children.length > 1) {
            videoSection.insertBefore(playlistSection, videoSection.firstChild.nextSibling);
        }
    }
    
    playlistSection.style.cssText = `
        background: white;
        border: 2px inset #ddd;
        padding: 10px;
        margin: 10px 0;
        font-family: "MS Sans Serif", sans-serif;
    `;
    
    const tracksHTML = (playlist.videos || []).map((videoId, index) => {
        // Check local videoData first, show loading indicator if not available
        const video = videoData[videoId];
        const videoTitle = video ? video.title : 'Loading...';
        const videoDuration = video ? video.duration : '?:??';
        
        const isCurrentTrack = currentAlbum && index === currentTrackIndex;
        return `
            <div class="playlist-track ${isCurrentTrack ? 'current-track' : ''}" 
                 style="padding: 5px; margin: 3px 0; background: ${isCurrentTrack ? '#FFFFCC' : '#F0F0F0'}; border: 1px solid #ccc; cursor: pointer; font-size: 11px;"
                 onclick="playTrackFromPlaylist(${index})"
                 onmouseover="if(!${isCurrentTrack}) this.style.background='#E0E0FF'"
                 onmouseout="if(!${isCurrentTrack}) this.style.background='#F0F0F0'">
                ${isCurrentTrack ? '▶ ' : ''}${index + 1}. ${videoTitle} - ${videoDuration}
            </div>
        `;
    }).join('');
    
    playlistSection.innerHTML = `
        <div style="font-weight: bold; font-size: 12px; margin-bottom: 8px; color: #000080;">
            📋 Now Playing: ${playlist.name}
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
            ${tracksHTML}
        </div>
    `;
}

/**
 * Play track from playlist by index
 */
async function playTrackFromPlaylist(index) {
    if (currentAlbum && currentAlbum.tracks && index >= 0 && index < currentAlbum.tracks.length) {
        currentTrackIndex = index;
        const videoId = currentAlbum.tracks[index];
        if (videoId) {
            // loadVideo will fetch from WigTubeDB if not in videoData
            await loadVideo(videoId);
            
            // Update playlist display - get playlist by name from WigTubeDB
            const username = localStorage.getItem('username');
            if (username && username !== 'guest') {
                const playlists = await getUserPlaylists();
                const playlist = playlists.find(p => p.name === currentAlbum.name);
                if (playlist) {
                    displayUserPlaylist(playlist);
                }
            }
        }
    }
}

/**
 * Download track (simulated)
 */
function downloadTrack(trackTitle, buttonElement) {
    updateStatus(`Download started: ${trackTitle} (Feature simulated)`);
    
    // Visual feedback
    if (buttonElement) {
        buttonElement.textContent = '⏳ Downloading...';
        buttonElement.style.background = '#87CEEB';
        
        setTimeout(() => {
            buttonElement.textContent = '✓ Complete';
            buttonElement.style.background = '#90EE90';
            updateStatus('Download complete!');
            
            setTimeout(() => {
                buttonElement.textContent = '💾 Download';
                buttonElement.style.background = 'white';
            }, 2000);
        }, 1500);
    }
}

// ============================================
// Dynamic Video Statistics Functions
// ============================================

/**
 * Load video statistics from localStorage
 * Returns current view count and rating
 */
function loadVideoStats(videoId) {
    const allStats = getWigTubeProperty('videoStats') || {};
    const savedStats = allStats[videoId];
    
    if (savedStats) {
        return savedStats;
    } else {
        // Initialize with zeros for new video
        const initialStats = {
            viewCount: 0,
            views: '0 views',
            ratingTotal: 0,
            ratingCount: 0,
            ratingStars: '☆☆☆☆☆',
            userRating: 0
        };
        allStats[videoId] = initialStats;
        updateWigTubeProperty('videoStats', allStats);
        return initialStats;
    }
}

/**
 * Parse view count string to number
 */
function parseViewCount(viewString) {
    // Handle various formats: "2 views", "1,456 views", "1B views", "1042 personas"
    const cleanString = viewString.toLowerCase().replace(/,/g, '');
    
    if (cleanString.includes('b')) {
        return parseFloat(cleanString) * 1000000000;
    } else if (cleanString.includes('m')) {
        return parseFloat(cleanString) * 1000000;
    } else if (cleanString.includes('k')) {
        return parseFloat(cleanString) * 1000;
    } else {
        const match = cleanString.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
    }
}

/**
 * Format view count number to string
 */
function formatViewCount(count) {
    if (count >= 1000000000) {
        return (count / 1000000000).toFixed(1) + 'B views';
    } else if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M views';
    } else if (count >= 1000) {
        return count.toLocaleString() + ' views';
    } else {
        return count + ' views';
    }
}

/**
 * Increment view count for a video
 */
function incrementViewCount(videoId) {
    const allStats = getWigTubeProperty('videoStats') || {};
    const stats = loadVideoStats(videoId);
    
    // Increment view count
    stats.viewCount++;
    stats.views = formatViewCount(stats.viewCount);
    
    // Save updated stats
    allStats[videoId] = stats;
    updateWigTubeProperty('videoStats', allStats);
    
    // Update UI
    document.getElementById('viewCount').textContent = stats.views;
    
    // Show notification
    updateStatus(`View count updated: ${stats.views}`);
}

/**
 * Calculate star rating from numeric rating (1-5)
 */
function calculateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '★'.repeat(fullStars);
    if (halfStar) stars += '☆';
    stars += '☆'.repeat(emptyStars);
    
    return stars;
}

/**
 * Add user rating to video
 */
async function rateVideo(videoId, rating) {
    // Get current user
    const username = localStorage.getItem('username') || 'anonymous';
    
    // Check if WigTubeDB is available
    if (typeof WigTubeDB !== 'undefined') {
        try {
            // Check if user already rated
            const userRating = await WigTubeDB.getUserRating(videoId, username);
            const isUpdate = userRating !== null;
            
            // Add or update rating in database
            await WigTubeDB.addRating(videoId, rating, username);
            
            // Get all ratings to calculate average (from cached data, efficient)
            const allRatings = await WigTubeDB.getAllRatings(videoId);
            const ratingStars = WigTubeDB.calculateStarRating(allRatings);
            const ratingCount = allRatings.length;
            const avgRating = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
            
            // Update UI
            document.getElementById('rating').textContent = ratingStars;
            document.getElementById('ratingCount').textContent = ratingCount;
            
            // Show notification
            if (isUpdate) {
                updateStatus(`Rating updated! Your new rating: ${rating} stars (Avg: ${avgRating.toFixed(1)})`);
            } else {
                updateStatus(`Thank you for rating! Your rating: ${rating} stars (Avg: ${avgRating.toFixed(1)})`);
            }
            
            console.log(`Rating ${isUpdate ? 'updated' : 'added'}: ${rating} stars. Total ratings: ${ratingCount}, Average: ${avgRating.toFixed(2)}`);
        } catch (error) {
            console.error('Error adding rating:', error);
            updateStatus('Error: Could not save rating');
        }
    } else {
        // Fallback to localStorage
        rateVideoFallback(videoId, rating);
    }
}

function rateVideoFallback(videoId, rating) {
    const allStats = getWigTubeProperty('videoStats') || {};
    const stats = loadVideoStats(videoId);
    
    // Check if user already rated
    if (stats.userRating > 0) {
        updateStatus('You have already rated this video!');
        return;
    }
    
    // Add rating
    stats.ratingTotal += rating;
    stats.ratingCount++;
    stats.userRating = rating;
    
    // Calculate new average rating
    const averageRating = stats.ratingTotal / stats.ratingCount;
    stats.ratingStars = calculateStarRating(averageRating);
    
    // Save updated stats
    allStats[videoId] = stats;
    updateWigTubeProperty('videoStats', allStats);
    
    // Update UI
    document.getElementById('rating').textContent = stats.ratingStars;
    document.getElementById('ratingCount').textContent = stats.ratingCount;
    
    // Show notification
    updateStatus(`Thank you for rating! Your rating: ${rating} stars`);
}

/**
 * Add interactive rating buttons to the page
 */
async function setupRatingButtons() {
    const ratingSection = document.querySelector('.video-stats');
    if (!ratingSection) return;
    
    // Create rating container
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'user-rating-container';
    ratingContainer.style.cssText = 'margin-top: 10px; padding: 10px; background: #f0f0f0; border: 1px solid #ccc;';
    
    ratingContainer.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">Rate this video:</div>
        <div class="rating-buttons" style="display: flex; gap: 5px;">
            <button class="rate-btn" data-rating="1" style="padding: 5px 10px; cursor: pointer; background: white; border: 1px solid #999;">⭐ 1</button>
            <button class="rate-btn" data-rating="2" style="padding: 5px 10px; cursor: pointer; background: white; border: 1px solid #999;">⭐ 2</button>
            <button class="rate-btn" data-rating="3" style="padding: 5px 10px; cursor: pointer; background: white; border: 1px solid #999;">⭐ 3</button>
            <button class="rate-btn" data-rating="4" style="padding: 5px 10px; cursor: pointer; background: white; border: 1px solid #999;">⭐ 4</button>
            <button class="rate-btn" data-rating="5" style="padding: 5px 10px; cursor: pointer; background: white; border: 1px solid #999;">⭐ 5</button>
        </div>
        <div id="userRatingStatus" style="margin-top: 5px; font-size: 11px; color: #666;"></div>
    `;
    
    ratingSection.appendChild(ratingContainer);
    
    const videoId = getVideoIdFromURL();
    const username = localStorage.getItem('username') || 'anonymous';
    
    // Check if user already rated (for WigTubeDB)
    let currentUserRating = null;
    if (typeof WigTubeDB !== 'undefined') {
        try {
            currentUserRating = await WigTubeDB.getUserRating(videoId, username);
            if (currentUserRating) {
                document.getElementById('userRatingStatus').textContent = `You rated this ${currentUserRating} stars. Click another star to update your rating.`;
            }
        } catch (e) {
            console.error('Error checking user rating:', e);
        }
    }
    
    // Add click handlers to rating buttons
    document.querySelectorAll('.rate-btn').forEach(btn => {
        const btnRating = parseInt(btn.getAttribute('data-rating'));
        
        // Highlight current user rating
        if (currentUserRating && btnRating === currentUserRating) {
            btn.style.background = '#90EE90';
            btn.style.fontWeight = 'bold';
        }
        
        btn.addEventListener('click', async function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            await rateVideo(videoId, rating);
            
            // Update all buttons to show new selection
            document.querySelectorAll('.rate-btn').forEach(b => {
                b.style.background = 'white';
                b.style.fontWeight = 'normal';
            });
            
            // Highlight new rating
            this.style.background = '#90EE90';
            this.style.fontWeight = 'bold';
            
            // Update status text
            document.getElementById('userRatingStatus').textContent = `You rated this ${rating} stars. Click another star to update your rating.`;
            
            // Update the currentUserRating variable
            currentUserRating = rating;
        });
        
        // Hover effect
        btn.addEventListener('mouseenter', function() {
            this.style.background = '#e0e0e0';
        });
        
        btn.addEventListener('mouseleave', function() {
            const btnRating = parseInt(this.getAttribute('data-rating'));
            if (currentUserRating === btnRating || this.style.background === 'rgb(144, 238, 144)') {
                this.style.background = '#90EE90';
            } else {
                this.style.background = 'white';
            }
        });
    });
}

// ============================================
// Reply Management
// ============================================

/**
 * Toggle reply box visibility
 */
function toggleReplyBox(commentId) {
    const replyBox = document.getElementById(`replyBox_${commentId}`);
    if (replyBox) {
        replyBox.style.display = replyBox.style.display === 'none' ? 'block' : 'none';
        if (replyBox.style.display === 'block') {
            document.getElementById(`replyInput_${commentId}`).focus();
        }
    }
}

/**
 * Submit a reply to a comment
 */
async function submitReply(commentId) {
    const replyInput = document.getElementById(`replyInput_${commentId}`);
    const replyText = replyInput.value.trim();
    
    if (!replyText) {
        alert('Please enter a reply');
        return;
    }
    
    const username = localStorage.getItem('username');
    if (!username || username === 'guest') {
        alert('Please log in to reply');
        return;
    }
    
    const videoId = currentVideoId || getVideoIdFromURL();
    
    try {
        await WigTubeDB.addReply(videoId, commentId, {
            author: username,
            text: replyText
        });
        
        updateStatus('Reply posted successfully');
        replyInput.value = '';
        toggleReplyBox(commentId);
        
        // Reload comments to show new reply
        await loadComments();
    } catch (error) {
        console.error('Error posting reply:', error);
        updateStatus('Error posting reply');
    }
}

/**
 * Toggle nested reply box visibility
 */
function toggleNestedReplyBox(commentId, replyId) {
    const replyBox = document.getElementById(`nestedReplyBox_${replyId}`);
    if (replyBox) {
        replyBox.style.display = replyBox.style.display === 'none' ? 'block' : 'none';
        if (replyBox.style.display === 'block') {
            document.getElementById(`nestedReplyInput_${replyId}`).focus();
        }
    }
}

/**
 * Submit a nested reply (reply to a reply)
 */
async function submitNestedReply(commentId, parentReplyId) {
    const replyInput = document.getElementById(`nestedReplyInput_${parentReplyId}`);
    const replyText = replyInput.value.trim();
    
    if (!replyText) {
        alert('Please enter a reply');
        return;
    }
    
    const username = localStorage.getItem('username');
    if (!username || username === 'guest') {
        alert('Please log in to reply');
        return;
    }
    
    const videoId = currentVideoId || getVideoIdFromURL();
    
    try {
        await WigTubeDB.addReply(videoId, commentId, {
            author: username,
            text: replyText,
            parentReplyId: parentReplyId
        });
        
        updateStatus('Reply posted successfully');
        replyInput.value = '';
        toggleNestedReplyBox(commentId, parentReplyId);
        
        // Reload comments to show new nested reply
        await loadComments();
    } catch (error) {
        console.error('Error posting nested reply:', error);
        updateStatus('Error posting reply');
    }
}

/**
 * Delete a reply
 */
async function deleteReply(commentId, replyId) {
    if (!confirm('Are you sure you want to delete this reply?')) {
        return;
    }
    
    const videoId = currentVideoId || getVideoIdFromURL();
    
    try {
        await WigTubeDB.deleteReply(videoId, commentId, replyId);
        updateStatus('Reply deleted successfully');
        
        // Reload comments to reflect the deletion
        await loadComments();
    } catch (error) {
        console.error('Error deleting reply:', error);
        updateStatus('Error deleting reply');
    }
}

/**
 * Display replies for a comment
 */
async function displayReplies(commentId, replies) {
    const repliesContainer = document.getElementById(`replies_${commentId}`);
    if (!repliesContainer) return;
    
    repliesContainer.innerHTML = '';
    
    for (const reply of replies) {
        const replyElement = document.createElement('div');
        replyElement.style.cssText = `
            padding: 12px;
            background: #f5f5f5;
            border-left: 3px solid #ccc;
            margin-bottom: 8px;
        `;
        
        // Get profile picture for reply author
        let authorPfp = null;
        if (window.getUserProfilePicture) {
            authorPfp = window.getUserProfilePicture(reply.author);
        }
        
        if (!authorPfp && reply.author && reply.author.toLowerCase() !== 'guest') {
            if (window.firebaseAPI && window.firebaseAPI.db && window.firebaseOnline) {
                try {
                    const { doc, getDoc } = window.firebaseAPI;
                    const userDoc = await getDoc(doc(window.firebaseAPI.db, "users", reply.author));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.profilePicture) {
                            authorPfp = userData.profilePicture;
                            localStorage.setItem(`pfp_${reply.author}`, authorPfp);
                        }
                    }
                } catch (e) {
                    console.error('Error loading profile picture:', e);
                }
            }
        }
        
        let profilePicHTML = '';
        if (authorPfp) {
            profilePicHTML = `<img src="${authorPfp}" alt="${reply.author}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; margin-right: 8px; border: 1px solid #999;">`;
        } else {
            profilePicHTML = `<div style="width: 24px; height: 24px; border-radius: 50%; background: #ccc; margin-right: 8px; border: 1px solid #999; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #666; font-size: 10px;">${(reply.author || 'G').charAt(0).toUpperCase()}</div>`;
        }
        
        // Format timestamp
        let timeString = 'Just now';
        if (reply.timestamp) {
            const replyDate = new Date(reply.timestamp);
            const now = new Date();
            const diffMs = now - replyDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) {
                timeString = 'Just now';
            } else if (diffMins < 60) {
                timeString = `${diffMins}m ago`;
            } else if (diffHours < 24) {
                timeString = `${diffHours}h ago`;
            } else {
                timeString = `${diffDays}d ago`;
            }
        }
        
        // Check if current user is the reply author
        const currentUsername = localStorage.getItem('username');
        const isReplyAuthor = currentUsername && (reply.author === currentUsername);
        const canReply = currentUsername && currentUsername !== 'guest';
        
        const deleteButtonHTML = isReplyAuthor
            ? `<button onclick="deleteReply('${commentId}', '${reply.id}')" style="
                padding: 2px 6px;
                background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                color: #000;
                border: 2px outset #d4d0c8;
                cursor: pointer;
                font-size: 10px;
                font-family: 'MS Sans Serif', sans-serif;
            " title="Delete reply">🗑️</button>`
            : '';
        
        const replyButtonHTML = canReply
            ? `<button onclick="toggleNestedReplyBox('${commentId}', '${reply.id}')" style="
                padding: 2px 6px;
                background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                color: #000;
                border: 2px outset #d4d0c8;
                cursor: pointer;
                font-size: 10px;
                font-family: 'MS Sans Serif', sans-serif;
                margin-left: 4px;
            " title="Reply">💬</button>`
            : '';
        
        replyElement.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                ${profilePicHTML}
                <div style="flex: 1;">
                    <div style="font-size: 11px; font-weight: bold; color: #000;">${reply.author || 'Guest'}</div>
                    <div style="font-size: 10px; color: #666;">${timeString}</div>
                </div>
                ${replyButtonHTML}
                ${deleteButtonHTML}
            </div>
            <div style="margin-left: 32px; font-size: 11px; color: #000;">${reply.text}</div>
            <div id="nestedReplyBox_${reply.id}" style="display: none; margin-left: 32px; margin-top: 8px;">
                <textarea id="nestedReplyInput_${reply.id}" placeholder="Add a reply..." style="
                    width: 100%;
                    height: 50px;
                    padding: 6px;
                    border: 2px inset #d4d0c8;
                    font-size: 10px;
                    font-family: 'MS Sans Serif', sans-serif;
                    resize: vertical;
                "></textarea>
                <div style="margin-top: 6px; display: flex; gap: 6px;">
                    <button onclick="submitNestedReply('${commentId}', '${reply.id}')" style="
                        padding: 3px 10px;
                        background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                        color: #000;
                        border: 2px outset #d4d0c8;
                        cursor: pointer;
                        font-size: 10px;
                        font-family: 'MS Sans Serif', sans-serif;
                        font-weight: bold;
                    ">Post</button>
                    <button onclick="toggleNestedReplyBox('${commentId}', '${reply.id}')" style="
                        padding: 3px 10px;
                        background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                        color: #000;
                        border: 2px outset #d4d0c8;
                        cursor: pointer;
                        font-size: 10px;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">Cancel</button>
                </div>
            </div>
            <div id="nestedReplies_${reply.id}" style="margin-left: 20px; margin-top: 8px;"></div>
        `;
        
        repliesContainer.appendChild(replyElement);
        
        // Recursively display nested replies
        if (reply.replies && reply.replies.length > 0) {
            const nestedContainer = document.getElementById(`nestedReplies_${reply.id}`);
            if (nestedContainer) {
                await displayNestedReplies(commentId, reply.id, reply.replies, nestedContainer);
            }
        }
    }
}

/**
 * Display nested replies recursively
 */
async function displayNestedReplies(commentId, parentReplyId, replies, container) {
    for (const reply of replies) {
        const replyElement = document.createElement('div');
        replyElement.style.cssText = `
            padding: 12px;
            background: #f9f9f9;
            border-left: 3px solid #ccc;
            margin-bottom: 8px;
            border-radius: 2px;
        `;
        
        // Get profile picture
        let authorPfp = localStorage.getItem(`pfp_${reply.author}`);
        if (!authorPfp && reply.author && reply.author.toLowerCase() !== 'guest') {
            if (window.firebaseAPI && window.firebaseAPI.db && window.firebaseOnline) {
                try {
                    const { doc, getDoc } = window.firebaseAPI;
                    const userDoc = await getDoc(doc(window.firebaseAPI.db, "users", reply.author));
                    if (userDoc.exists() && userDoc.data().profilePicture) {
                        authorPfp = userDoc.data().profilePicture;
                        localStorage.setItem(`pfp_${reply.author}`, authorPfp);
                    }
                } catch (e) {}
            }
        }
        
        const profilePicHTML = authorPfp
            ? `<img src="${authorPfp}" alt="${reply.author}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; margin-right: 8px; border: 1px solid #999;">`
            : `<div style="width: 24px; height: 24px; border-radius: 50%; background: #ccc; margin-right: 8px; border: 1px solid #999; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #666; font-size: 10px;">${(reply.author || 'G').charAt(0).toUpperCase()}</div>`;
        
        // Format timestamp
        let timeString = 'Just now';
        if (reply.timestamp) {
            const replyDate = new Date(reply.timestamp);
            const diffMs = new Date() - replyDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) timeString = 'Just now';
            else if (diffMins < 60) timeString = `${diffMins}m ago`;
            else if (diffHours < 24) timeString = `${diffHours}h ago`;
            else timeString = `${diffDays}d ago`;
        }
        
        const currentUsername = localStorage.getItem('username');
        const isReplyAuthor = currentUsername && (reply.author === currentUsername);
        const canReply = currentUsername && currentUsername !== 'guest';
        
        const deleteButtonHTML = isReplyAuthor
            ? `<button onclick="deleteReply('${commentId}', '${reply.id}')" style="padding: 2px 6px; background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%); color: #000; border: 2px outset #d4d0c8; cursor: pointer; font-size: 10px; font-family: 'MS Sans Serif', sans-serif;" title="Delete">🗑️</button>`
            : '';
        
        const replyButtonHTML = canReply
            ? `<button onclick="toggleNestedReplyBox('${commentId}', '${reply.id}')" style="padding: 2px 6px; background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%); color: #000; border: 2px outset #d4d0c8; cursor: pointer; font-size: 10px; font-family: 'MS Sans Serif', sans-serif; margin-left: 4px;" title="Reply">💬</button>`
            : '';
        
        // Show reply count if there are nested replies
        const replyCount = reply.replies && reply.replies.length > 0 ? reply.replies.length : 0;
        const showRepliesButtonHTML = replyCount > 0
            ? `<button onclick="toggleNestedRepliesVisibility('${reply.id}')" id="toggleBtn_${reply.id}" style="
                padding: 2px 8px;
                background: linear-gradient(to bottom, #e8e8e8 0%, #d0d0d0 100%);
                color: #0066cc;
                border: 2px outset #d4d0c8;
                cursor: pointer;
                font-size: 10px;
                font-family: 'MS Sans Serif', sans-serif;
                margin-top: 8px;
                margin-left: 32px;
                font-weight: bold;
            ">▼ Show ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}</button>`
            : '';
        
        replyElement.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                ${profilePicHTML}
                <div style="flex: 1;">
                    <div style="font-size: 11px; font-weight: bold; color: #000;">${reply.author || 'Guest'}</div>
                    <div style="font-size: 10px; color: #666;">${timeString}</div>
                </div>
                ${replyButtonHTML}
                ${deleteButtonHTML}
            </div>
            <div style="margin-left: 32px; font-size: 11px; color: #000; line-height: 1.4;">${reply.text}</div>
            <div id="nestedReplyBox_${reply.id}" style="display: none; margin-left: 32px; margin-top: 8px;">
                <textarea id="nestedReplyInput_${reply.id}" placeholder="Add a reply..." style="width: 100%; height: 50px; padding: 6px; border: 2px inset #d4d0c8; font-size: 10px; font-family: 'MS Sans Serif', sans-serif; resize: vertical;"></textarea>
                <div style="margin-top: 6px; display: flex; gap: 6px;">
                    <button onclick="submitNestedReply('${commentId}', '${reply.id}')" style="padding: 3px 10px; background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%); color: #000; border: 2px outset #d4d0c8; cursor: pointer; font-size: 10px; font-family: 'MS Sans Serif', sans-serif; font-weight: bold;">Post</button>
                    <button onclick="toggleNestedReplyBox('${commentId}', '${reply.id}')" style="padding: 3px 10px; background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%); color: #000; border: 2px outset #d4d0c8; cursor: pointer; font-size: 10px; font-family: 'MS Sans Serif', sans-serif;">Cancel</button>
                </div>
            </div>
            ${showRepliesButtonHTML}
            <div id="nestedReplies_${reply.id}" style="margin-left: 20px; margin-top: 8px; display: none;"></div>
        `;
        
        container.appendChild(replyElement);
        
        // Recursively display even deeper nested replies (hidden by default)
        if (reply.replies && reply.replies.length > 0) {
            const deeperContainer = document.getElementById(`nestedReplies_${reply.id}`);
            if (deeperContainer) {
                await displayNestedReplies(commentId, reply.id, reply.replies, deeperContainer);
            }
        }
    }
}

/**
 * Toggle nested replies visibility
 */
function toggleNestedRepliesVisibility(replyId) {
    const container = document.getElementById(`nestedReplies_${replyId}`);
    const button = document.getElementById(`toggleBtn_${replyId}`);
    
    if (container && button) {
        if (container.style.display === 'none') {
            container.style.display = 'block';
            button.innerHTML = button.innerHTML.replace('▼ Show', '▲ Hide');
        } else {
            container.style.display = 'none';
            button.innerHTML = button.innerHTML.replace('▲ Hide', '▼ Show');
        }
    }
}

// Setup rating buttons after page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the page to fully load
    setTimeout(setupRatingButtons, 1000);
    
    // Add keyboard shortcut for closing modals (ESC key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close playlist modal if open
            const playlistModal = document.getElementById('playlistModal');
            if (playlistModal) {
                closePlaylistModal();
                return;
            }
            
            // Close playlist manager modal if open
            const managerModal = document.getElementById('playlistManagerModal');
            if (managerModal) {
                closePlaylistManagerModal();
                return;
            }
        }
    });
});

// ============================================
// Like/Dislike System
// ============================================

/**
 * Handle like/dislike button clicks
 */
async function handleLikeDislike(type) {
    const videoId = getVideoIdFromURL();
    const username = localStorage.getItem('username') || 'anonymous';
    
    if (!videoId) {
        console.error('No video ID found');
        return;
    }
    
    if (!window.WigTubeDB) {
        alert('⚠️ Error\n\nDatabase not available. Please refresh the page.');
        return;
    }
    
    try {
        // Toggle the like/dislike in database
        const result = await window.WigTubeDB.toggleLikeDislike(videoId, type, username);
        
        console.log('Like/Dislike result:', result);
        
        // Update UI with new counts
        const likeCountElement = document.getElementById('likeCount');
        const dislikeCountElement = document.getElementById('dislikeCount');
        
        if (likeCountElement && dislikeCountElement) {
            likeCountElement.textContent = result.likeCount;
            dislikeCountElement.textContent = result.dislikeCount;
        }
        
        // Update button states
        updateLikeDislikeButtons(result.userAction);
        
        debugLog(`${type} toggled:`, result);
    } catch (error) {
        console.error(`Error toggling ${type}:`, error);
        alert(`⚠️ Error\n\nCould not ${type} this video. Please try again.`);
    }
}

/**
 * Update like/dislike button visual states
 */
function updateLikeDislikeButtons(userAction) {
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    
    // Remove active class from both
    likeBtn.classList.remove('active');
    dislikeBtn.classList.remove('active');
    
    // Add active class to the appropriate button
    if (userAction === 'like') {
        likeBtn.classList.add('active');
    } else if (userAction === 'dislike') {
        dislikeBtn.classList.add('active');
    }
}

// ============================================
// Playlist Management
// ============================================

/**
 * Show add to playlist menu
 */
async function showAddToPlaylistMenu(videoId) {
    const username = localStorage.getItem('username');
    if (!username || username === 'guest') {
        alert('Please log in to add videos to playlists');
        return;
    }
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: #f0f0f0;
        border: 2px outset #d4d0c8;
        padding: 20px;
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        font-family: 'MS Sans Serif', sans-serif;
    `;
    
    dialog.innerHTML = `
        <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #000080; font-weight: bold;">Add to Playlist</h2>
        <div id="playlistSelectionList" style="
            margin-bottom: 16px;
            max-height: 400px;
            overflow-y: auto;
            border: 2px inset #d4d0c8;
            background: white;
            padding: 8px;
        ">
            <div style="text-align: center; padding: 20px; color: #666; font-size: 11px;">
                Loading playlists...
            </div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: space-between; border-top: 2px groove #d4d0c8; padding-top: 16px;">
            <button type="button" id="createNewPlaylistBtn" style="
                padding: 6px 16px;
                background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                color: #000;
                border: 2px outset #d4d0c8;
                cursor: pointer;
                font-size: 11px;
                font-family: 'MS Sans Serif', sans-serif;
            ">+ New Playlist</button>
            <button type="button" id="closePlaylistMenuBtn" style="
                padding: 6px 16px;
                background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                color: #000;
                border: 2px outset #d4d0c8;
                cursor: pointer;
                font-size: 11px;
                font-family: 'MS Sans Serif', sans-serif;
            ">Close</button>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Load user's playlists
    try {
        const playlists = await WigTubeDB.getUserPlaylists(username);
        const listContainer = document.getElementById('playlistSelectionList');
        
        if (playlists.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 36px; margin-bottom: 8px; opacity: 0.5;">📺</div>
                    <div style="font-size: 11px; color: #666;">No playlists yet</div>
                    <div style="font-size: 10px; color: #888; margin-top: 4px;">Create your first playlist to get started</div>
                </div>
            `;
        } else {
            listContainer.innerHTML = '';
            
            for (const playlist of playlists) {
                // Check if video is already in playlist
                const isInPlaylist = playlist.videos && playlist.videos.includes(videoId);
                
                const playlistItem = document.createElement('div');
                playlistItem.style.cssText = `
                    padding: 8px;
                    margin-bottom: 6px;
                    border: 1px solid #d4d0c8;
                    background: ${isInPlaylist ? '#e0e0e0' : '#f9f9f9'};
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = isInPlaylist;
                checkbox.disabled = isInPlaylist;
                checkbox.style.cssText = 'width: 16px; height: 16px;';
                
                const label = document.createElement('span');
                label.textContent = `${playlist.name} (${playlist.videos?.length || 0} videos)`;
                label.style.cssText = `
                    font-size: 11px;
                    flex: 1;
                    ${isInPlaylist ? 'color: #666;' : 'color: #000;'}
                `;
                
                playlistItem.appendChild(checkbox);
                playlistItem.appendChild(label);
                
                if (!isInPlaylist) {
                    playlistItem.addEventListener('click', async () => {
                        try {
                            checkbox.disabled = true;
                            await WigTubeDB.addVideoToPlaylist(playlist.id, videoId, username);
                            checkbox.checked = true;
                            playlistItem.style.background = '#e0e0e0';
                            label.style.color = '#666';
                            label.textContent = `${playlist.name} (${(playlist.videos?.length || 0) + 1} videos)`;
                            
                            // Update status
                            const statusText = document.getElementById('statusText');
                            if (statusText) {
                                statusText.textContent = `Added to ${playlist.name}`;
                            }
                        } catch (error) {
                            console.error('Error adding to playlist:', error);
                            alert('Error adding video to playlist');
                            checkbox.disabled = false;
                        }
                    });
                    
                    playlistItem.addEventListener('mouseenter', () => {
                        playlistItem.style.background = '#e8e8e8';
                    });
                    playlistItem.addEventListener('mouseleave', () => {
                        playlistItem.style.background = '#f9f9f9';
                    });
                }
                
                listContainer.appendChild(playlistItem);
            }
        }
    } catch (error) {
        console.error('Error loading playlists:', error);
        document.getElementById('playlistSelectionList').innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666; font-size: 11px;">
                Error loading playlists
            </div>
        `;
    }
    
    // Handle create new playlist - navigate back to main WigTube page
    dialog.querySelector('#createNewPlaylistBtn').addEventListener('click', () => {
        overlay.remove();
        // Navigate back to WigTube and open create playlist dialog
        window.location.href = 'wigtube.html?createPlaylist=true';
    });
    
    // Handle close
    dialog.querySelector('#closePlaylistMenuBtn').addEventListener('click', () => {
        overlay.remove();
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}