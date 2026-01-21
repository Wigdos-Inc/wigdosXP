// WigTube JavaScript - XP Era Style
// Note: Shared utilities (debugLog, getVideoRepoConfig, generateVideoUrl) 
// are loaded from wigtube-shared.js

// debugLog is provided by wigtube-db.js which loads first

/**
 * Show upload progress in status bar
 */
function showUploadProgress(message, percentage) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        if (percentage !== undefined) {
            statusEl.textContent = `${message} ${percentage}%`;
        } else {
            statusEl.textContent = message;
        }
    }
}

/**
 * Upload file to external video repository with real-time progress
 * Uses Cloudflare Worker for serverless upload (no CORS, no port forwarding)
 * Automatically uses chunked upload for large files
 */
async function uploadFileToGitHub(file, path, commitMessage) {
    try {
        const originalFileName = file.name;
        // Sanitize filename - keep spaces and common chars, just remove dangerous ones for path traversal
        const fileName = originalFileName.replace(/[\\/:*?\"<>|]/g, '_');
        const SMALL_FILE_LIMIT = 50 * 1024 * 1024; // 50MB - above this, use chunked upload
        
        // External repository configuration
        const { owner: VIDEO_REPO_OWNER, name: VIDEO_REPO_NAME, branch: VIDEO_REPO_BRANCH, folder: VIDEO_FOLDER } = getVideoRepoConfig();
        
        // Resolve Cloudflare Worker URL from config, then localStorage, then fallback
        const workerUrl = (window.WIGTUBE_CONFIG && window.WIGTUBE_CONFIG.workerUrl) ||
            localStorage.getItem('wigtubeWorkerUrl') ||
            'https://wigtube-upload.YOUR_SUBDOMAIN.workers.dev';

        if (workerUrl.includes('YOUR_SUBDOMAIN')) {
            throw new Error(
                '⚠️ Cloudflare Worker not configured!\n\n' +
                'Set your worker URL in scripts/apps/browser/wigtube-config.js\n' +
                'or via localStorage.setItem(\'wigtubeWorkerUrl\', \'https://your-worker.workers.dev\');\n\n' +
                'See cloudflare-worker/README.md for details.'
            );
        }
        
        console.log('🌐 Using Cloudflare Worker:', workerUrl);
        console.log('📁 File:', fileName, `(${Math.round(file.size / 1024 / 1024)}MB)`);
        
        // Choose upload method based on file size
        if (file.size <= SMALL_FILE_LIMIT) {
            // Simple upload for small files
            return await uploadFileSimple(file, fileName, workerUrl, VIDEO_FOLDER, VIDEO_REPO_OWNER, VIDEO_REPO_NAME);
        } else {
            // Chunked upload for large files
            return await uploadFileChunked(file, fileName, workerUrl, VIDEO_FOLDER);
        }
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        throw error;
    }
}

/**
 * Simple upload for files <50MB
 */
async function uploadFileSimple(file, fileName, workerUrl, folder, owner, repo) {
    showUploadProgress('📤 Uploading to GitHub...', 10);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', `${folder}/`);
    formData.append('repository', `${owner}/${repo}`);
    
    showUploadProgress('⏳ Uploading... Please wait', 50);
    
    const response = await fetch(`${workerUrl}/upload`, {
        method: 'POST',
        body: formData,
    });
    
    showUploadProgress('📡 Processing...', 80);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.error || 'Upload failed');
    }
    
    console.log('✅ Upload successful!');
    console.log('📹 Video URL:', result.videoUrl);
    
    showUploadProgress('✅ Upload complete!', 100);
    
    return result.videoUrl;
}

/**
 * Chunked upload for files >50MB
 */
async function uploadFileChunked(file, fileName, workerUrl, folder) {
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks (smaller for Worker memory limits during finalization)
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const blobShas = [];
    
    console.log(`📦 Splitting ${fileName} into ${totalChunks} chunks`);
    showUploadProgress(`📦 Uploading chunk 0/${totalChunks}...`, 5);
    
    // Upload each chunk
    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        const progress = 5 + Math.floor((i / totalChunks) * 85);
        showUploadProgress(`📤 Uploading chunk ${i + 1}/${totalChunks}...`, progress);
        
        console.log(`Uploading chunk ${i + 1}/${totalChunks} (${Math.round(chunk.size / 1024)}KB)`);
        
        const response = await fetch(`${workerUrl}/upload-chunk`, {
            method: 'POST',
            headers: {
                'X-Chunk-Index': i.toString(),
                'X-Total-Chunks': totalChunks.toString(),
                'X-File-Name': fileName,
                'X-File-Path': `${folder}/${fileName}`,
            },
            body: chunk,
        });
        
        if (!response.ok) {
            throw new Error(`Chunk ${i + 1} upload failed: ${response.status}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(`Chunk ${i + 1} failed: ${result.error}`);
        }
        
        blobShas.push(result.blobSha);
        console.log(`✅ Chunk ${i + 1} uploaded: ${result.blobSha}`);
    }
    
    // Finalize upload
    showUploadProgress('🔗 Finalizing upload...', 90);
    console.log('Finalizing chunked upload...');
    
    const finalizeResponse = await fetch(`${workerUrl}/finalize-upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fileName: fileName,
            filePath: `${folder}/${fileName}`,
            blobShas: blobShas,
            fileSize: file.size,
        }),
    });
    
    if (!finalizeResponse.ok) {
        throw new Error(`Finalization failed: ${finalizeResponse.status}`);
    }
    
    const finalResult = await finalizeResponse.json();
    if (!finalResult.success) {
        throw new Error(`Finalization failed: ${finalResult.error}`);
    }
    
    console.log('✅ Upload successful!');
    console.log('📹 Video URL:', finalResult.videoUrl);
    
    showUploadProgress('✅ Upload complete!', 100);
    
    return finalResult.videoUrl;
}

/**
 * Delete video file from GitHub repository via Cloudflare Worker
 */
