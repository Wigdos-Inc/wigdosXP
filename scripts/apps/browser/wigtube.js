// WigTube JavaScript - XP Era Style

// Debug mode - check URL parameter
if (typeof window.WIGTUBE_DEBUG === 'undefined') {
    window.WIGTUBE_DEBUG = new URLSearchParams(window.location.search).has('debug');
}

function debugLog(...args) {
    if (window.WIGTUBE_DEBUG) {
        console.log('[WigTube]', ...args);
    }
}

/**
 * Upload file to external video repository
 */
async function uploadFileToGitHub(file, path, commitMessage) {
    try {
        const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        // External repository configuration
        const VIDEO_REPO_OWNER = 'Danie-GLR';
        const VIDEO_REPO_NAME = 'Videoswigtube-EEEEEE';
        const VIDEO_REPO_BRANCH = 'main';
        const VIDEO_FOLDER = 'videos';
        
        // Detect upload server URL (works in Codespaces and local dev)
        let uploadServerUrl;
        if (window.location.hostname.includes('.app.github.dev') || window.location.hostname.includes('.github.dev')) {
            // GitHub Codespaces - replace port in hostname
            const match = window.location.hostname.match(/^(.+)-(\d+)\.(.+)$/);
            if (match) {
                uploadServerUrl = `${window.location.protocol}//${match[1]}-3001.${match[3]}/upload`;
            } else {
                uploadServerUrl = `${window.location.protocol}//${window.location.hostname.replace(/\./, '-3001.')}/upload`;
            }
        } else {
            uploadServerUrl = 'http://localhost:3001/upload';
        }
        
        console.log('Upload server URL:', uploadServerUrl);
        
        console.log('Uploading to external video repository:', fileName);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', `${VIDEO_FOLDER}/${fileName}`);
        formData.append('repository', `${VIDEO_REPO_OWNER}/${VIDEO_REPO_NAME}`);
        
        const response = await fetch(uploadServerUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ File uploaded to video repository:', result.fileName);
            
            // Construct GitHub raw content URL
            const videoUrl = `https://raw.githubusercontent.com/${VIDEO_REPO_OWNER}/${VIDEO_REPO_NAME}/${VIDEO_REPO_BRANCH}/${VIDEO_FOLDER}/${fileName}`;
            
            await showPopup(
                `Video uploaded successfully!\n\n` +
                `File: ${result.fileName}\n` +
                `Size: ${Math.round(result.size / 1024 / 1024 * 100) / 100} MB\n\n` +
                `📦 The video is being automatically committed and pushed to:\n` +
                `${VIDEO_REPO_OWNER}/${VIDEO_REPO_NAME}\n\n` +
                `⏱️ This may take a few seconds to complete.\n` +
                `The server will automatically:\n` +
                `1. Move file to repository\n` +
                `2. git add ${VIDEO_FOLDER}/${fileName}\n` +
                `3. git commit -m "Add video: ${fileName}"\n` +
                `4. git push origin main\n\n` +
                `Video URL (will be available shortly):\n${videoUrl}`,
                'Upload Complete',
                'info'
            );
            
            // Return the external URL instead of local path
            return videoUrl;
        } else {
            throw new Error(result.error || 'Upload failed');
        }
        
    } catch (error) {
        console.error('Error uploading file:', error);
        
        // Fallback to download method
        const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        await showPopup(
            `Automatic upload failed: ${error.message}\n\n` +
            `The file will download to your computer.\n\n` +
            `Please manually add it to:\n` +
            `https://github.com/Danie-GLR/Videoswigtube-EEEEEE\n` +
            `in the "videos" folder`,
            'Upload Server Not Available',
            'error'
        );
        
        // Download file as fallback
        const blob = new Blob([file], { type: file.type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Return the GitHub raw URL anyway (user will push manually)
        const VIDEO_REPO_OWNER = 'Danie-GLR';
        const VIDEO_REPO_NAME = 'Videoswigtube-EEEEEE';
        const VIDEO_REPO_BRANCH = 'main';
        const VIDEO_FOLDER = 'videos';
        
        return `https://raw.githubusercontent.com/${VIDEO_REPO_OWNER}/${VIDEO_REPO_NAME}/${VIDEO_REPO_BRANCH}/${VIDEO_FOLDER}/${fileName}`;
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
            // Get all video IDs from local videoData
            const videoIds = videoData.map(v => v.id);
            debugLog('loadVideosWithStats: Fetching stats for', videoIds.length, 'videos');
            
            // Fetch stats for each video from Firestore
            const videosWithStats = await Promise.all(videoData.map(async (video) => {
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
            
            debugLog('loadVideosWithStats: Rendering', videosWithStats.length, 'videos');
            renderVideos(videosWithStats);
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
    
    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(45deg, #c0c0c0 25%, transparent 25%)'; this.parentElement.style.backgroundSize='20px 20px';">
            <div class="video-duration">${video.duration}</div>
        </div>
        <div class="video-info">
            <h3>${video.title}</h3>
            <div class="video-meta">
                by ${video.author}<br>
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
        card.addEventListener('click', function() {
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
    }
    if (mainContainer) {
        mainContainer.style.display = 'flex';
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
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername || currentUsername.toLowerCase() === 'guest') {
        updateStatus('Please log in to upload videos');
        alert('You must be logged in to upload videos!');
        return;
    }

    const videoGrid = document.querySelector('.video-grid');
    const contentHeader = document.querySelector('.content-header');
    const categoryButtons = document.querySelector('.video-categories');
    
    if (!videoGrid || !contentHeader) return;
    
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
                <button onclick="showHomePage()" style="
                    padding: 6px 12px;
                    background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                    border: 2px outset #d4d0c8;
                    cursor: pointer;
                    font-size: 11px;
                    font-family: 'MS Sans Serif', sans-serif;
                ">⬅ Back to Home</button>
            </div>
            
            <h2 style="font-size: 16px; margin-bottom: 15px; color: #316ac5;">Upload New Video</h2>
            
            <form id="uploadVideoForm" style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Title *</label>
                    <input type="text" id="videoTitle" required style="
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
                    <input type="file" id="videoFile" accept="video/*" required style="
                        width: 100%;
                        padding: 4px;
                        border: 2px inset #d4d0c8;
                        font-size: 11px;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">
                    <small style="color: #666;">Select a video file - it will be uploaded to the repository</small>
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
                        <select id="videoCategory" required style="
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
                        <input type="text" id="videoDuration" required placeholder="3:45" pattern="[0-9]{1,2}:[0-9]{2}" style="
                            width: 100%;
                            padding: 4px;
                            border: 2px inset #d4d0c8;
                            font-size: 11px;
                            font-family: 'MS Sans Serif', sans-serif;
                        ">
                        <small style="color: #666;">Format: M:SS</small>
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
                    <button type="submit" style="
                        flex: 1;
                        padding: 8px;
                        background: linear-gradient(to bottom, #ece9d8 0%, #d6d3ce 100%);
                        border: 2px outset #d4d0c8;
                        cursor: pointer;
                        font-size: 11px;
                        font-weight: bold;
                        font-family: 'MS Sans Serif', sans-serif;
                    ">📤 Upload Video</button>
                    
                    <button type="button" onclick="showHomePage()" style="
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
    
    // Attach form submission handler
    const form = document.getElementById('uploadVideoForm');
    if (form) {
        form.addEventListener('submit', handleVideoUpload);
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
    
    updateStatus('Ready to upload video');
}

/**
 * Handle video upload
 */
async function handleVideoUpload(event) {
    event.preventDefault();
    
    const currentUsername = localStorage.getItem('username');
    if (!currentUsername || currentUsername.toLowerCase() === 'guest') {
        alert('You must be logged in to upload videos!');
        return;
    }
    
    // Check if WigTubeDB is available
    if (typeof WigTubeDB === 'undefined') {
        alert('Upload feature is currently unavailable. Please try again later.');
        return;
    }
    
    // Get form values
    const title = document.getElementById('videoTitle').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const videoFile = document.getElementById('videoFile');
    const thumbnailSourceType = document.getElementById('thumbnailSourceType').value;
    const thumbnailFile = document.getElementById('thumbnailFile');
    const thumbnailUrlInput = document.getElementById('videoThumbnail').value.trim();
    const category = document.getElementById('videoCategory').value;
    const duration = document.getElementById('videoDuration').value.trim();
    const tagsInput = document.getElementById('videoTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];
    
    // Validate required fields
    if (!videoFile || !videoFile.files || !videoFile.files[0]) {
        await showPopup('Please select a video file!', 'Error', 'error');
        return;
    }
    
    if (!title || !duration) {
        await showPopup('Please fill in all required fields!', 'Error', 'error');
        return;
    }
    
    updateStatus('Uploading video to external repository...');
    
    try {
        const videoFileData = videoFile.files[0];
        const fileName = videoFileData.name.replace(/[^a-zA-Z0-9._-]/g, '_'); // Sanitize filename
        const filePath = `videos/${fileName}`; // Path in external repo
        
        console.log('Uploading video file:', fileName, videoFileData.size, 'bytes');
        
        // Upload file to external GitHub repository - returns the GitHub raw URL
        const videoUrl = await uploadFileToGitHub(videoFileData, filePath, `Add video: ${fileName}`);
        
        if (!videoUrl) {
            updateStatus('Upload failed');
            return;
        }
        
        console.log('Video URL:', videoUrl);
        
        // Handle thumbnail
        let thumbnail = '';
        if (thumbnailSourceType === 'file' && thumbnailFile.files.length > 0) {
            updateStatus('Processing thumbnail...');
            const thumbnailFileData = thumbnailFile.files[0];
            
            // Convert thumbnail to base64 (thumbnails are usually small)
            thumbnail = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(thumbnailFileData);
            });
            console.log('Thumbnail converted to base64');
        } else if (thumbnailSourceType === 'url' && thumbnailUrlInput) {
            thumbnail = thumbnailUrlInput;
        } else {
            thumbnail = 'assets/images/thumbnail/default.png';
        }
        
        updateStatus('Saving to database...');
        
        // Create video object
        const videoData = {
            title,
            description,
            videoUrl,
            thumbnail,
            category,
            duration,
            tags,
            uploaderId: currentUsername,
            uploaderName: currentUsername,
            visibility: 'public'
        };
        
        // Upload to database
        const result = await WigTubeDB.createVideo(videoData);
        
        console.log('Video uploaded successfully:', result);
        
        // Show success message
        alert(`✅ Video "${title}" uploaded successfully!\\n\\nYou can view it on your channel or in the ${category} category.`);
        
        // Redirect to channel
        await showMyChannel();
        
    } catch (error) {
        console.error('Error uploading video:', error);
        alert('Failed to upload video. Please try again.');
        updateStatus('Upload failed');
    }
}

// ============================================
// My Channel Functions (YouTube 2009 Style)
// ============================================

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
        content.style.flex = '1';
        content.style.width = '100%';
        content.style.maxWidth = '100%';
        content.style.padding = '20px';
    }
    if (mainContainer) {
        mainContainer.style.display = 'block';
    }
    
    updateStatus('Loading your channel...');
    showLoadingProgress();
    
    try {
        // Get all videos and filter by current user
        const allVideos = typeof WigTubeDB !== 'undefined' ? await WigTubeDB.getAllVideos() : [];
        const myVideos = allVideos.filter(video => video.uploaderId === currentUsername || video.uploaderName === currentUsername);
        
        // Calculate channel stats
        const totalVideos = myVideos.length;
        const totalViews = myVideos.reduce((sum, video) => sum + (video.viewCount || 0), 0);
        const channelAge = 'Member since 2009'; // You could store join date in user profile
        
        // Get user profile picture
        const profilePic = typeof getUserProfilePicture !== 'undefined' ? getUserProfilePicture(currentUsername) : null;
        
        // Update header
        contentHeader.innerHTML = `📺 ${currentUsername}'s Channel`;
        
        // Create YouTube 2009 styled channel page
        videoGrid.innerHTML = `
            <!-- Channel Container -->
            <div style="max-width: 980px; margin: 0 auto;">
                <!-- Channel Header -->
                <div style="background: #fff; border: 1px solid #ccc; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <!-- Navigation Tabs -->
                    <div style="
                        background: linear-gradient(to bottom, #fafafa 0%, #e8e8e8 100%);
                        border-bottom: 1px solid #ccc;
                        padding: 0;
                        display: flex;
                        gap: 0;
                    ">
                        <a href="#" onclick="showMyChannel(); return false;" style="
                            color: #333;
                            text-decoration: none;
                            padding: 12px 24px;
                            font-size: 13px;
                            font-weight: bold;
                            background: #fff;
                            border-right: 1px solid #ccc;
                            border-bottom: 2px solid #cc181e;
                        ">Videos</a>
                        <a href="#" style="
                            color: #0033cc;
                            text-decoration: none;
                            padding: 12px 24px;
                            font-size: 13px;
                            border-right: 1px solid #ccc;
                        ">Playlists</a>
                        <a href="#" style="
                            color: #0033cc;
                            text-decoration: none;
                            padding: 12px 24px;
                            font-size: 13px;
                            border-right: 1px solid #ccc;
                        ">Favorites</a>
                        <a href="#" style="
                            color: #0033cc;
                            text-decoration: none;
                            padding: 12px 24px;
                            font-size: 13px;
                        ">About</a>
                        <div style="flex: 1;"></div>
                        <button onclick="showHomePage()" style="
                            margin: 6px 10px;
                            padding: 6px 16px;
                            background: #f8f8f8;
                            border: 1px solid #d3d3d3;
                            border-radius: 2px;
                            cursor: pointer;
                            font-size: 11px;
                            font-family: Arial, sans-serif;
                            color: #333;
                        ">← Back to Home</button>
                    </div>
                    
                    <!-- Channel Header Section -->
                    <div style="padding: 30px; background: #fff;">
                        <div style="display: flex; gap: 30px; align-items: flex-start;">
                            <!-- Avatar -->
                            <div style="
                                width: 100px;
                                height: 100px;
                                ${profilePic ? `background-image: url('${profilePic}'); background-size: cover; background-position: center;` : `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);`}
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 42px;
                                color: white;
                                font-weight: bold;
                                text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
                                flex-shrink: 0;
                                border: 3px solid #e0e0e0;
                            ">${profilePic ? '' : currentUsername.charAt(0).toUpperCase()}</div>
                            
                            <!-- Channel Info -->
                            <div style="flex: 1;">
                                <h1 style="
                                    font-size: 28px;
                                    color: #333;
                                    margin: 0 0 8px 0;
                                    font-weight: normal;
                                    font-family: Arial, sans-serif;
                                ">${currentUsername}</h1>
                                
                                <div style="
                                    color: #666;
                                    font-size: 12px;
                                    margin-bottom: 20px;
                                    font-family: Arial, sans-serif;
                                ">
                                    <span style="margin-right: 15px;">
                                        <strong>${totalVideos}</strong> video${totalVideos !== 1 ? 's' : ''}
                                    </span>
                                    <span style="margin-right: 15px;">
                                        <strong>${totalViews.toLocaleString()}</strong> total upload views
                                    </span>
                                    <span>
                                        Joined ${channelAge}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Upload Prompt Section -->
                <div style="
                    background: #fff;
                    border: 1px solid #ccc;
                    padding: 40px;
                    text-align: center;
                    margin-bottom: 20px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                ">
                    <div style="
                        display: inline-flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 20px;
                        max-width: 500px;
                    ">
                        <!-- Upload Icon -->
                        <div style="
                            width: 100px;
                            height: 100px;
                            background: linear-gradient(135deg, #cc181e 0%, #990000 100%);
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        ">
                            <div style="
                                width: 0;
                                height: 0;
                                border-left: 25px solid transparent;
                                border-right: 25px solid transparent;
                                border-bottom: 35px solid white;
                            "></div>
                        </div>
                        
                        <div>
                            <h2 style="
                                margin: 0 0 10px 0;
                                font-size: 20px;
                                color: #333;
                                font-family: Arial, sans-serif;
                                font-weight: normal;
                            ">Want to upload a new video?</h2>
                            
                            <p style="
                                margin: 0 0 20px 0;
                                font-size: 13px;
                                color: #666;
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                            ">
                                Share your videos with the world. Upload and manage your content to start building your channel.
                            </p>
                            
                            <button onclick="showUploadVideoDialog()" style="
                                padding: 12px 32px;
                                background: linear-gradient(to bottom, #ffd700 0%, #f5a623 100%);
                                border: 1px solid #d39e00;
                                border-radius: 3px;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: bold;
                                font-family: Arial, sans-serif;
                                color: #000;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            ">Upload New Video</button>
                        </div>
                    </div>
                </div>
                
                <!-- Videos Grid -->
                ${myVideos.length > 0 ? `
                <div style="background: #fff; border: 1px solid #ccc; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="
                        border-bottom: 1px solid #e8e8e8;
                        padding-bottom: 12px;
                        margin-bottom: 20px;
                        font-size: 15px;
                        font-weight: bold;
                        color: #333;
                        font-family: Arial, sans-serif;
                    ">
                        Uploaded Videos (${totalVideos})
                    </div>
                    
                    <div id="channelVideosGrid" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 20px;
                    ">
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Add video cards if there are any
        if (myVideos.length > 0) {
            const channelVideosGrid = document.getElementById('channelVideosGrid');
            
            for (const video of myVideos) {
                const videoCard = createVideoCard({
                    id: video.id,
                    title: video.title,
                    thumbnail: video.thumbnail,
                    duration: video.duration,
                    author: video.uploaderName || video.uploaderId,
                    views: WigTubeDB.formatViewCount(video.viewCount || 0),
                    rating: WigTubeDB.calculateStarRating(Object.values(video.userRatings || {})),
                    uploadDate: WigTubeDB.formatTimestamp(video.uploadDate)
                });
                
                // Add special styling for channel videos
                videoCard.style.border = '2px solid #d0d8ff';
                videoCard.style.position = 'relative';
                
                // Add delete button to the card
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '🗑️ Delete';
                deleteBtn.style.cssText = `
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    padding: 4px 8px;
                    background: rgba(220, 53, 69, 0.9);
                    color: white;
                    border: 1px solid #c82333;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 10px;
                    font-weight: bold;
                    font-family: Arial, sans-serif;
                    z-index: 10;
                    display: none;
                `;
                
                // Show delete button on hover
                videoCard.addEventListener('mouseenter', () => {
                    deleteBtn.style.display = 'block';
                });
                videoCard.addEventListener('mouseleave', () => {
                    deleteBtn.style.display = 'none';
                });
                
                // Handle delete click
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // Prevent video from playing
                    await deleteVideo(video.id, video.title);
                });
                
                videoCard.appendChild(deleteBtn);
                channelVideosGrid.appendChild(videoCard);
            }
            
            // Re-attach click events
            attachVideoCardEvents();
        }
        
        updateStatus(`Showing ${currentUsername}'s channel with ${totalVideos} video(s)`);
        
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
        
        // Delete from database
        const success = await WigTubeDB.deleteVideo(videoId);
        
        console.log('Delete result:', success);
        
        if (success) {
            console.log('Video deleted successfully from database:', videoId);
            
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