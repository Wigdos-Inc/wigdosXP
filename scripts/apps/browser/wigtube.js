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
                        debugLog('loadVideosWithStats: Got stats for', video.id, '-', dbVideo.viewCount, 'views');
                        return {
                            ...video,
                            views: WigTubeDB.formatViewCount(dbVideo.viewCount || 0),
                            rating: WigTubeDB.calculateStarRating(dbVideo.ratings || [])
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
    
    // Show category buttons
    if (categoryButtons) {
        categoryButtons.style.display = 'flex';
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
    
    // Update header
    if (contentHeader) {
        contentHeader.innerHTML = '📺 Featured Videos - Updated Daily!';
    }
    
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

// Reload videos when page is shown (handles back button navigation)
window.addEventListener('pageshow', async function(event) {
    // If page was loaded from cache (bfcache), reload the videos to get updated view counts
    if (event.persisted) {
        console.log('Page loaded from cache, refreshing video stats...');
        await loadVideosWithStats();
    }
});