async function deleteVideoFromGitHub(fileName) {
    try {
        const workerUrl = (window.WIGTUBE_CONFIG && window.WIGTUBE_CONFIG.workerUrl) ||
            localStorage.getItem('wigtubeWorkerUrl') ||
            'https://wigtube-upload.YOUR_SUBDOMAIN.workers.dev';
        
        if (workerUrl.includes('YOUR_SUBDOMAIN')) {
            console.error('⚠️ Cloudflare Worker not configured');
            return false;
        }
        
        const response = await fetch(`${workerUrl}/delete/${encodeURIComponent(fileName)}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            console.error('Delete failed:', response.status);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting video:', error);
        return false;
    }
}

/**
 * Delete video file from external repository (wrapper for backwards compatibility)
 */
async function deleteVideoFileFromRepo(videoUrl) {
    try {
        // Extract filename from video URL
        let fileName = '';
        
        if (videoUrl.includes('github')) {
            fileName = videoUrl.split('/').pop();
        } else if (videoUrl.includes('/')) {
            fileName = videoUrl.split('/').pop();
        } else {
            fileName = videoUrl;
        }
        
        if (!fileName) {
            console.warn('Could not extract filename from:', videoUrl);
            return { success: false, error: 'Invalid video URL' };
        }
        
        const success = await deleteVideoFromGitHub(fileName);
        return { success, fileName };
        
    } catch (error) {
        console.error('Error deleting video file from repo:', error);
        return { success: false, error: error.message };
    }
}

// Video data will be loaded from JSON file
let videoData = [];
let albumTracks = {};
let albumMetadata = [];

// Load video data from JSON file
async function loadVideoDataFromJSON() {
    try {
        const response = await fetch('scripts/apps/browser/wigtube-data.json');
        const data = await response.json();
        videoData = data.videos;
        albumTracks = data.albums;
        
        // Transform albumMetadata to include dynamic totalDuration
        albumMetadata = data.albumMetadata.map(album => ({
            ...album,
            get totalDuration() { return calculateAlbumDuration(albumTracks[this.id]); }
        }));
        
        return true;
    } catch (error) {
        console.error('Error loading video data:', error);
        return false;
    }
}

// Fallback video data if JSON fails to load
const fallbackVideoData = [
    {
        id: 'epic-minecraft-castle-build',
        title: 'Steve being a menace as always',
        author: 'Steve',
        uploadDate: '3 days ago',
        duration: '02:45',
        views: '2 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/steve.png',
        category: 'gaming'
    },
    {
        id: 'yo Darren',
        title: 'Yo Darren',
        author: 'Codemittens',
        uploadDate: '05-11-2025',
        duration: '00:19',
        views: '1042 personas',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/yodarren.png',
        category: 'gaming'
    },
    {
        id: 'chill-beats-mix-vol-12',
        title: 'Chill Beats Mix Vol. 12',
        author: 'WigBeats',
        uploadDate: '5 days ago',
        duration: '3:47',
        views: '12,456 views',
        rating: '★★★☆☆',
        thumbnail: 'assets/images/thumbnail/beats.png',
        category: 'music'
    },
    {
        id: 'blackman',
        title: 'freddy fazbear is about to get his dingaling touched',
        author: 'fredbear',
        uploadDate: '4 days ago',
        duration: '00:08',
        views: '8,923 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/blackman.png',
        category: 'comedy'
    },
    {
        id: 'jolly',
        title: 'jolly flight',
        author: 'Santa Claus',
        uploadDate: '2512 days ago',
        duration: '00:16',
        views: '34,782 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/santa.png',
        category: 'comedy'
    },
    {
        id: 'fredrick-fazbear-touches-youtubers-dingalings',
        title: 'Fredrick Fazbear Touches Youtubers Dingalings',
        author: 'fredbear',
        uploadDate: '1987 days ago',
        duration: '04:37',
        views: '4 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/dingaling.png',
        category: 'gaming'
    },
    {
        id: 'fnaf-squid-games-real',
        title: 'Fnaf squid games real',
        author: 'MrPenis',
        uploadDate: '2 centuries ago',
        duration: '00:56',
        views: '1B views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/mr.png',
        category: 'comedy'
    },
    {
        id: 'c418',
        title: 'hagstorm',
        author: 'c418',
        uploadDate: '1 day ago',
        duration: '03:24',
        views: '420 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/nostalgia.png',
        category: 'music'
    },
        {
        id: 'c4182',
        title: 'wethands',
        author: 'c418',
        uploadDate: '1 day ago',
        duration: '01:30',
        views: '420 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/nostalgia.png',
        category: 'music'
    },
        {
        id: 'c4183',
        title: 'dryhands',
        author: 'c418',
        uploadDate: '1 day ago',
        duration: '01:08',
        views: '420 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/nostalgia.png',
        category: 'music'
    },
        {
        id: 'c4184',
        title: 'moogcity',
        author: 'c418',
        uploadDate: '1 day ago',
        duration: '02:40',
        views: '420 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/nostalgia.png',
        category: 'music'
    },
        {
        id: 'c4185',
        title: 'sweden',
        author: 'c418',
        uploadDate: '1 day ago',
        duration: '03:35',
        views: '420 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/nostalgia.png',
        category: 'music'
    },
    {
        id: 'schlaubum1',
        title: 'jschlatt — Santa Claus Is Coming To Town',
        author: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '02:17',
        views: '420 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        category: 'music'
    },
    {
        id: 'schlaubum2',
        title: 'jschlatt — The Christmas Song ',
        author: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '03:15',
        views: '380 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        category: 'music'
    },
    {
        id: 'schlaubum3',
        title: 'jschlatt — Let It Snow! Let It Snow! Let It Snow!',
        author: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '01:56',
        views: '512 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        category: 'music'
    },
    {
        id: 'schlaubum4',
        title: 'jschlatt — Baby It\'s Cold Outside',
        author: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '02:25',
        views: '445 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        category: 'music'
    },
    {
        id: 'schlaubum5',
        title: 'jschlatt — Happy Holiday',
        author: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '02:52',
        views: '390 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        category: 'music'
    }
];
 
// Helper function to convert duration string to seconds
function durationToSeconds(duration) {
    const parts = duration.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
}

// Helper function to convert seconds to duration string
function secondsToDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Helper function to calculate total album duration from track IDs
function calculateAlbumDuration(trackIds) {
    let totalSeconds = 0;
    trackIds.forEach(trackId => {
        const video = videoData.find(v => v.id === trackId);
        if (video) {
            totalSeconds += durationToSeconds(video.duration);
        }
    });
    return secondsToDuration(totalSeconds);
}

// Album/Playlist data - will be loaded from JSON
let albumData = [];

// Category mapping
const categoryMap = {
    'all': 'All Videos',
    'music': 'Music',
    'gaming': 'Gaming',
    'comedy': 'Comedy',
    'tech': 'Tech',
    'educational': 'Educational',
    'sports': 'Sports'
};

let currentCategory = 'all';

// Video ID mapping for navigation (legacy support)
const videoIdMap = {
    'Epic Minecraft Castle Build': 'epic-minecraft-castle-build',
    'Persona 5 Best Moments': 'persona-5-best-moments',
    'DELTARUNE Chapter 3 Theories': 'deltarune-chapter-3-theories',
    'Chill Beats Mix Vol. 12': 'chill-beats-mix-vol-12',
    'HTML & CSS Tutorial': 'html-css-tutorial',
    'Top 10 Flash Games 2005': 'top-10-flash-games-2005',
    'The Roaring Twenties Documentary': 'roaring-twenties-documentary',
    'Mystery Review Episode 1': 'mystery-review-episode-1'
};

document.addEventListener('DOMContentLoaded', async function() {
    
    // Store upload state globally so we can track it
    window.wigtubeUploadInProgress = false;
    
    // Add detection for page unload to debug
    window.addEventListener('unload', function() {
        console.error('🔴🔴🔴 PAGE IS UNLOADING! 🔴🔴🔴');
        console.trace('Unload stack trace:');
    });
    
    window.addEventListener('pagehide', function() {
        console.error('🔴🔴🔴 PAGE IS HIDING! 🔴🔴🔴');
        console.trace('Pagehide stack trace:');
    });
    
    // Add global handler to detect unwanted page navigation during upload
    window.addEventListener('beforeunload', function(e) {
        console.warn('⚠️ beforeunload event fired, upload in progress:', window.wigtubeUploadInProgress);
        if (window.wigtubeUploadInProgress) {
            console.error('🔴🔴🔴 PAGE IS TRYING TO NAVIGATE/RELOAD DURING UPLOAD! 🔴🔴🔴');
            const message = 'Upload in progress! Are you sure you want to leave?';
            e.preventDefault();
            e.returnValue = message;
            return message;
        }
    });
    
    // Block ALL form submissions during upload
    document.addEventListener('submit', function(e) {
        console.error('🟡🟡🟡 Document-level submit event detected! 🟡🟡🟡');
        console.trace('Submit event stack trace:');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.error('🔴 Submit event blocked at document level');
        return false;
    }, true);
    
    // Load video data from JSON first
    const jsonLoaded = await loadVideoDataFromJSON();
    if (!jsonLoaded) {
        console.error('Failed to load video data from JSON, using fallback');
        videoData = fallbackVideoData;
    }
    
    // Set albumData from loaded metadata
    albumData = albumMetadata;
    
    // Try to load videos from database first
    await loadVideosWithStats();
    
    // Check if we should navigate to a specific channel (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const channelParam = urlParams.get('channel');
    if (channelParam) {
        // Clear the URL parameter
        window.history.replaceState({}, '', window.location.pathname);
        // Check if it's the current user's channel
        const currentUsername = localStorage.getItem('username');
        if (currentUsername && decodeURIComponent(channelParam) === currentUsername) {
            // Show own channel with customization options
            await showMyChannel();
        } else {
            // Show other user's channel
            await showChannel(decodeURIComponent(channelParam));
        }
    }
    
    updateStatus('WigTube loaded successfully');
    
    // Enhanced category button interactions with filtering
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all buttons
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get category from button text
            const categoryText = this.textContent.toLowerCase();
            let category = 'all';
            
            if (categoryText.includes('music')) category = 'music';
            else if (categoryText.includes('gaming')) category = 'gaming';
            else if (categoryText.includes('comedy')) category = 'comedy';
            else if (categoryText.includes('tech')) category = 'tech';
            else if (categoryText.includes('educational')) category = 'educational';
            else if (categoryText.includes('sports')) category = 'sports';
            
            currentCategory = category;
            
            // Filter and render videos
            filterVideosByCategory(category);
            
            // Show loading animation
            showLoadingProgress();
            
            // Update status
            updateStatus(`Showing ${categoryMap[category]} videos`);
        });
    });

    // Sidebar navigation interactions - now with status updates instead of alerts
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const itemText = this.textContent.trim();
            
            // Special handling for Albums link
            if (this.id === 'albumsLink' || itemText.includes('Albums')) {
                showAlbumsView();
            } 
            // Handle Home Page
            else if (itemText.includes('Home Page')) {
                showHomePage();
            }
            // Handle What's Hot
            else if (itemText.includes('What\'s Hot')) {
                showWhatsHot();
            }
            // Handle History
            else if (itemText.includes('History')) {
                showHistory();
            }
            // Handle Favorites
            else if (itemText.includes('Favorites')) {
                showFavorites();
            }
            // Handle My Channel
            else if (this.id === 'myChannelLink' || itemText.includes('My Channel')) {
                showMyChannel();
            }
            else {
                updateStatus(`Navigation: ${itemText} - Feature coming soon`);
                
                // Add visual feedback
                this.style.background = '#d0d8ff';
                setTimeout(() => {
                    this.style.background = 'white';
                }, 200);
            }
        });
    });

    // Enhanced search functionality with better feedback
    const searchBtn = document.querySelector('.search-btn');
    const searchBox = document.querySelector('.search-box');
    
    if (searchBtn && searchBox) {
        searchBtn.addEventListener('click', function() {
            performSearch();
        });
        
        // Enter key support
        searchBox.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Simulate initial page loading
    setTimeout(() => {
        const loadingProgress = document.querySelector('.loading-progress');
        if (loadingProgress) {
            loadingProgress.style.animation = 'none';
            loadingProgress.style.width = '100%';
        }
        
        updateStatus('Page loaded successfully');
    }, 3000);

    // Add hover effects for interactive elements
    document.querySelectorAll('.video-card, .category-btn, .sidebar-item').forEach(element => {
        element.style.cursor = 'pointer';
    });
});



// Utility functions

/**
 * Load videos with real-time stats from database
 */
async function loadVideosWithStats() {
    debugLog('loadVideosWithStats: Starting');
    if (typeof WigTubeDB !== 'undefined') {
        debugLog('loadVideosWithStats: WigTubeDB available');
        try {
            // Load all videos from database (user-uploaded videos)
            const dbVideos = await WigTubeDB.getAllVideos();
            debugLog('loadVideosWithStats: Loaded', dbVideos.length, 'videos from database');
            
            // Get all video IDs from local videoData (JSON file videos)
            const videoIds = videoData.map(v => v.id);
            debugLog('loadVideosWithStats: Fetching stats for', videoIds.length, 'JSON videos');
            
            // Fetch stats for each JSON video from Firestore
            const jsonVideosWithStats = await Promise.all(videoData.map(async (video) => {
                try {
                    debugLog('loadVideosWithStats: Fetching', video.id);
                    const dbVideo = await WigTubeDB.getVideoById(video.id);
                    if (dbVideo) {
                        // Use cached rating data from video document (efficient - no extra reads)
                        const userRatings = dbVideo.userRatings ? Object.values(dbVideo.userRatings) : [];
                        debugLog('loadVideosWithStats: Got stats for', video.id, '-', dbVideo.viewCount, 'views,', userRatings.length, 'ratings');
                        return {
                            ...video,
                            views: WigTubeDB.formatViewCount(dbVideo.viewCount || 0),
                            rating: WigTubeDB.calculateStarRating(userRatings)
                        };
                    }
                } catch (err) {
                    console.error(`Error loading stats for ${video.id}:`, err);
                    debugLog('loadVideosWithStats: ERROR for', video.id, err);
                }
                debugLog('loadVideosWithStats: No stats for', video.id, '- using zeros');
                return {
                    ...video,
                    views: '0 views',
                    rating: '☆☆☆☆☆'
                };
            }));
            
            // Format database videos to match video card format
            const formattedDbVideos = dbVideos.map(dbVideo => {
                const userRatings = dbVideo.userRatings ? Object.values(dbVideo.userRatings) : [];
                return {
                    id: dbVideo.id,
                    title: dbVideo.title,
                    author: dbVideo.uploaderName || dbVideo.uploaderId || 'Unknown',
                    uploaderName: dbVideo.uploaderName || dbVideo.uploaderId,
                    uploaderId: dbVideo.uploaderId,
                    uploadDate: dbVideo.uploadDate || 'Unknown',
                    duration: dbVideo.duration || '0:00',
                    views: WigTubeDB.formatViewCount(dbVideo.viewCount || 0),
                    rating: WigTubeDB.calculateStarRating(userRatings),
                    thumbnail: dbVideo.thumbnail || 'assets/images/thumbnail/default.png',
                    category: dbVideo.category || 'other',
                    videoUrl: dbVideo.videoUrl
                };
            });
            
            // Merge database videos with JSON videos (database videos first for better visibility)
            const allVideos = [...formattedDbVideos, ...jsonVideosWithStats];
            
            debugLog('loadVideosWithStats: Rendering', allVideos.length, 'videos total');
            renderVideos(allVideos);
            return;
        } catch (error) {
            console.error('Error loading videos from database:', error);
            debugLog('loadVideosWithStats: ERROR', error);
        }
    } else {
        debugLog('loadVideosWithStats: WigTubeDB not available');
    }
    
    // Fallback: render with zeros
    debugLog('loadVideosWithStats: Using fallback (zeros)');
    const videosWithZeros = videoData.map(video => ({
        ...video,
        views: '0 views',
        rating: '☆☆☆☆☆'
    }));
    renderVideos(videosWithZeros);
}

function renderVideos(videos) {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;
    
    videoGrid.innerHTML = '';
    
    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        videoGrid.appendChild(videoCard);
    });
    
    // Re-attach click events for video cards
    attachVideoCardEvents();
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.setAttribute('data-video-id', video.id);
    
    // Get uploader username - could be from author, uploaderName, or uploaderId
    const uploaderName = video.uploaderName || video.author || video.uploaderId || 'Unknown';
    const uploaderId = video.uploaderId || video.uploaderName || video.author;
    
    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(45deg, #c0c0c0 25%, transparent 25%)'; this.parentElement.style.backgroundSize='20px 20px';">
            <div class="video-duration">${video.duration}</div>
        </div>
        <div class="video-info">
            <h3>${video.title}</h3>
            <div class="video-meta">
                by <span class="channel-link" data-channel="${uploaderId}" style="color: #0000ff; text-decoration: underline; cursor: pointer;">${uploaderName}</span><br>
                Added: ${video.uploadDate}
            </div>
            <div class="video-stats">
                <span>👁️ ${video.views}</span>
                <span class="rating-stars">${video.rating}</span>
            </div>
        </div>
    `;
    
    return card;
}

function attachVideoCardEvents() {
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Check if clicked on channel link
            if (e.target.classList.contains('channel-link')) {
                e.stopPropagation(); // Prevent video card click
                const channelName = e.target.getAttribute('data-channel');
                if (channelName) {
                    showChannel(channelName);
                }
                return;
            }
            
            const videoId = this.getAttribute('data-video-id');
            const videoTitle = this.querySelector('h3').textContent;
            
            if (videoId) {
                // Navigate to video player page with video ID
                updateStatus(`Loading video: ${videoTitle}`);
                window.location.href = `apps/browser/pages/wigtube-player.html?v=${videoId}`;
            } else {
                // Fallback - try legacy mapping
                const legacyId = videoIdMap[videoTitle];
                if (legacyId) {
                    updateStatus(`Loading video: ${videoTitle}`);
                    window.location.href = `apps/browser/pages/wigtube-player.html?v=${legacyId}`;
                } else {
                    updateStatus(`Error: Video "${videoTitle}" not available`);
                }
            }
        });
    });
}

async function filterVideosByCategory(category) {
    let filteredVideos;
    
    if (category === 'all') {
        filteredVideos = videoData;
    } else {
        filteredVideos = videoData.filter(video => video.category === category);
    }
    
    // Load real-time stats from database for filtered videos
    if (typeof WigTubeDB !== 'undefined') {
        debugLog('filterVideosByCategory: Loading stats for', filteredVideos.length, 'videos');
        try {
            const videosWithStats = await Promise.all(filteredVideos.map(async (video) => {
                try {
                    const dbVideo = await WigTubeDB.getVideoById(video.id);
                    if (dbVideo) {
                        debugLog('filterVideosByCategory: Got stats for', video.id, '-', dbVideo.viewCount, 'views');
                        return {
                            ...video,
                            views: WigTubeDB.formatViewCount(dbVideo.viewCount || 0),
                            rating: WigTubeDB.calculateStarRating(dbVideo.ratings || [])
                        };
                    }
                } catch (err) {
                    console.error(`Error loading stats for ${video.id}:`, err);
                }
                return {
                    ...video,
                    views: '0 views',
                    rating: '☆☆☆☆☆'
                };
            }));
            
            renderVideos(videosWithStats);
        } catch (error) {
            console.error('Error loading stats for category:', error);
            renderVideos(filteredVideos);
        }
    } else {
        // Fallback: render with zeros
        const videosWithZeros = filteredVideos.map(video => ({
            ...video,
            views: '0 views',
            rating: '☆☆☆☆☆'
        }));
        renderVideos(videosWithZeros);
    }
    
    // Update content header
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        const categoryName = categoryMap[category];
        contentHeader.textContent = `📺 ${categoryName} - ${filteredVideos.length} video(s) found`;
    }
}

async function performSearch() {
    const searchBox = document.querySelector('.search-box');
    const query = searchBox.value.trim().toLowerCase();
    
    if (!query) {
        updateStatus('Search Error: Please enter a search term');
        return;
    }
    
    // Search through video data
    const searchResults = videoData.filter(video => {
        return video.title.toLowerCase().includes(query) ||
               video.author.toLowerCase().includes(query) ||
               video.category.toLowerCase().includes(query);
    });
    
    // Load real-time stats from database for search results
    if (typeof WigTubeDB !== 'undefined') {
        debugLog('performSearch: Loading stats for', searchResults.length, 'videos');
        try {
            const videosWithStats = await Promise.all(searchResults.map(async (video) => {
                try {
                    const dbVideo = await WigTubeDB.getVideoById(video.id);
                    if (dbVideo) {
                        return {
                            ...video,
                            views: WigTubeDB.formatViewCount(dbVideo.viewCount || 0),
                            rating: WigTubeDB.calculateStarRating(dbVideo.ratings || [])
                        };
                    }
                } catch (err) {
                    console.error(`Error loading stats for ${video.id}:`, err);
                }
                return {
                    ...video,
                    views: '0 views',
                    rating: '☆☆☆☆☆'
                };
            }));
            
            renderVideos(videosWithStats);
        } catch (error) {
            console.error('Error loading stats for search:', error);
            renderVideos(searchResults);
        }
    } else {
        // Fallback: render with zeros
        const videosWithZeros = searchResults.map(video => ({
            ...video,
            views: '0 views',
            rating: '☆☆☆☆☆'
        }));
        renderVideos(videosWithZeros);
    }
    
    // Update content header
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        contentHeader.textContent = `🔍 Search Results for "${query}" - ${searchResults.length} video(s) found`;
    }
    
    // Reset category selection
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    
    updateStatus(`Search completed: ${searchResults.length} result(s) for "${query}"`);
    showLoadingProgress();
}

function showLoadingProgress() {
    const loadingBar = document.querySelector('.loading-progress');
    if (loadingBar) {
        loadingBar.style.animation = 'none';
        loadingBar.style.width = '0%';
        
        setTimeout(() => {
            loadingBar.style.animation = 'loading 1.5s ease-in-out';
        }, 100);
        
        setTimeout(() => {
            loadingBar.style.animation = 'none';
            loadingBar.style.width = '100%';
        }, 1600);
    }
}

function updateStatus(message) {
    const statusText = document.querySelector('.status-bar span');
    if (statusText) {
        statusText.textContent = message;
    }
}

