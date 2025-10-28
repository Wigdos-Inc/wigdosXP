// WigTube JavaScript - XP Era Style

// Video data with categories and proper thumbnails
const videoData = [
    {
        id: 'epic-minecraft-castle-build',
        title: 'Epic Minecraft Castle Build',
        author: 'WigCraft',
        uploadDate: '3 days ago',
        duration: '10:24',
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
        duration: '01:41',
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
        id: 'html-css-tutorial',
        title: 'HTML & CSS Tutorial',
        author: 'WigDev',
        uploadDate: '4 days ago',
        duration: '22:15',
        views: '8,923 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/nothtml.png',
        category: 'tech'
    },
    {
        id: 'top-10-flash-games-2005',
        title: 'Top 10 Flash Games 2005',
        author: 'WigRetro',
        uploadDate: '1 day ago',
        duration: '8:59',
        views: '34,782 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/flash.png',
        category: 'gaming'
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
        id: 'schlaubum1',
        title: 'jschlatt — Santa Claus Is Coming To Town',
        author: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '00:15',
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
        duration: '00:20',
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
        duration: '00:18',
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
        duration: '00:25',
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
        duration: '00:30',
        views: '390 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        category: 'music'
    }
];
 
// Album/Playlist data - Premade collections
const albumData = [
    {
        id: 'schlaubum',
        title: 'The Schlaubum - Christmas Songs',
        description: 'Christmas songs from a totally good guy',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        trackCount: 5,
        totalDuration: '1:48',
        creator: 'schlatt & Co'
    },
    {
        id: 'gaming-highlights',
        title: 'Epic Gaming Moments',
        description: 'The best gaming content on WigTube',
        thumbnail: 'assets/images/thumbnail/steve.png',
        trackCount: 3,
        totalDuration: '40:22',
        creator: 'WigTube'
    },
    {
        id: 'fnaf-collection',
        title: 'Five Nights Collection',
        description: 'All FNAF content in one place',
        thumbnail: 'assets/images/thumbnail/dingaling.png',
        trackCount: 2,
        totalDuration: '5:33',
        creator: 'Horror Fans'
    }
];

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

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize the page
    renderVideos(videoData);
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
            } else {
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

function filterVideosByCategory(category) {
    let filteredVideos;
    
    if (category === 'all') {
        filteredVideos = videoData;
    } else {
        filteredVideos = videoData.filter(video => video.category === category);
    }
    
    renderVideos(filteredVideos);
    
    // Update content header
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        const categoryName = categoryMap[category];
        contentHeader.textContent = `📺 ${categoryName} - ${filteredVideos.length} video(s) found`;
    }
}

function performSearch() {
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
    
    renderVideos(searchResults);
    
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
    backButton.onclick = () => {
        if (categoryButtons) categoryButtons.style.display = 'flex';
        renderVideos(videoData);
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