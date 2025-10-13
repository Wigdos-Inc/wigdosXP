// WigTube JavaScript - XP Era Style

// Video data with categories and proper thumbnails
const videoData = [
    {
        id: 'epic-minecraft-castle-build',
        title: 'Epic Minecraft Castle Build',
        author: 'WigCraft',
        uploadDate: '3 days ago',
        duration: '10:24',
        views: '45,283 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/steve.png',
        category: 'gaming'
    },
    {
        id: 'persona-5-best-moments',
        title: 'Persona 5 Best Moments',
        author: 'WigGaming',
        uploadDate: '1 week ago',
        duration: '5:42',
        views: '23,891 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/eggman.png',
        category: 'gaming'
    },
    {
        id: 'deltarune-chapter-3-theories',
        title: 'DELTARUNE Chapter 3 Theories',
        author: 'WigTheory',
        uploadDate: '2 days ago',
        duration: '15:33',
        views: '67,542 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/deltarrune.png',
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
        id: 'roaring-twenties-documentary',
        title: 'The Roaring Twenties Documentary',
        author: 'WigHistory',
        uploadDate: '6 days ago',
        duration: '45:12',
        views: '15,789 views',
        rating: '★★★★★',
        thumbnail: 'assets/images/thumbnail/roaring.png',
        category: 'educational'
    },
    {
        id: 'mystery-review-episode-1',
        title: 'Mystery Review Episode 1',
        author: 'MrWigReviews',
        uploadDate: '2 weeks ago',
        duration: '12:34',
        views: '98,234 views',
        rating: '★★★★☆',
        thumbnail: 'assets/images/thumbnail/mr.png',
        category: 'comedy'
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
            updateStatus(`Navigation: ${itemText} - Feature coming soon`);
            
            // Add visual feedback
            this.style.background = '#d0d8ff';
            setTimeout(() => {
                this.style.background = 'white';
            }, 200);
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