// Simulate dial-up era image loading
function simulateSlowImageLoading() {
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
        img.style.opacity = '0.3';
        img.style.filter = 'blur(2px)';
        
        setTimeout(() => {
            img.style.transition = 'all 0.8s ease-in-out';
            img.style.opacity = '1';
            img.style.filter = 'none';
        }, index * 300 + 1000);
    });
}

// Simulate the slow connection loading effect
setTimeout(simulateSlowImageLoading, 500);

// Add a "loading complete" notification after everything loads
setTimeout(() => {
    // Change marquee text to indicate completion
    const marqueeText = document.querySelector('.marquee-text');
    if (marqueeText) {
        marqueeText.textContent = '🎉 Welcome to WigTube! All content loaded successfully. Enjoy browsing our video collection! 🎬';
    }
}, 4000);

// ============================================
// Album/Playlist Functions
// ============================================

/**
 * Show albums view in 2003 YouTube style
 */
function showAlbumsView() {
    const videoGrid = document.querySelector('.video-grid');
    const contentHeader = document.querySelector('.content-header');
    
    if (!videoGrid || !contentHeader) return;
    
    // Update header
    contentHeader.innerHTML = '📀 Albums & Playlists - Click to play';
    
    // Hide category buttons
    const categoryButtons = document.querySelector('.video-categories');
    if (categoryButtons) {
        categoryButtons.style.display = 'none';
    }
    
    // Clear video grid and show albums
    videoGrid.innerHTML = '';
    
    // Add back button
    const backButton = document.createElement('div');
    backButton.style.cssText = `
        margin-bottom: 15px;
        padding: 8px 12px;
        background: white;
        border: 2px outset #ddd;
        display: inline-block;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
    `;
    backButton.innerHTML = '⬅ Back to Videos';
    backButton.onclick = async () => {
        if (categoryButtons) categoryButtons.style.display = 'flex';
        await loadVideosWithStats();
        contentHeader.innerHTML = '📺 Featured Videos - Updated Daily!';
        updateStatus('Returned to video view');
    };
    
    videoGrid.appendChild(backButton);
    
    // Create albums grid
    albumData.forEach(album => {
        const albumCard = createAlbumCard(album);
        videoGrid.appendChild(albumCard);
    });
    
    updateStatus(`Showing ${albumData.length} album(s)`);
    showLoadingProgress();
}

/**
 * Create album card in 2003 YouTube style
 */
function createAlbumCard(album) {
    const card = document.createElement('div');
    card.className = 'video-card album-card';
    card.style.cursor = 'pointer';
    
    card.innerHTML = `
        <div class="video-thumbnail" style="position: relative;">
            <img src="${album.thumbnail}" alt="${album.title}" 
                 onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(45deg, #c0c0c0 25%, transparent 25%)'; this.parentElement.style.backgroundSize='20px 20px';">
            <div style="
                position: absolute;
                top: 5px;
                left: 5px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 3px 8px;
                font-size: 10px;
                font-weight: bold;
                border: 1px solid white;
            ">
                📀 ALBUM
            </div>
            <div class="video-duration" style="background: rgba(204,0,0,0.9);">
                ${album.trackCount} tracks
            </div>
        </div>
        <div class="video-info">
            <h3 style="color: #c00;">🎵 ${album.title}</h3>
            <div class="video-meta">
                by ${album.creator}<br>
                Total: ${album.totalDuration}
            </div>
            <div class="video-stats">
                <span style="font-size: 10px; color: #666;">
                    ${album.description}
                </span>
            </div>
            <div style="margin-top: 8px; padding: 5px; background: #ffffcc; border: 1px solid #cc9; font-size: 10px; text-align: center;">
                <strong>▶ Click to play all tracks in order</strong>
            </div>
        </div>
    `;
    
    // Add click handler
    card.addEventListener('click', function() {
        updateStatus(`Loading album: ${album.title}`);
        window.location.href = `apps/browser/pages/wigtube-player.html?album=${album.id}`;
    });
    
    // Hover effect
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
        this.style.boxShadow = '4px 4px 0px #999';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '2px 2px 0px #999';
    });
    
    return card;
}

/**
 * Show homepage - reload default view with all videos
 */
async function showHomePage() {
    const categoryButtons = document.querySelector('.video-categories');
    const contentHeader = document.querySelector('.content-header');
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const featuredBox = document.querySelector('.featured-box');
    const mainContainer = document.querySelector('.main-container');
    const videoGrid = document.querySelector('.video-grid');
    
    // Restore all hidden elements
    if (sidebar) sidebar.style.display = '';
    if (categoryButtons) categoryButtons.style.display = 'flex';
    if (featuredBox) featuredBox.style.display = '';
    if (contentHeader) {
        contentHeader.style.display = '';
        contentHeader.innerHTML = '📺 Featured Videos - Updated Daily!';
    }
    if (content) {
        content.style.flex = '';
        content.style.width = '';
        content.style.maxWidth = '';
        content.style.padding = '';
        content.style.margin = '';
    }
    if (mainContainer) {
        mainContainer.style.display = 'flex';
        mainContainer.style.width = '';
    }
    
    // Reset video-grid styles to default
    if (videoGrid) {
        videoGrid.style.display = '';
        videoGrid.style.width = '';
        videoGrid.style.maxWidth = '';
        videoGrid.style.margin = '';
        videoGrid.style.padding = '';
        videoGrid.style.gridTemplateColumns = '';
    }
    
    // Reset to "All Videos" category
    currentCategory = 'all';
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.textContent.trim() === 'All Videos') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Reload all videos
    await loadVideosWithStats();
    
    updateStatus('Showing home page');
    showLoadingProgress();
}

/**
 * Show What's Hot - top 3 videos by view count with fire border
 */
async function showWhatsHot() {
    const categoryButtons = document.querySelector('.video-categories');
    const contentHeader = document.querySelector('.content-header');
    const videoGrid = document.querySelector('.video-grid');
    
    if (!videoGrid || !contentHeader) return;
    
    // Hide category buttons
    if (categoryButtons) {
        categoryButtons.style.display = 'none';
    }
    
    // Update header
    contentHeader.innerHTML = '🔥 What\'s Hot - Top Videos by Views!';
    
    updateStatus('Loading hottest videos...');
    showLoadingProgress();
    
    try {
        // Load videos with stats from database
        let videosWithStats;
        
        if (typeof WigTubeDB !== 'undefined') {
            debugLog('showWhatsHot: Loading stats from database');
            videosWithStats = await Promise.all(videoData.map(async (video) => {
                try {
                    const dbVideo = await WigTubeDB.getVideoById(video.id);
                    if (dbVideo) {
                        return {
                            ...video,
                            viewCount: dbVideo.viewCount || 0,
                            views: WigTubeDB.formatViewCount(dbVideo.viewCount || 0),
                            rating: WigTubeDB.calculateStarRating(dbVideo.ratings || [])
                        };
                    }
                } catch (err) {
                    console.error(`Error loading stats for ${video.id}:`, err);
                }
                return {
                    ...video,
                    viewCount: 0,
                    views: '0 views',
                    rating: '☆☆☆☆☆'
                };
            }));
        } else {
            // Fallback: use zeros
            videosWithStats = videoData.map(video => ({
                ...video,
                viewCount: 0,
                views: '0 views',
                rating: '☆☆☆☆☆'
            }));
        }
        
        // Sort by view count (descending) and get top 3
        videosWithStats.sort((a, b) => b.viewCount - a.viewCount);
        const topVideos = videosWithStats.slice(0, 3);
        
        // Clear grid
        videoGrid.innerHTML = '';
        
        // Add back button
        const backButton = document.createElement('div');
        backButton.style.cssText = `
            margin-bottom: 15px;
            padding: 8px 12px;
            background: white;
            border: 2px outset #ddd;
            display: inline-block;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        `;
        backButton.innerHTML = '⬅ Back to Home';
        backButton.onclick = showHomePage;
        videoGrid.appendChild(backButton);
        
        // Render top 3 videos with fire border
        topVideos.forEach((video, index) => {
            const videoCard = createVideoCard(video);
            
            // Add fire border styling
            videoCard.style.cssText = `
                border: 4px solid transparent;
                border-image: linear-gradient(45deg, #ff4500, #ff8c00, #ffa500, #ff4500) 1;
                background: linear-gradient(white, white) padding-box,
                           linear-gradient(45deg, #ff4500, #ff8c00, #ffa500, #ff4500) border-box;
                box-shadow: 0 0 15px rgba(255, 69, 0, 0.5), inset 0 0 10px rgba(255, 140, 0, 0.1);
                position: relative;
            `;
            
            // Add "HOT" badge
            const hotBadge = document.createElement('div');
            hotBadge.style.cssText = `
                position: absolute;
                top: -10px;
                right: -10px;
                background: linear-gradient(135deg, #ff4500, #ff8c00);
                color: white;
                padding: 5px 12px;
                font-size: 11px;
                font-weight: bold;
                border: 2px solid white;
                border-radius: 12px;
                box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                z-index: 10;
            `;
            hotBadge.innerHTML = `🔥 #${index + 1} HOT`;
            videoCard.style.position = 'relative';
            videoCard.appendChild(hotBadge);
            
            videoGrid.appendChild(videoCard);
        });
        
        // Re-attach click events
        attachVideoCardEvents();
        
        updateStatus(`Showing top ${topVideos.length} hottest video(s)`);
        
    } catch (error) {
        console.error('Error loading What\'s Hot:', error);
        updateStatus('Error loading hot videos');
    }
}

/**
 * Show watch history
 */
async function showHistory() {
    const categoryButtons = document.querySelector('.video-categories');
    const contentHeader = document.querySelector('.content-header');
    const videoGrid = document.querySelector('.video-grid');
    
    if (!videoGrid || !contentHeader) return;
    
    // Hide category buttons
    if (categoryButtons) {
        categoryButtons.style.display = 'none';
    }
    
    // Update header
    contentHeader.innerHTML = '📜 Watch History';
    
    updateStatus('Loading watch history...');
    showLoadingProgress();
    
    try {
        // Get history from WigTubeDB
        if (typeof WigTubeDB === 'undefined') {
            updateStatus('History feature requires database connection');
            videoGrid.innerHTML = '<div style="padding: 20px; text-align: center;">History feature unavailable</div>';
            return;
        }
        
        const history = WigTubeDB.getHistory(50);
        
        // Clear grid
        videoGrid.innerHTML = '';
        
        // Add back button
        const backButton = document.createElement('div');
        backButton.style.cssText = `
            margin-bottom: 15px;
            padding: 8px 12px;
            background: white;
            border: 2px outset #ddd;
            display: inline-block;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        `;
        backButton.innerHTML = '⬅ Back to Home';
        backButton.onclick = showHomePage;
        videoGrid.appendChild(backButton);
        
        if (history.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = `
                padding: 40px 20px;
                text-align: center;
                color: #666;
                font-size: 14px;
            `;
            emptyMsg.innerHTML = '📺 No watch history yet<br>Start watching videos to build your history!';
            videoGrid.appendChild(emptyMsg);
            updateStatus('No watch history found');
            return;
        }
        
        // Render history videos
        for (const historyItem of history) {
            // Get full video data
            const dbVideo = await WigTubeDB.getVideoById(historyItem.videoId);
            const videoInfo = {
                id: historyItem.videoId,
                title: historyItem.title,
                thumbnail: historyItem.thumbnail,
                duration: historyItem.duration,
                author: historyItem.author,
                views: dbVideo ? WigTubeDB.formatViewCount(dbVideo.viewCount || 0) : '0 views',
                rating: dbVideo ? WigTubeDB.calculateStarRating(Object.values(dbVideo.userRatings || {})) : '☆☆☆☆☆',
                uploadDate: dbVideo ? dbVideo.uploadDate : ''
            };
            
            const videoCard = createVideoCard(videoInfo);
            videoGrid.appendChild(videoCard);
        }
        
        // Re-attach click events
        attachVideoCardEvents();
        
        updateStatus(`Showing ${history.length} video(s) from history`);
        
    } catch (error) {
        console.error('Error loading history:', error);
        updateStatus('Error loading watch history');
    }
}

/**
 * Show favorites
 */
async function showFavorites() {
    const categoryButtons = document.querySelector('.video-categories');
    const contentHeader = document.querySelector('.content-header');
    const videoGrid = document.querySelector('.video-grid');
    
    if (!videoGrid || !contentHeader) return;
    
    // Hide category buttons
    if (categoryButtons) {
        categoryButtons.style.display = 'none';
    }
    
    // Update header
    contentHeader.innerHTML = '⭐ Favorites';
    
    updateStatus('Loading favorites...');
    showLoadingProgress();
    
    try {
        // Get favorites from WigTubeDB
        if (typeof WigTubeDB === 'undefined') {
            updateStatus('Favorites feature requires database connection');
            videoGrid.innerHTML = '<div style="padding: 20px; text-align: center;">Favorites feature unavailable</div>';
            return;
        }
        
        const favorites = WigTubeDB.getFavorites();
        
        // Clear grid
        videoGrid.innerHTML = '';
        
        // Add back button
        const backButton = document.createElement('div');
        backButton.style.cssText = `
            margin-bottom: 15px;
            padding: 8px 12px;
            background: white;
            border: 2px outset #ddd;
            display: inline-block;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        `;
        backButton.innerHTML = '⬅ Back to Home';
        backButton.onclick = showHomePage;
        videoGrid.appendChild(backButton);
        
        if (favorites.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = `
                padding: 40px 20px;
                text-align: center;
                color: #666;
                font-size: 14px;
            `;
            emptyMsg.innerHTML = '⭐ No favorites yet<br>Click the star button on videos to add them to your favorites!';
            videoGrid.appendChild(emptyMsg);
            updateStatus('No favorites found');
            return;
        }
        
        // Render favorite videos
        for (const favoriteItem of favorites) {
            // Get full video data
            const dbVideo = await WigTubeDB.getVideoById(favoriteItem.videoId);
            const videoInfo = {
                id: favoriteItem.videoId,
                title: favoriteItem.title,
                thumbnail: favoriteItem.thumbnail,
                duration: favoriteItem.duration,
                author: favoriteItem.author,
                views: dbVideo ? WigTubeDB.formatViewCount(dbVideo.viewCount || 0) : '0 views',
                rating: dbVideo ? WigTubeDB.calculateStarRating(Object.values(dbVideo.userRatings || {})) : '☆☆☆☆☆',
                uploadDate: dbVideo ? dbVideo.uploadDate : ''
            };
            
            const videoCard = createVideoCard(videoInfo);
            
            // Add favorite indicator
            videoCard.style.border = '3px solid gold';
            
            videoGrid.appendChild(videoCard);
        }
        
        // Re-attach click events
        attachVideoCardEvents();
        
        updateStatus(`Showing ${favorites.length} favorite video(s)`);
        
    } catch (error) {
        console.error('Error loading favorites:', error);
        updateStatus('Error loading favorites');
    }
}

// Reload videos when page is shown (handles back button navigation)
window.addEventListener('pageshow', async function(event) {
    // If page was loaded from cache (bfcache), reload the videos to get updated view counts
    if (event.persisted) {
        console.log('Page loaded from cache, refreshing video stats...');
        await loadVideosWithStats();
    }
});

// ============================================
// Upload Video Functions
// ============================================

/**
 * Show upload video dialog
 */
function showUploadVideoDialog() {
    console.log('📋 showUploadVideoDialog called');
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername || currentUsername.toLowerCase() === 'guest') {
        updateStatus('Please log in to upload videos');
        alert('You must be logged in to upload videos!');
        return;
    }

    const videoGrid = document.querySelector('.video-grid');
    const contentHeader = document.querySelector('.content-header');
    const categoryButtons = document.querySelector('.video-categories');
    
    if (!videoGrid || !contentHeader) {
        console.error('❌ videoGrid or contentHeader not found');
        return;
    }
    
    console.log('📋 Creating upload form...');
    
    // Hide category buttons
    if (categoryButtons) {
        categoryButtons.style.display = 'none';
    }
    
    // Update header
    contentHeader.innerHTML = '⬆️ Upload Video';
    
    // Create upload form
    videoGrid.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border: 2px outset #ddd;">
            <div style="margin-bottom: 15px;">
                <button type="button" id="backToHomeButton" style="
                    padding: 6px 12px;
                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                    font-size: 11px;
                    font-family: 'MS Sans Serif', sans-serif;
                ">⬅ Back to Home</button>
            </div>
            
            <h2 style="font-size: 16px; margin-bottom: 15px; color: #316ac5;">Upload New Video</h2>
            
            <div id="uploadFormReady" style="display: none; color: green; margin-bottom: 10px; font-weight: bold;">✅ Form ready - you can now upload</div>
            
            <form id="uploadVideoForm" action="javascript:void(0);" method="post" novalidate onsubmit="event.preventDefault(); event.stopPropagation(); console.log('INLINE: Form submit blocked'); return false;" style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Title *</label>
                    <input type="text" id="videoTitle" style="
                        width: 100%;
                        padding: 4px;
                        border: 2px inset #d4d0c8;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description</label>
                    <textarea id="videoDescription" rows="4" style="
                        width: 100%;
                        padding: 4px;
                        border: 2px inset #d4d0c8;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                    "></textarea>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Video File *</label>
                    <input type="file" id="videoFile" accept="video/*" style="
                        width: 100%;
                        padding: 4px;
                        border: 2px inset #d4d0c8;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">
                    <small id="videoFileStatus" style="color: #666;">Select a video file - it will be uploaded to the repository</small>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Thumbnail</label>
                    <select id="thumbnailSourceType" style="
                        width: 100%;
                        padding: 4px;
                        border: 2px inset #d4d0c8;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                        margin-bottom: 8px;
                    ">
                        <option value="file">Upload Image</option>
                        <option value="url">Image URL</option>
                        <option value="none">Use Default</option>
                    </select>
                    
                    <input type="file" id="thumbnailFile" accept="image/*" style="
                        width: 100%;
                        padding: 4px;
                        border: 2px inset #d4d0c8;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                        display: block;
                    ">
                    
                    <input type="text" id="videoThumbnail" placeholder="https://example.com/image.png or assets/images/thumbnail/mythumb.png" style="
                        width: 100%;
                        padding: 4px;
                        border: 2px inset #d4d0c8;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                        display: none;
                    ">
                    
                    <small style="color: #666;">Upload an image or paste a URL, or use default thumbnail</small>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Category *</label>
                        <select id="videoCategory" style="
                            width: 100%;
                            padding: 4px;
                            border: 2px inset #d4d0c8;
                            font-size: 11px;
                            font-family: 'MS Sans Serif', sans-serif;
                        ">
                            <option value="music">🎵 Music Videos</option>
                            <option value="gaming">🎮 Gaming</option>
                            <option value="comedy">😂 Comedy</option>
                            <option value="news">📰 News</option>
                            <option value="sports">🏆 Sports</option>
                            <option value="movies">🎬 Movies</option>
                            <option value="tech">💻 Tech</option>
                            <option value="educational">📚 Educational</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Duration *</label>
                        <input type="text" id="videoDuration" placeholder="Auto-detected" readonly style="
                            width: 100%;
                            padding: 4px;
                            border: 2px inset #d4d0c8;
                            font-size: 11px;
                            font-family: 'MS Sans Serif', sans-serif;
                            background-color: #f0f0f0;
                        ">
                        <small style="color: #666;">Auto-detected when video is selected</small>
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Tags</label>
                    <input type="text" id="videoTags" placeholder="funny, viral, trending" style="
                        width: 100%;
                        padding: 4px;
                        border: 2px inset #d4d0c8;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">
                    <small style="color: #666;">Separate tags with commas</small>
                </div>
                
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button type="button" id="uploadVideoButton" style="
                        flex: 1;
                        padding: 8px;
                        background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                        border: 2px outset #d4d0c8;
                        cursor: pointer;
                        font-size: 11px;
                        font-weight: bold;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">📤 Upload Video</button>
                    
                    <button type="button" id="cancelUploadButton" style="
                        padding: 8px 16px;
                        background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                        border: 2px outset #d4d0c8;
                        cursor: pointer;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    // Prevent form submission at form level - CRITICAL to prevent page refresh!
    const uploadForm = document.getElementById('uploadVideoForm');
    if (uploadForm) {
        console.log('🟢 Upload form found, attaching nuclear prevention');
        
        // Set action to javascript void to prevent any navigation
        uploadForm.action = 'javascript:void(0);';
        uploadForm.method = 'post';
        uploadForm.removeAttribute('target');
        
        // Only stop submit events from propagating, not all events
        uploadForm.addEventListener('submit', (e) => {
            console.log('🟡 Form submit event - stopping propagation to parent');
            e.stopPropagation();
        }, true);
        
        // Multiple layers of prevention to stop form submission
        const preventSubmit = (e) => {
            console.error('🔴🔴🔴 FORM SUBMIT EVENT FIRED - BLOCKING! 🔴🔴🔴');
            console.trace('Form submit stack trace:');
            if (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
            return false;
        };
        
        // Attach to both capture and bubble phases
        uploadForm.addEventListener('submit', preventSubmit, true);
        uploadForm.addEventListener('submit', preventSubmit, false);
        
        // Set onsubmit directly as last resort
        uploadForm.onsubmit = (e) => {
            console.log('🔴 onsubmit triggered - BLOCKING!');
            if (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
            return false;
        };
        
        // Prevent Enter key from submitting the form in ANY input except textarea
        uploadForm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                console.log('🔴 Enter key pressed in form - BLOCKING!');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }, true);
        
        // Also prevent on keypress and keyup to be extra safe
        uploadForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);
        
        console.log('✅ Form submit prevention handlers attached');
    } else {
        console.error('❌ Upload form not found!');
    }
    
    // Attach button click handler instead of form submission
    const uploadButton = document.getElementById('uploadVideoButton');
    if (uploadButton) {
        // Remove any type="submit" if accidentally set
        uploadButton.setAttribute('type', 'button');
        
        // Remove the inline onclick and replace with our handler
        uploadButton.onclick = null;
        
        uploadButton.addEventListener('click', async (e) => {
            console.log('🔵 ==================== UPLOAD BUTTON CLICKED ====================');
            console.log('🔵 Event type:', e.type);
            console.log('🔵 Event target:', e.target);
            console.log('🔵 Current target:', e.currentTarget);
            console.log('🔵 Event phase:', e.eventPhase);
            console.log('🔵 Default prevented:', e.defaultPrevented);
            console.trace('Upload button click stack trace:');
            
            if (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
            
            console.log('🔵 After preventDefault - defaultPrevented:', e.defaultPrevented);
            
            // Disable button during upload to prevent double-clicks
            uploadButton.disabled = true;
            uploadButton.textContent = '⏳ Uploading...';
            uploadButton.style.opacity = '0.6';
            
            console.log('🔵 Calling handleVideoUpload...');
            
            try {
                const result = await handleVideoUpload(e);
                console.log('🔵 handleVideoUpload completed successfully, result:', result);
                
                // Clear the form only if user chose to stay on upload page
                if (result === 'stay') {
                    const form = document.getElementById('uploadVideoForm');
                    if (form) {
                        form.reset();
                        console.log('🔵 Form cleared for next upload');
                    }
                }
            } catch (error) {
                console.error('🔴 Error in upload button handler:', error);
                alert('Upload error: ' + error.message);
            } finally {
                // Re-enable button
                uploadButton.disabled = false;
                uploadButton.textContent = '📤 Upload Video';
                uploadButton.style.opacity = '1';
            }
            return false;
        }, true);
        
        console.log('✅ Upload button handler attached successfully');
    } else {
        console.error('❌ Upload button not found!');
    }
    
    // Attach cancel button handler
    const cancelButton = document.getElementById('cancelUploadButton');
    if (cancelButton) {
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showHomePage();
        });
        console.log('✅ Cancel button handler attached successfully');
    }
    
    // Attach back button handler
    const backToHomeButton = document.getElementById('backToHomeButton');
    if (backToHomeButton) {
        backToHomeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showHomePage();
        });
        console.log('✅ Back to Home button handler attached successfully');
    }
    
    // Add thumbnail source type switcher
    const thumbnailSourceSelect = document.getElementById('thumbnailSourceType');
    const thumbnailFileInput = document.getElementById('thumbnailFile');
    const thumbnailUrlInput = document.getElementById('videoThumbnail');
    
    if (thumbnailSourceSelect) {
        thumbnailSourceSelect.addEventListener('change', function() {
            if (this.value === 'file') {
                thumbnailFileInput.style.display = 'block';
                thumbnailUrlInput.style.display = 'none';
            } else if (this.value === 'url') {
                thumbnailFileInput.style.display = 'none';
                thumbnailUrlInput.style.display = 'block';
            } else {
                // none - use default
                thumbnailFileInput.style.display = 'none';
                thumbnailUrlInput.style.display = 'none';
            }
        });
    }
    
    // Add automatic video duration detection
    const videoFileInput = document.getElementById('videoFile');
    const videoDurationInput = document.getElementById('videoDuration');
    const videoFileStatus = document.getElementById('videoFileStatus');
    
    if (videoFileInput && videoDurationInput) {
        videoFileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file && file.type.startsWith('video/')) {
                if (videoFileStatus) {
                    videoFileStatus.textContent = '⏳ Detecting duration...';
                    videoFileStatus.style.color = '#666';
                }
                
                // Create a video element to read metadata
                const video = document.createElement('video');
                video.preload = 'metadata';
                
                video.onloadedmetadata = function() {
                    window.URL.revokeObjectURL(video.src);
                    const duration = Math.floor(video.duration);
                    const minutes = Math.floor(duration / 60);
                    const seconds = duration % 60;
                    const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    videoDurationInput.value = formattedDuration;
                    console.log('✅ Video duration detected:', formattedDuration);
                    
                    if (videoFileStatus) {
                        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
                        videoFileStatus.textContent = `✅ ${file.name} (${fileSizeMB} MB, ${formattedDuration})`;
                        videoFileStatus.style.color = '#008000';
                    }
                };
                
                video.onerror = function() {
                    console.warn('⚠️ Could not detect video duration');
                    if (videoFileStatus) {
                        videoFileStatus.textContent = '⚠️ Could not detect duration - please enter manually';
                        videoFileStatus.style.color = '#ff6600';
                    }
                    // Make field editable if auto-detection fails
                    videoDurationInput.removeAttribute('readonly');
                    videoDurationInput.style.backgroundColor = '#ffffff';
                    videoDurationInput.placeholder = '3:45';
                };
                
                video.src = URL.createObjectURL(file);
            }
        });
    }
    
    updateStatus('Ready to upload video');
    
    // Use setTimeout to ensure handlers are attached AFTER the DOM is fully ready
    setTimeout(() => {
        const readyIndicator = document.getElementById('uploadFormReady');
        if (readyIndicator) {
            readyIndicator.style.display = 'block';
            setTimeout(() => {
                readyIndicator.style.display = 'none';
            }, 2000);
        }
        console.log('✅✅✅ Upload form is fully initialized and ready ✅✅✅');
    }, 100);
}

/**
 * Handle video upload
 */
async function handleVideoUpload(event) {
    console.log('🟢 ==================== UPLOAD START ====================');
    console.log('🟢 handleVideoUpload called');
    
    // Set global upload flag
    window.wigtubeUploadInProgress = true;
    
    // CRITICAL: Prevent any and all form submission or navigation
    if (event) {
        try {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            console.log('🟢 Event prevented successfully');
        } catch (preventError) {
            console.error('🔴 Error preventing event:', preventError);
        }
    }
    
    try {
        console.log('🟢 Starting upload process...');
        const currentUsername = localStorage.getItem('username');
        if (!currentUsername || currentUsername.toLowerCase() === 'guest') {
            console.log('🔴 Not logged in');
            window.wigtubeUploadInProgress = false;
            alert('You must be logged in to upload videos!');
            return false;
        }
        
        console.log('🟢 User logged in as:', currentUsername);
        
        // Check if WigTubeDB is available
        if (typeof WigTubeDB === 'undefined') {
            console.log('🔴 WigTubeDB not available');
            alert('Upload feature is currently unavailable. Please try again later.');
            return false;
        }
        
        console.log('🟢 Getting form elements...');
        // Get form values
        const title = document.getElementById('videoTitle');
        const description = document.getElementById('videoDescription');
        const videoFile = document.getElementById('videoFile');
        const thumbnailSourceType = document.getElementById('thumbnailSourceType');
        const thumbnailFile = document.getElementById('thumbnailFile');
        const thumbnailUrlInput = document.getElementById('videoThumbnail');
        const category = document.getElementById('videoCategory');
        const duration = document.getElementById('videoDuration');
        const tagsInput = document.getElementById('videoTags');
        
        console.log('🟢 Form elements retrieved');
        
        // Check if elements exist
        if (!title || !videoFile || !duration || !category) {
            console.error('🔴 Upload form elements not found');
            alert('Upload form is not properly initialized. Please try again.');
            return false;
        }
        
        const titleValue = title.value.trim();
        const descriptionValue = description ? description.value.trim() : '';
        const thumbnailSourceTypeValue = thumbnailSourceType ? thumbnailSourceType.value : 'none';
        const thumbnailUrlInputValue = thumbnailUrlInput ? thumbnailUrlInput.value.trim() : '';
        const categoryValue = category.value;
        const durationValue = duration.value.trim();
        const tagsValue = tagsInput ? tagsInput.value.trim() : '';
        const tags = tagsValue ? tagsValue.split(',').map(t => t.trim()) : [];
        
        // Validate required fields
        if (!videoFile || !videoFile.files || !videoFile.files[0]) {
            alert('Please select a video file!');
            return false;
        }
        
        if (!titleValue || !durationValue) {
            alert('Please fill in all required fields!');
            return false;
        }
        
        const videoFileData = videoFile.files[0];
        const originalFileName = videoFileData.name;
        // Sanitize filename - keep spaces and common chars, just remove dangerous path characters
        const fileName = originalFileName.replace(/[\\/:*?\"<>|]/g, '_');
        const filePath = `videos/${fileName}`; // Path in external repo
        const fileSizeMB = Math.round(videoFileData.size / 1024 / 1024 * 100) / 100;
        
        console.log('Uploading video file:', fileName, videoFileData.size, 'bytes');
        
        updateStatus(`⏳ Preparing to upload ${fileSizeMB} MB...`);
        
        // Upload file to external GitHub repository - returns the GitHub raw URL
        const videoUrl = await uploadFileToGitHub(videoFileData, filePath, `Add video: ${fileName}`);
        
        if (!videoUrl) {
            updateStatus('Upload failed');
            alert('Upload failed. Please check the console for errors.');
            return false;
        }
        
        console.log('Video URL:', videoUrl);
        
        // Handle thumbnail
        let thumbnail = '';
        if (thumbnailSourceTypeValue === 'file' && thumbnailFile && thumbnailFile.files.length > 0) {
            updateStatus('Uploading thumbnail...');
            const thumbnailFileData = thumbnailFile.files[0];
            const originalThumbnailName = thumbnailFileData.name;
            const thumbnailFileName = originalThumbnailName.replace(/[\\/:*?\"<>|]/g, '_');
            const thumbnailPath = `thumbnails/${thumbnailFileName}`; // Separate folder for thumbnails
            
            console.log('Uploading thumbnail:', thumbnailFileName);
            
            try {
                // Upload thumbnail to external repository (thumbnails folder)
                const { owner: VIDEO_REPO_OWNER, name: VIDEO_REPO_NAME, branch: VIDEO_REPO_BRANCH } = getVideoRepoConfig();
                const thumbnailUploadResult = await uploadFileToGitHub(thumbnailFileData, thumbnailPath, `Add thumbnail: ${thumbnailFileName}`);
                
                // Use the actual filename returned from server (may be renamed if duplicate)
                if (typeof thumbnailUploadResult === 'string') {
                    thumbnail = thumbnailUploadResult;
                } else if (thumbnailUploadResult && thumbnailUploadResult.fileName) {
                    // If server returns object with fileName, construct proper URL
                    const finalThumbnailName = thumbnailUploadResult.fileName;
                    thumbnail = `https://raw.githubusercontent.com/${VIDEO_REPO_OWNER}/${VIDEO_REPO_NAME}/${VIDEO_REPO_BRANCH}/thumbnails/${finalThumbnailName}`;
                    if (thumbnailUploadResult.renamed) {
                        console.log('📝 Thumbnail was renamed from:', thumbnailUploadResult.originalFileName);
                    }
                } else {
                    thumbnail = thumbnailUploadResult;
                }
                console.log('Thumbnail uploaded to:', thumbnail);
            } catch (thumbnailError) {
                console.error('Thumbnail upload failed:', thumbnailError);
                // Fallback to base64 if thumbnail upload fails
                thumbnail = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(e);
                    reader.readAsDataURL(thumbnailFileData);
                });
                console.log('Thumbnail converted to base64 as fallback');
            }
        } else if (thumbnailSourceTypeValue === 'url' && thumbnailUrlInputValue) {
            thumbnail = thumbnailUrlInputValue;
        } else {
            thumbnail = 'assets/images/thumbnail/default.png';
        }
        
        updateStatus('Saving to database...');
        console.log('🟢 About to save to database...');
        
        // Create video object
        const videoData = {
            title: titleValue,
            description: descriptionValue,
            videoUrl,
            thumbnail,
            category: categoryValue,
            duration: durationValue,
            tags,
            uploaderId: currentUsername,
            uploaderName: currentUsername,
            visibility: 'public'
        };
        
        console.log('🟢 Video data:', JSON.stringify(videoData, null, 2));
        
        // Upload to database
        let result;
        try {
            result = await WigTubeDB.createVideo(videoData);
            console.log('🟢 Database save successful!');
            console.log('🟢 Result:', result);
        } catch (dbError) {
            console.error('🔴 Database save error:', dbError);
            throw new Error(`Failed to save to database: ${dbError.message}`);
        }
        
        console.log('Video uploaded successfully to database');
        
        // Show success message with options
        console.log('🟢 Showing success confirmation dialog...');
        const viewChannel = confirm(`✅ Video "${titleValue}" uploaded successfully!\n\nYou can view it on your channel or in the ${categoryValue} category.\n\nWould you like to go to your channel now?\n\nClick OK to view channel, or Cancel to stay on upload page.`);
        
        // Only redirect if user chooses to
        if (viewChannel) {
            console.log('🔵 User chose to view channel');
            window.wigtubeUploadInProgress = false;
            await showMyChannel();
            console.log('🟢 ==================== UPLOAD END (channel) ====================');
            return 'channel';
        } else {
            console.log('🔵 User chose to stay on upload page');
            window.wigtubeUploadInProgress = false;
            updateStatus('Video uploaded successfully! Ready for next upload.');
            console.log('🟢 ==================== UPLOAD END (stay) ====================');
            return 'stay';
        }
        
    } catch (error) {
        console.error('🔴 ==================== UPLOAD ERROR ====================');
        console.error('🔴 Error uploading video:', error);
        console.error('🔴 Error stack:', error.stack);
        window.wigtubeUploadInProgress = false;
        alert('Failed to upload video: ' + error.message);
        updateStatus('Upload failed');
        console.error('🔴 ==================== UPLOAD END (error) ====================');
        return false; // Prevent any form submission
    } finally {
        // Ensure we never navigate away accidentally
        window.wigtubeUploadInProgress = false;
        console.log('🟢 ==================== UPLOAD FINALLY ====================');
    }
}

// ============================================
// My Channel Functions (YouTube 2009 Style)
// ============================================

/**
 * Show any user's channel page in YouTube 2009 style
 */
async function showChannel(channelName) {
    if (!channelName) {
        updateStatus('Invalid channel name');
        return;
    }

    const videoGrid = document.querySelector('.video-grid');
    const contentHeader = document.querySelector('.content-header');
    const categoryButtons = document.querySelector('.video-categories');
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const featuredBox = document.querySelector('.featured-box');
    const mainContainer = document.querySelector('.main-container');
    
    if (!videoGrid || !contentHeader) return;
    
    // Hide sidebar, category buttons, featured box, and header
    if (sidebar) sidebar.style.display = 'none';
    if (categoryButtons) categoryButtons.style.display = 'none';
    if (featuredBox) featuredBox.style.display = 'none';
    if (contentHeader) contentHeader.style.display = 'none';
    
    // Expand content to full width
    if (content) {
        content.style.flex = 'none';
        content.style.width = '100%';
        content.style.maxWidth = 'none';
        content.style.padding = '0';
        content.style.margin = '0';
    }
    if (mainContainer) {
        mainContainer.style.display = 'block';
        mainContainer.style.width = '100%';
    }
    
    // Override video-grid styling for full width
    videoGrid.style.display = 'block';
    videoGrid.style.width = '100%';
    videoGrid.style.maxWidth = 'none';
    videoGrid.style.margin = '0';
    videoGrid.style.padding = '0';
    videoGrid.style.gridTemplateColumns = 'none';
    
    updateStatus(`Loading ${channelName}'s channel...`);
    showLoadingProgress();
    
    try {
        // Get all videos and filter by specified user
        const allVideos = typeof WigTubeDB !== 'undefined' ? await WigTubeDB.getAllVideos() : [];
        const channelVideos = allVideos.filter(video => video.uploaderId === channelName || video.uploaderName === channelName);
        
        // Calculate channel stats
        const totalVideos = channelVideos.length;
        const totalViews = channelVideos.reduce((sum, video) => sum + (video.viewCount || 0), 0);
        const totalSubscribers = 0;
        
        // Get user customizations from localStorage
        const channelBanner = localStorage.getItem(`channel_banner_${channelName}`) || '';
        const channelDescription = localStorage.getItem(`channel_description_${channelName}`) || '';
        
        // Load profile picture
        let profilePic = null;
        if (typeof getUserProfilePicture !== 'undefined') {
            profilePic = getUserProfilePicture(channelName);
        }
        if (!profilePic && typeof loadUserProfilePicture !== 'undefined') {
            profilePic = await loadUserProfilePicture(channelName);
        }
        
        // Update header
        contentHeader.innerHTML = `📺 ${channelName}'s Channel`;
        
        // Create Windows XP styled channel page
        videoGrid.innerHTML = `
            <!-- Channel Container -->
            <div style="width: 100%; background: #f0f0f0; margin: 0; padding: 0;">
                <!-- Channel Banner -->
                <div id="channelBanner" style="
                    width: 100%;
                    height: 200px;
                    background: ${channelBanner ? `url('${channelBanner}')` : 'linear-gradient(to bottom, #316ac5 0%, #1e4088 100%)'};
                    background-size: cover;
                    background-position: center;
                    position: relative;
                    border-bottom: 2px solid #000080;
                ">
                </div>
                
                <!-- Channel Header -->
                <div style="background: #e0e0e0; border-bottom: 1px solid #808080;">
                    <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                        <div style="display: flex; gap: 20px; align-items: flex-start;">
                            <!-- Avatar -->
                            <div style="
                                width: 80px;
                                height: 80px;
                                background: ${profilePic ? `url('${profilePic}')` : 'linear-gradient(to bottom, #316ac5 0%, #1e4088 100%)'};
                                background-size: cover;
                                background-position: center;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 36px;
                                color: white;
                                font-weight: bold;
                                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                                flex-shrink: 0;
                                border: 2px outset #d4d0c8;
                            ">${!profilePic ? channelName.charAt(0).toUpperCase() : ''}</div>
                            
                            <!-- Channel Info -->
                            <div style="flex: 1;">
                                <h1 style="
                                    font-size: 20px;
                                    color: #000080;
                                    margin: 0 0 8px 0;
                                    font-weight: bold;
                                    font-family: 'MS Sans Serif', sans-serif;
                                ">${channelName}</h1>
                                
                                <div style="
                                    color: #000;
                                    font-size: 11px;
                                    margin-bottom: 12px;
                                    font-family: 'MS Sans Serif', sans-serif;
                                ">
                                    @${channelName.toLowerCase()} • 
                                    ${totalSubscribers} subscribers • 
                                    ${totalVideos} video${totalVideos !== 1 ? 's' : ''}
                                </div>
                                
                                ${channelDescription ? `
                                <div style="
                                    color: #000;
                                    font-size: 12px;
                                    margin-bottom: 12px;
                                    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
                                    line-height: 1.6;
                                    font-size: 11px;
                                    margin-bottom: 12px;
                                    font-family: 'MS Sans Serif', sans-serif;
                                    line-height: 1.4;
                                ">${channelDescription}</div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Navigation Tabs -->
                    <div style="max-width: 1200px; margin: 0 auto;">
                        <div style="
                            display: flex;
                            gap: 2px;
                            padding: 0 20px;
                            background: #d4d0c8;
                            border-top: 1px solid #808080;
                        ">
                            <a href="javascript:void(0)" onclick="showChannel('${channelName}'); return false;" style="
                                color: #000;
                                text-decoration: none;
                                padding: 6px 16px;
                                font-size: 11px;
                                font-weight: bold;
                                font-family: 'MS Sans Serif', sans-serif;
                                background: #f0f0f0;
                                border: 2px outset #d4d0c8;
                                border-bottom: none;
                            ">HOME</a>
                            <a href="javascript:void(0)" style="
                                color: #000;
                                text-decoration: none;
                                padding: 6px 16px;
                                font-size: 11px;
                                font-weight: bold;
                                font-family: 'MS Sans Serif', sans-serif;
                                background: #c0c0c0;
                            ">VIDEOS</a>
                            <a href="javascript:void(0)" style="
                                color: #000;
                                text-decoration: none;
                                padding: 6px 16px;
                                font-size: 11px;
                                font-weight: bold;
                                font-family: 'MS Sans Serif', sans-serif;
                                background: #c0c0c0;
                            ">PLAYLISTS</a>
                            <a href="javascript:void(0)" style="
                                color: #000;
                                text-decoration: none;
                                padding: 6px 16px;
                                font-size: 11px;
                                font-weight: bold;
                                font-family: 'MS Sans Serif', sans-serif;
                                background: #c0c0c0;
                            ">ABOUT</a>
                            <div style="flex: 1;"></div>
                            <button type="button" onclick="showHomePage()" style="
                                padding: 4px 10px;
                                background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                                color: #000;
                                border: 2px outset #d4d0c8;
                                cursor: pointer;
                                font-size: 11px;
                                font-family: 'MS Sans Serif', sans-serif;
                                align-self: center;
                                margin: 4px 0;
                            ">← Back to Home</button>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    <!-- Uploads Section -->
                    ${channelVideos.length > 0 ? `
                    <div style="margin-bottom: 24px;">
                        <div style="
                            background: linear-gradient(to bottom, #316ac5 0%, #1e4088 100%);
                            padding: 6px 12px;
                            margin-bottom: 12px;
                            border: 2px outset #d4d0c8;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <h2 style="
                                font-size: 11px;
                                font-weight: bold;
                                color: #fff;
                                margin: 0;
                                font-family: 'MS Sans Serif', sans-serif;
                                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
                            ">Uploads</h2>
                            <span style="
                                font-size: 11px;
                                color: #e0e0e0;
                                font-family: 'MS Sans Serif', sans-serif;
                            ">${totalVideos} video${totalVideos !== 1 ? 's' : ''}</span>
                        </div>
                        
                        <div id="channelVideosGrid" style="
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                            gap: 12px;
                        ">
                        </div>
                    </div>
                    ` : `
                    <div style="
                        background: #f0f0f0;
                        padding: 40px;
                        text-align: center;
                        margin-bottom: 20px;
                        border: 2px inset #d4d0c8;
                    ">
                        <div style="font-size: 72px; margin-bottom: 16px; opacity: 0.5;">📹</div>
                        <div style="font-size: 11px; color: #000080; font-weight: bold; margin-bottom: 8px; font-family: 'MS Sans Serif', sans-serif;">No videos uploaded yet</div>
                        <div style="font-size: 11px; color: #000; font-family: 'MS Sans Serif', sans-serif;">This channel hasn't uploaded any videos</div>
                    </div>
                    `}
                </div>
            </div>
        `;
        
        // Add video cards if there are any
        if (channelVideos.length > 0) {
            const channelVideosGrid = document.getElementById('channelVideosGrid');
            
            for (const video of channelVideos) {
                const videoCard = createChannelVideoCard(video, false);
                channelVideosGrid.appendChild(videoCard);
            }
        }
        
        updateStatus(`Showing ${channelName}'s channel with ${totalVideos} video(s)`);
        
    } catch (error) {
        console.error('Error loading channel:', error);
        updateStatus('Error loading channel');
        
        videoGrid.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                <div style="font-size: 14px; color: #666;">Failed to load channel</div>
                <button onclick="showHomePage()" style="
                    margin-top: 20px;
                    padding: 8px 16px;
                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                    font-size: 11px;
                    font-family: 'MS Sans Serif', sans-serif;
                ">Back to Home</button>
            </div>
        `;
    }
}

/**
 * Show user's channel page in YouTube 2009 style
 */
async function showMyChannel() {
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername || currentUsername.toLowerCase() === 'guest') {
        updateStatus('Please log in to view your channel');
        alert('You must be logged in to view your channel!');
        return;
    }

    const videoGrid = document.querySelector('.video-grid');
    const contentHeader = document.querySelector('.content-header');
    const categoryButtons = document.querySelector('.video-categories');
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const featuredBox = document.querySelector('.featured-box');
    const mainContainer = document.querySelector('.main-container');
    
    if (!videoGrid || !contentHeader) return;
    
    // Hide sidebar, category buttons, featured box, and header
    if (sidebar) sidebar.style.display = 'none';
    if (categoryButtons) categoryButtons.style.display = 'none';
    if (featuredBox) featuredBox.style.display = 'none';
    if (contentHeader) contentHeader.style.display = 'none';
    
    // Expand content to full width
    if (content) {
        content.style.flex = 'none';
        content.style.width = '100%';
        content.style.maxWidth = 'none';
        content.style.padding = '0';
        content.style.margin = '0';
    }
    if (mainContainer) {
        mainContainer.style.display = 'block';
        mainContainer.style.width = '100%';
    }
    
    // Override video-grid styling for full width
    videoGrid.style.display = 'block';
    videoGrid.style.width = '100%';
    videoGrid.style.maxWidth = 'none';
    videoGrid.style.margin = '0';
    videoGrid.style.padding = '0';
    videoGrid.style.gridTemplateColumns = 'none';
    
    updateStatus('Loading your channel...');
    showLoadingProgress();
    
    try {
        // Get all videos and filter by current user
        const allVideos = typeof WigTubeDB !== 'undefined' ? await WigTubeDB.getAllVideos() : [];
        const myVideos = allVideos.filter(video => video.uploaderId === currentUsername || video.uploaderName === currentUsername);
        
        // Calculate channel stats
        const totalVideos = myVideos.length;
        const totalViews = myVideos.reduce((sum, video) => sum + (video.viewCount || 0), 0);
        const totalSubscribers = 0; // You could store subscribers in user profile
        
        // Get user customizations from localStorage
        const channelBanner = localStorage.getItem(`channel_banner_${currentUsername}`) || '';
        const channelDescription = localStorage.getItem(`channel_description_${currentUsername}`) || '';
        
        // Load profile picture - try to get it from cache or load from Firebase
        let profilePic = null;
        if (typeof getUserProfilePicture !== 'undefined') {
            profilePic = getUserProfilePicture(currentUsername);
        }
        if (!profilePic && typeof loadUserProfilePicture !== 'undefined') {
            profilePic = await loadUserProfilePicture(currentUsername);
        }
        
        // Update header
        contentHeader.innerHTML = `📺 ${currentUsername}'s Channel`;
        
        // Create YouTube-style channel page with customizable banner
        videoGrid.innerHTML = `
            <!-- Channel Container -->
            <div style="width: 100%; background: #f0f0f0; margin: 0; padding: 0;">
                <!-- Channel Banner (Customizable) -->
                <div id="channelBanner" style="
                    width: 100%;
                    height: 200px;
                    background: ${channelBanner ? `url('${channelBanner}')` : 'linear-gradient(to bottom, #4e8bc7 0%, #2a5a8a 100%)'};
                    background-size: cover;
                    background-position: center;
                    position: relative;
                    border-bottom: 1px solid #003366;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 5px rgba(0,0,0,0.3);
                ">
                    <!-- Edit Banner Button -->
                    <button type="button" onclick="showBannerCustomization()" style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        padding: 4px 10px;
                        background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                        color: #000;
                        border: 2px outset #d4d0c8;
                        cursor: pointer;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">✏️ Customize Banner</button>
                </div>
                
                <!-- Channel Header -->
                <div style="background: linear-gradient(to bottom, #ffffff 0%, #e8e8e8 100%); border-bottom: 1px solid #ccc; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                        <div style="display: flex; gap: 20px; align-items: flex-start;">
                            <!-- Avatar -->
                            <div style="
                                width: 80px;
                                height: 80px;
                                background: ${profilePic ? `url('${profilePic}')` : 'linear-gradient(to bottom, #316ac5 0%, #1e4088 100%)'};
                                background-size: cover;
                                background-position: center;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 36px;
                                color: white;
                                font-weight: bold;
                                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                                flex-shrink: 0;
                                border: 2px outset #d4d0c8;
                            ">${!profilePic ? currentUsername.charAt(0).toUpperCase() : ''}</div>
                            
                            <!-- Channel Info -->
                            <div style="flex: 1;">
                                <h1 style="
                                    font-size: 20px;
                                    color: #000080;
                                    margin: 0 0 8px 0;
                                    font-weight: bold;
                                    font-family: 'MS Sans Serif', sans-serif;
                                ">${currentUsername}</h1>
                                
                                <div style="
                                    color: #000;
                                    font-size: 11px;
                                    margin-bottom: 12px;
                                    font-family: 'MS Sans Serif', sans-serif;
                                ">
                                    @${currentUsername.toLowerCase()} • 
                                    ${totalSubscribers} subscribers • 
                                    ${totalVideos} video${totalVideos !== 1 ? 's' : ''}
                                </div>
                                
                                ${channelDescription ? `
                                <div style="
                                    color: #000;
                                    font-size: 11px;
                                    margin-bottom: 12px;
                                    font-family: 'MS Sans Serif', sans-serif;
                                    line-height: 1.4;
                                ">${channelDescription}</div>
                                ` : ''}
                                
                                <button type="button" onclick="showChannelSettings()" style="
                                    padding: 4px 12px;
                                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                                    color: #000;
                                    border: 2px outset #d4d0c8;
                                    cursor: pointer;
                                    font-size: 11px;
                                    font-family: 'MS Sans Serif', sans-serif;
                                ">Customize channel</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Navigation Tabs -->
                    <div style="max-width: 1200px; margin: 0 auto;">
                        <div style="
                            display: flex;
                            gap: 2px;
                            padding: 0 20px;
                            background: linear-gradient(to bottom, #e8e8e8 0%, #d0d0d0 100%);
                            border-top: 1px solid #bbb;
                        ">
                            <a href="javascript:void(0)" onclick="showMyChannelTab('home'); return false;" id="channelTabHome" style="
                                color: #000;
                                text-decoration: none;
                                padding: 6px 16px;
                                font-size: 11px;
                                font-weight: bold;
                                font-family: 'MS Sans Serif', sans-serif;
                                background: #f0f0f0;
                                border: 2px outset #d4d0c8;
                                border-bottom: none;
                            ">HOME</a>
                            <a href="javascript:void(0)" onclick="showMyChannelTab('videos'); return false;" id="channelTabVideos" style="
                                color: #000;
                                text-decoration: none;
                                padding: 6px 16px;
                                font-size: 11px;
                                font-weight: bold;
                                font-family: 'MS Sans Serif', sans-serif;
                                background: #c0c0c0;
                            ">VIDEOS</a>
                            <a href="javascript:void(0)" onclick="showMyChannelTab('playlists'); return false;" id="channelTabPlaylists" style="
                                color: #000;
                                text-decoration: none;
                                padding: 6px 16px;
                                font-size: 11px;
                                font-weight: bold;
                                font-family: 'MS Sans Serif', sans-serif;
                                background: #c0c0c0;
                            ">PLAYLISTS</a>
                            <a href="javascript:void(0)" onclick="showMyChannelTab('about'); return false;" id="channelTabAbout" style="
                                color: #000;
                                text-decoration: none;
                                padding: 6px 16px;
                                font-size: 11px;
                                font-weight: bold;
                                font-family: 'MS Sans Serif', sans-serif;
                                background: #c0c0c0;
                            ">ABOUT</a>
                            <div style="flex: 1;"></div>
                            <button type="button" onclick="showHomePage()" style="
                                padding: 6px 12px;
                                background: linear-gradient(to bottom, #f8f8f8 0%, #d8d8d8 100%);
                                color: #000;
                                border: 1px solid #999;
                                border-radius: 3px;
                                cursor: pointer;
                                font-size: 11px;
                                font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
                                align-self: center;
                                margin: 4px 0;
                                box-shadow: 0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8);
                            ">← Back to Home</button>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                    
                    <!-- Upload Section -->
                    <div style="
                        background: linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%);
                        padding: 30px;
                        text-align: center;
                        margin-bottom: 20px;
                        border-radius: 4px;
                        border: 1px solid #ccc;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8);
                    ">
                        <div style="
                            display: inline-flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 12px;
                            max-width: 500px;
                        ">
                            <!-- Upload Icon -->
                            <svg width="100" height="100" viewBox="0 0 120 120" style="opacity: 0.5;">
                                <circle cx="60" cy="60" r="58" fill="none" stroke="#999" stroke-width="2"/>
                                <path d="M60 30 L60 70 M40 50 L60 30 L80 50" stroke="#666" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="40" y="75" width="40" height="15" rx="2" fill="#666"/>
                            </svg>
                            
                            <div>
                                <h2 style="
                                    margin: 0 0 6px 0;
                                    font-size: 16px;
                                    color: #003366;
                                    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
                                    font-weight: 600;
                                ">Upload a video to get started</h2>
                                
                                <p style="
                                    margin: 0 0 16px 0;
                                    font-size: 12px;
                                    color: #555;
                                    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
                                    line-height: 1.6;
                                ">
                                    Share your videos with your subscribers and the world
                                </p>
                                
                                <button type="button" onclick="showUploadVideoDialog()" style="
                                    padding: 8px 16px;
                                    background: linear-gradient(to bottom, #ffd700 0%, #f5a623 100%);
                                    color: #000;
                                    border: 1px solid #d39e00;
                                    border-radius: 3px;
                                    cursor: pointer;
                                    font-size: 12px;
                                    font-weight: bold;
                                    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
                                    text-transform: uppercase;
                                    box-shadow: 0 2px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5);
                                ">Upload video</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Uploads Section -->
                    ${myVideos.length > 0 ? `
                    <div style="margin-bottom: 24px;">
                        <div style="
                            background: linear-gradient(to bottom, #4e8bc7 0%, #2a5a8a 100%);
                            padding: 8px 12px;
                            margin-bottom: 12px;
                            border-radius: 3px;
                            border: 1px solid #003366;
                            box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <h2 style="
                                font-size: 14px;
                                font-weight: 600;
                                color: #fff;
                                margin: 0;
                                font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
                                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                            ">Uploads</h2>
                            <span style="
                                font-size: 11px;
                                color: #e0e0e0;
                                font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
                            ">${totalVideos} video${totalVideos !== 1 ? 's' : ''}</span>
                        </div>
                        
                        <div id="channelVideosGrid" style="
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                            gap: 12px;
                        ">
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add video cards if there are any
        if (myVideos.length > 0) {
            const channelVideosGrid = document.getElementById('channelVideosGrid');
            
            for (const video of myVideos) {
                const videoCard = createChannelVideoCard(video, true);
                channelVideosGrid.appendChild(videoCard);
            }
        }
        
        updateStatus(`Showing ${currentUsername}'s channel with ${totalVideos} video(s)`);
        
        // Show the HOME tab by default
        await showMyChannelTab('home');
        
    } catch (error) {
        console.error('Error loading channel:', error);
        updateStatus('Error loading channel');
        
        videoGrid.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                <div style="font-size: 14px; color: #666;">Failed to load channel</div>
                <button type="button" onclick="showHomePage()" style="
                    margin-top: 20px;
                    padding: 8px 16px;
                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                    font-size: 11px;
                    font-family: 'MS Sans Serif', sans-serif;
                ">Back to Home</button>
            </div>
        `;
    }
}

/**
 * Show custom popup dialog
 */
function showPopup(message, title = 'WigTube', type = 'info') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const popup = document.createElement('div');
        popup.style.cssText = `
            background: #ece9d8;
            border: 2px outset #fff;
            box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.5);
            min-width: 300px;
            max-width: 500px;
            font-family: 'MS Sans Serif', Arial, sans-serif;
        `;
        
        const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        
        popup.innerHTML = `
            <div style="
                background: linear-gradient(to right, #0054e3, #4c9bff);
                color: white;
                padding: 4px 8px;
                font-weight: bold;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 6px;
            ">
                <span style="font-size: 14px;">${icon}</span>
                <span>${title}</span>
            </div>
            <div style="padding: 20px; font-size: 11px; line-height: 1.6;">
                ${message}
            </div>
            <div style="padding: 0 20px 20px; text-align: center;">
                <button id="popupOkBtn" style="
                    padding: 6px 24px;
                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: bold;
                    font-family: 'MS Sans Serif', sans-serif;
                    min-width: 75px;
                ">OK</button>
            </div>
        `;
        
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        
        const okBtn = document.getElementById('popupOkBtn');
        okBtn.focus();
        
        const close = () => {
            document.body.removeChild(overlay);
            resolve();
        };
        
        okBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    });
}

/**
 * Show custom confirm dialog
 */
function showConfirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const popup = document.createElement('div');
        popup.style.cssText = `
            background: #ece9d8;
            border: 2px outset #fff;
            box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.5);
            min-width: 300px;
            max-width: 500px;
            font-family: 'MS Sans Serif', Arial, sans-serif;
        `;
        
        popup.innerHTML = `
            <div style="
                background: linear-gradient(to right, #0054e3, #4c9bff);
                color: white;
                padding: 4px 8px;
                font-weight: bold;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 6px;
            ">
                <span style="font-size: 14px;">⚠️</span>
                <span>${title}</span>
            </div>
            <div style="padding: 20px; font-size: 11px; line-height: 1.6;">
                ${message}
            </div>
            <div style="padding: 0 20px 20px; text-align: center; display: flex; gap: 10px; justify-content: center;">
                <button id="confirmYesBtn" style="
                    padding: 6px 24px;
                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: bold;
                    font-family: 'MS Sans Serif', sans-serif;
                    min-width: 75px;
                ">Yes</button>
                <button id="confirmNoBtn" style="
                    padding: 6px 24px;
                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: bold;
                    font-family: 'MS Sans Serif', sans-serif;
                    min-width: 75px;
                ">No</button>
            </div>
        `;
        
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        
        const yesBtn = document.getElementById('confirmYesBtn');
        const noBtn = document.getElementById('confirmNoBtn');
        noBtn.focus();
        
        const close = (result) => {
            document.body.removeChild(overlay);
            resolve(result);
        };
        
        yesBtn.addEventListener('click', () => close(true));
        noBtn.addEventListener('click', () => close(false));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });
    });
}

/**
 * Delete a video from the channel
 */
async function deleteVideo(videoId, videoTitle) {
    const currentUsername = localStorage.getItem('username');
    
    // Confirm deletion
    const confirmed = await showConfirm(
        `Are you sure you want to delete "<strong>${videoTitle}</strong>"?<br><br>This action cannot be undone.`,
        'Delete Video'
    );
    
    if (!confirmed) {
        return;
    }
    
    updateStatus('Deleting video...');
    
    try {
        // Check if WigTubeDB is available
        if (typeof WigTubeDB === 'undefined' || typeof WigTubeDB.deleteVideo !== 'function') {
            await showPopup('Delete feature is currently unavailable. Please try again later.', 'Error', 'error');
            return;
        }
        
        console.log('Attempting to delete video:', videoId);
        
        // Get video data to extract file URL before deletion
        let videoData = null;
        try {
            videoData = await WigTubeDB.getVideoById(videoId);
            console.log('Retrieved video data:', videoData);
        } catch (error) {
            console.warn('Could not retrieve video data before deletion:', error);
        }
        
        // Delete from database
        const success = await WigTubeDB.deleteVideo(videoId);
        
        console.log('Delete result:', success);
        
        if (success) {
            console.log('Video deleted successfully from database:', videoId);
            
            // Also delete the video file from external repository
            if (videoData && videoData.videoUrl) {
                console.log('Attempting to delete video file from repository...');
                const deleteResult = await deleteVideoFileFromRepo(videoData.videoUrl);
                
                if (deleteResult.success) {
                    console.log('✅ Video file deleted from repository:', deleteResult.fileName);
                } else {
                    console.warn('⚠️ Could not delete video file from repository:', deleteResult.error);
                    console.warn('The video metadata was deleted, but the file remains in the repository.');
                }
            } else {
                console.warn('No video URL found, skipping file deletion from repository');
            }
            
            // Wait a moment to ensure Firebase write completes
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Remove the video card from UI with animation
            const videoCard = document.querySelector(`.video-card[data-video-id="${videoId}"]`);
            if (videoCard) {
                videoCard.style.transition = 'opacity 0.3s, transform 0.3s';
                videoCard.style.opacity = '0';
                videoCard.style.transform = 'scale(0.8)';
                setTimeout(() => videoCard.remove(), 300);
            }
            
            await showPopup(
                `Video "<strong>${videoTitle}</strong>" has been deleted successfully!`,
                'Success',
                'success'
            );
            
            // Reload channel to show updated list with verified fresh data
            console.log('Reloading channel page...');
            await showMyChannel();
        } else {
            await showPopup('Failed to delete video. The video may not exist or you may not have permission.', 'Error', 'error');
            updateStatus('Delete failed');
        }
        
    } catch (error) {
        console.error('Error deleting video:', error);
        await showPopup(
            `An error occurred while deleting the video:<br><br><em>${error.message}</em>`,
            'Error',
            'error'
        );
        updateStatus('Error deleting video');
    }
}

/**
 * Show banner customization dialog
 */
function showBannerCustomization() {
    const currentUsername = localStorage.getItem('username');
    const currentBanner = localStorage.getItem(`channel_banner_${currentUsername}`) || '';
    
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
        padding: 24px;
        max-width: 600px;
        width: 90%;
        font-family: 'MS Sans Serif', sans-serif;
    `;
    
    dialog.innerHTML = `
        <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #000080; font-family: 'MS Sans Serif', sans-serif; font-weight: bold;">Customize Channel Banner</h2>
        
        <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 11px; color: #000; font-weight: bold; font-family: 'MS Sans Serif', sans-serif;">
                Banner Image URL
            </label>
            <input type="text" id="bannerUrlInput" value="${currentBanner}" placeholder="Enter image URL (https://...)" style="
                width: 100%;
                padding: 10px;
                border: 2px inset #d4d0c8;
                font-size: 11px;
                font-family: 'MS Sans Serif', sans-serif;
            ">
            <div style="margin-top: 8px; font-size: 11px; color: #000; font-family: 'MS Sans Serif', sans-serif;">
                Recommended size: 2560 x 1440px. Accepted formats: JPG, PNG, GIF
            </div>
        </div>
        
        <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 11px; color: #000; font-weight: bold; font-family: 'MS Sans Serif', sans-serif;">
                Or use a preset gradient
            </label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                <div class="gradient-preset" data-gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" style="
                    height: 60px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                "></div>
                <div class="gradient-preset" data-gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" style="
                    height: 60px;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                "></div>
                <div class="gradient-preset" data-gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" style="
                    height: 60px;
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                "></div>
                <div class="gradient-preset" data-gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" style="
                    height: 60px;
                    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                "></div>
                <div class="gradient-preset" data-gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)" style="
                    height: 60px;
                    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                "></div>
                <div class="gradient-preset" data-gradient="linear-gradient(135deg, #30cfd0 0%, #330867 100%)" style="
                    height: 60px;
                    background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                "></div>
                <div class="gradient-preset" data-gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" style="
                    height: 60px;
                    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                "></div>
                <div class="gradient-preset" data-gradient="linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)" style="
                    height: 60px;
                    background: linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                "></div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <div style="font-size: 11px; color: #000; font-weight: bold; margin-bottom: 8px; font-family: 'MS Sans Serif', sans-serif;">Preview</div>
            <div id="bannerPreview" style="
                width: 100%;
                height: 120px;
                background: ${currentBanner ? `url('${currentBanner}')` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
                background-size: cover;
                background-position: center;
                border: 2px inset #d4d0c8;
            "></div>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" id="cancelBannerBtn" style="
                padding: 10px 16px;
                background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                color: #000;
                border: 2px outset #d4d0c8;
                cursor: pointer;
                font-size: 11px;
                font-family: 'MS Sans Serif', sans-serif;
            ">Cancel</button>
            <button type="button" id="saveBannerBtn" style="
                padding: 10px 16px;
                background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                color: #000;
                border: 2px outset #d4d0c8;
                cursor: pointer;
                font-size: 11px;
                font-family: 'MS Sans Serif', sans-serif;
                font-weight: bold;
            ">Save Banner</button>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    const bannerUrlInput = dialog.querySelector('#bannerUrlInput');
    const bannerPreview = dialog.querySelector('#bannerPreview');
    const gradientPresets = dialog.querySelectorAll('.gradient-preset');
    
    // Update preview on input change
    bannerUrlInput.addEventListener('input', () => {
        const url = bannerUrlInput.value.trim();
        if (url) {
            bannerPreview.style.background = `url('${url}')`;
            bannerPreview.style.backgroundSize = 'cover';
            bannerPreview.style.backgroundPosition = 'center';
        } else {
            bannerPreview.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    });
    
    // Handle gradient preset clicks
    gradientPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const gradient = preset.getAttribute('data-gradient');
            bannerPreview.style.background = gradient;
            bannerUrlInput.value = gradient;
        });
    });
    
    // Handle save
    dialog.querySelector('#saveBannerBtn').addEventListener('click', () => {
        const bannerValue = bannerUrlInput.value.trim();
        localStorage.setItem(`channel_banner_${currentUsername}`, bannerValue);
        updateStatus('Banner updated successfully');
        overlay.remove();
        showMyChannel(); // Reload to show new banner
    });
    
    // Handle cancel
    dialog.querySelector('#cancelBannerBtn').addEventListener('click', () => {
        overlay.remove();
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

/**
 * Show channel settings dialog
 */
function showChannelSettings() {
    const currentUsername = localStorage.getItem('username');
    const currentDescription = localStorage.getItem(`channel_description_${currentUsername}`) || '';
    
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
        padding: 24px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        font-family: 'MS Sans Serif', sans-serif;
    `;
    
    dialog.innerHTML = `
        <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #000080; font-family: 'MS Sans Serif', sans-serif; font-weight: bold;">Channel Settings</h2>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-size: 11px; color: #000; font-weight: bold; font-family: 'MS Sans Serif', sans-serif;">
                Channel Description
            </label>
            <textarea id="descriptionInput" placeholder="Tell viewers about your channel..." style="
                width: 100%;
                min-height: 100px;
                padding: 10px;
                border: 2px inset #d4d0c8;
                font-size: 11px;
                font-family: 'MS Sans Serif', sans-serif;
                resize: vertical;
            ">${currentDescription}</textarea>
            <div style="margin-top: 8px; font-size: 11px; color: #000; font-family: 'MS Sans Serif', sans-serif;">
                Max 1000 characters
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <button type="button" onclick="showBannerCustomization(); document.querySelector('.channel-settings-overlay').remove();" style="
                padding: 10px 16px;
                background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                color: #000;
                border: 2px outset #d4d0c8;
                cursor: pointer;
                font-size: 11px;
                font-family: 'MS Sans Serif', sans-serif;
                width: 100%;
            ">🎨 Customize Banner</button>
        </div>
        
        <div style="border-top: 2px groove #d4d0c8; padding-top: 16px; margin-top: 20px;">
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button type="button" id="cancelSettingsBtn" style="
                    padding: 10px 16px;
                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                    color: #000;
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                    font-size: 11px;
                    font-family: 'MS Sans Serif', sans-serif;
                ">Cancel</button>
                <button type="button" id="saveSettingsBtn" style="
                    padding: 10px 16px;
                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                    color: #000;
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                    font-size: 11px;
                    font-family: 'MS Sans Serif', sans-serif;
                    font-weight: bold;
                ">Save Changes</button>
            </div>
        </div>
    `;
    
    overlay.appendChild(dialog);
    overlay.classList.add('channel-settings-overlay');
    document.body.appendChild(overlay);
    
    const descriptionInput = dialog.querySelector('#descriptionInput');
    
    // Handle save
    dialog.querySelector('#saveSettingsBtn').addEventListener('click', () => {
        const description = descriptionInput.value.trim().substring(0, 1000);
        localStorage.setItem(`channel_description_${currentUsername}`, description);
        updateStatus('Channel settings saved');
        overlay.remove();
        showMyChannel(); // Reload to show changes
    });
    
    // Handle cancel
    dialog.querySelector('#cancelSettingsBtn').addEventListener('click', () => {
        overlay.remove();
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

/**
 * Show specific tab in channel page
 */
async function showMyChannelTab(tabName) {
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername) return;
    
    // Update tab styling
    const tabs = ['home', 'videos', 'playlists', 'about'];
    tabs.forEach(tab => {
        const tabElement = document.getElementById(`channelTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
        if (tabElement) {
            if (tab === tabName) {
                tabElement.style.background = '#f0f0f0';
                tabElement.style.border = '2px outset #d4d0c8';
                tabElement.style.borderBottom = 'none';
                tabElement.style.fontWeight = 'bold';
                tabElement.style.color = '#000';
            } else {
                tabElement.style.background = '#c0c0c0';
                tabElement.style.border = 'none';
                tabElement.style.fontWeight = 'bold';
                tabElement.style.color = '#000';
            }
        }
    });
    
    const contentArea = document.getElementById('channelMainContent');
    if (!contentArea) return;
    
    // Get user data
    const allVideos = typeof WigTubeDB !== 'undefined' ? await WigTubeDB.getAllVideos() : [];
    const myVideos = allVideos.filter(video => video.uploaderId === currentUsername || video.uploaderName === currentUsername);
    const channelDescription = localStorage.getItem(`channel_description_${currentUsername}`) || '';
    
    switch (tabName) {
        case 'home':
            showChannelHomeTab(contentArea, myVideos);
            break;
        case 'videos':
            showChannelVideosTab(contentArea, myVideos);
            break;
        case 'playlists':
            showChannelPlaylistsTab(contentArea, currentUsername);
            break;
        case 'about':
            showChannelAboutTab(contentArea, channelDescription, myVideos.length);
            break;
    }
}

/**
 * Show HOME tab content
 */
function showChannelHomeTab(contentArea, myVideos) {
    const totalVideos = myVideos.length;
    
    contentArea.innerHTML = `
        <!-- Upload Section -->
        <div style="
            background: #f0f0f0;
            padding: 30px;
            text-align: center;
            margin-bottom: 20px;
            border: 2px outset #d4d0c8;
        ">
            <div style="
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                max-width: 500px;
            ">
                <svg width="100" height="100" viewBox="0 0 120 120" style="opacity: 0.5;">
                    <circle cx="60" cy="60" r="58" fill="none" stroke="#999" stroke-width="2"/>
                    <path d="M60 30 L60 70 M40 50 L60 30 L80 50" stroke="#666" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <rect x="40" y="75" width="40" height="15" rx="2" fill="#666"/>
                </svg>
                
                <div>
                    <h2 style="
                        margin: 0 0 6px 0;
                        font-size: 20px;
                        color: #000080;
                        font-family: 'MS Sans Serif', sans-serif;
                        font-weight: bold;
                    ">Upload a video to get started</h2>
                    
                    <p style="
                        margin: 0 0 16px 0;
                        font-size: 11px;
                        color: #000;
                        font-family: 'MS Sans Serif', sans-serif;
                        line-height: 1.6;
                    ">
                        Share your videos with your subscribers and the world
                    </p>
                    
                    <button type="button" onclick="showUploadVideoDialog()" style="
                        padding: 8px 16px;
                        background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                        color: #000;
                        border: 2px outset #d4d0c8;
                        cursor: pointer;
                        font-size: 11px;
                        font-weight: bold;
                        font-family: 'MS Sans Serif', sans-serif;
                        text-transform: uppercase;
                    ">Upload video</button>
                </div>
            </div>
        </div>
        
        ${totalVideos > 0 ? `
        <div style="margin-bottom: 24px;">
            <div style="
                background: linear-gradient(to bottom, #316ac5 0%, #1e4088 100%);
                padding: 8px 12px;
                margin-bottom: 12px;
                border: 2px outset #d4d0c8;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h2 style="
                    font-size: 20px;
                    font-weight: bold;
                    color: #fff;
                    margin: 0;
                    font-family: 'MS Sans Serif', sans-serif;
                ">Recent Uploads</h2>
                <span style="
                    font-size: 11px;
                    color: #fff;
                    font-family: 'MS Sans Serif', sans-serif;
                ">${totalVideos} video${totalVideos !== 1 ? 's' : ''}</span>
            </div>
            
            <div id="channelHomeVideosGrid" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                gap: 12px;
            ">
            </div>
        </div>
        ` : ''}
    `;
    
    // Show only recent videos (last 6)
    if (totalVideos > 0) {
        const recentVideos = myVideos.slice(0, 6);
        const grid = document.getElementById('channelHomeVideosGrid');
        recentVideos.forEach(video => {
            grid.appendChild(createChannelVideoCard(video));
        });
    }
}

/**
 * Show VIDEOS tab content
 */
function showChannelVideosTab(contentArea, myVideos) {
    const totalVideos = myVideos.length;
    
    contentArea.innerHTML = `
        <div style="margin-bottom: 24px;">
            <div style="
                background: linear-gradient(to bottom, #316ac5 0%, #1e4088 100%);
                padding: 8px 12px;
                margin-bottom: 12px;
                border: 2px outset #d4d0c8;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h2 style="
                    font-size: 20px;
                    font-weight: bold;
                    color: #fff;
                    margin: 0;
                    font-family: 'MS Sans Serif', sans-serif;
                ">All Uploads</h2>
                <span style="
                    font-size: 11px;
                    color: #fff;
                    font-family: 'MS Sans Serif', sans-serif;
                ">${totalVideos} video${totalVideos !== 1 ? 's' : ''}</span>
            </div>
            
            ${totalVideos > 0 ? `
            <div id="channelAllVideosGrid" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                gap: 12px;
            ">
            </div>
            ` : `
            <div style="
                background: #f0f0f0;
                padding: 40px;
                text-align: center;
                border: 2px inset #d4d0c8;
            ">
                <div style="font-size: 72px; margin-bottom: 16px; opacity: 0.5;">📹</div>
                <div style="font-size: 20px; color: #000080; font-weight: bold; margin-bottom: 8px; font-family: 'MS Sans Serif', sans-serif;">No videos uploaded yet</div>
                <div style="font-size: 11px; color: #000; font-family: 'MS Sans Serif', sans-serif;">Start uploading to build your channel</div>
            </div>
            `}
        </div>
    `;
    
    if (totalVideos > 0) {
        const grid = document.getElementById('channelAllVideosGrid');
        myVideos.forEach(video => {
            grid.appendChild(createChannelVideoCard(video, true));
        });
    }
}

/**
 * Show PLAYLISTS tab content
 */
function showChannelPlaylistsTab(contentArea, username) {
    contentArea.innerHTML = `
        <div style="margin-bottom: 24px;">
            <div style="
                background: linear-gradient(to bottom, #316ac5 0%, #1e4088 100%);
                padding: 8px 12px;
                margin-bottom: 12px;
                border: 2px outset #d4d0c8;
            ">
                <h2 style="
                    font-size: 20px;
                    font-weight: bold;
                    color: #fff;
                    margin: 0;
                    font-family: 'MS Sans Serif', sans-serif;
                ">My Playlists</h2>
            </div>
            
            <div id="channelPlaylistsGrid" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 16px;
            ">
            </div>
        </div>
    `;
    
    // Load playlists/albums
    const grid = document.getElementById('channelPlaylistsGrid');
    
    if (albumMetadata && albumMetadata.length > 0) {
        albumMetadata.forEach(album => {
            const playlistCard = document.createElement('div');
            playlistCard.style.cssText = `
                background: #f0f0f0;
                border: 2px outset #d4d0c8;
                padding: 16px;
                cursor: pointer;
            `;
            
            playlistCard.innerHTML = `
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(to bottom, #316ac5 0%, #1e4088 100%);
                        border: 2px outset #d4d0c8;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                        flex-shrink: 0;
                    ">📀</div>
                    <div style="flex: 1;">
                        <div style="
                            font-size: 11px;
                            font-weight: bold;
                            color: #000080;
                            margin-bottom: 4px;
                            font-family: 'MS Sans Serif', sans-serif;
                        ">${album.name}</div>
                        <div style="
                            font-size: 11px;
                            color: #000;
                            font-family: 'MS Sans Serif', sans-serif;
                        ">${albumTracks[album.id] ? albumTracks[album.id].length : 0} videos</div>
                    </div>
                </div>
            `;
            
            playlistCard.addEventListener('click', () => {
                // Navigate to album/playlist view
                showAlbumDetail(album.id);
            });
            
            playlistCard.addEventListener('mouseenter', () => {
                playlistCard.style.border = '2px inset #d4d0c8';
            });
            
            playlistCard.addEventListener('mouseleave', () => {
                playlistCard.style.border = '2px outset #d4d0c8';
            });
            
            grid.appendChild(playlistCard);
        });
    } else {
        grid.innerHTML = `
            <div style="
                grid-column: 1 / -1;
                background: #f0f0f0;
                padding: 40px;
                text-align: center;
                border: 2px inset #d4d0c8;
            ">
                <div style="font-size: 72px; margin-bottom: 16px; opacity: 0.5;">📀</div>
                <div style="font-size: 20px; color: #000080; font-weight: bold; margin-bottom: 8px; font-family: 'MS Sans Serif', sans-serif;">No playlists yet</div>
                <div style="font-size: 11px; color: #000; font-family: 'MS Sans Serif', sans-serif;">Create playlists to organize your videos</div>
            </div>
        `;
    }
}

/**
 * Show ABOUT tab content
 */
function showChannelAboutTab(contentArea, description, videoCount) {
    const currentUsername = localStorage.getItem('username');
    const joinDate = 'January 2009'; // Could be stored in user profile
    
    contentArea.innerHTML = `
        <div style="margin-bottom: 24px;">
            <div style="
                background: linear-gradient(to bottom, #316ac5 0%, #1e4088 100%);
                padding: 8px 12px;
                margin-bottom: 12px;
                border: 2px outset #d4d0c8;
            ">
                <h2 style="
                    font-size: 20px;
                    font-weight: bold;
                    color: #fff;
                    margin: 0;
                    font-family: 'MS Sans Serif', sans-serif;
                ">About</h2>
            </div>
            
            <div style="
                background: #f0f0f0;
                border: 2px inset #d4d0c8;
                padding: 20px;
            ">
                <div style="margin-bottom: 20px;">
                    <h3 style="
                        font-size: 11px;
                        font-weight: bold;
                        color: #000080;
                        margin: 0 0 8px 0;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">Description</h3>
                    <div style="
                        font-size: 11px;
                        color: #000;
                        font-family: 'MS Sans Serif', sans-serif;
                        line-height: 1.6;
                        white-space: pre-wrap;
                    ">${description || 'No description added yet.'}</div>
                    <button type="button" onclick="showChannelSettings()" style="
                        margin-top: 12px;
                        padding: 6px 12px;
                        background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                        color: #000;
                        border: 2px outset #d4d0c8;
                        cursor: pointer;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">Edit Description</button>
                </div>
                
                <div style="
                    border-top: 2px groove #d4d0c8;
                    padding-top: 16px;
                ">
                    <h3 style="
                        font-size: 11px;
                        font-weight: bold;
                        color: #000080;
                        margin: 0 0 12px 0;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">Stats</h3>
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 12px;
                    ">
                        <div>
                            <div style="
                                font-size: 11px;
                                color: #000;
                                font-family: 'MS Sans Serif', sans-serif;
                                margin-bottom: 4px;
                            ">Joined</div>
                            <div style="
                                font-size: 11px;
                                color: #000080;
                                font-weight: bold;
                                font-family: 'MS Sans Serif', sans-serif;
                            ">${joinDate}</div>
                        </div>
                        <div>
                            <div style="
                                font-size: 11px;
                                color: #000;
                                font-family: 'MS Sans Serif', sans-serif;
                                margin-bottom: 4px;
                            ">Total videos</div>
                            <div style="
                                font-size: 11px;
                                color: #000080;
                                font-weight: bold;
                                font-family: 'MS Sans Serif', sans-serif;
                            ">${videoCount}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create a video card for channel pages
 */
function createChannelVideoCard(video, showDelete = false) {
    const videoCard = document.createElement('div');
    videoCard.className = 'channel-video-card';
    videoCard.setAttribute('data-video-id', video.id);
    videoCard.style.cssText = `
        position: relative;
        cursor: pointer;
        background: #f0f0f0;
        border: 2px outset #d4d0c8;
    `;
    
    // Thumbnail container
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.style.cssText = `
        width: 100%;
        padding-top: 56.25%;
        position: relative;
        background: #000;
        overflow: hidden;
        border-bottom: 2px groove #d4d0c8;
    `;
    
    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = video.thumbnail || 'assets/images/icons/48x/WigleTube.png';
    thumbnailImg.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    `;
    thumbnailDiv.appendChild(thumbnailImg);
    
    // Duration badge
    if (video.duration) {
        const durationBadge = document.createElement('div');
        durationBadge.textContent = video.duration;
        durationBadge.style.cssText = `
            position: absolute;
            bottom: 4px;
            right: 4px;
            background: #000080;
            color: white;
            padding: 1px 3px;
            font-size: 9px;
            font-weight: bold;
            font-family: 'MS Sans Serif', sans-serif;
            border: 1px solid white;
        `;
        thumbnailDiv.appendChild(durationBadge);
    }
    
    // Delete button (only for VIDEOS tab)
    if (showDelete) {
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete video';
        deleteBtn.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            width: 28px;
            height: 28px;
            background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
            color: #000;
            border: 2px outset #d4d0c8;
            cursor: pointer;
            font-size: 14px;
            z-index: 10;
            display: none;
            align-items: center;
            justify-content: center;
        `;
        thumbnailDiv.appendChild(deleteBtn);
        
        // Show delete button on hover
        videoCard.addEventListener('mouseenter', () => {
            deleteBtn.style.display = 'flex';
        });
        videoCard.addEventListener('mouseleave', () => {
            deleteBtn.style.display = 'none';
        });
        
        // Handle delete click
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteVideo(video.id, video.title);
        });
    }
    
    // Video info container
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
        padding: 10px;
    `;
    
    // Title
    const titleDiv = document.createElement('div');
    titleDiv.textContent = video.title;
    titleDiv.style.cssText = `
        font-size: 11px;
        font-weight: bold;
        color: #000080;
        margin-bottom: 4px;
        font-family: 'MS Sans Serif', sans-serif;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.3;
    `;
    
    // Stats
    const statsDiv = document.createElement('div');
    const views = video.viewCount || 0;
    const uploadDate = WigTubeDB.formatTimestamp(video.uploadDate);
    statsDiv.textContent = `${WigTubeDB.formatViewCount(views)} • ${uploadDate}`;
    statsDiv.style.cssText = `
        font-size: 10px;
        color: #000;
        font-family: 'MS Sans Serif', sans-serif;
    `;
    
    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(statsDiv);
    
    videoCard.appendChild(thumbnailDiv);
    videoCard.appendChild(infoDiv);
    
    // Handle video card click
    videoCard.addEventListener('click', () => {
        updateStatus(`Loading video: ${video.title}`);
        window.location.href = `apps/browser/pages/wigtube-player.html?v=${video.id}`;
    });
    
    return videoCard;
}