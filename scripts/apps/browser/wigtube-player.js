// WigTube Video Player JavaScript - 2003 YouTube Style

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

// Video data structure
const videoData = {
    'epic-minecraft-castle-build': {
        title: 'Epic Minecraft Castle Build',
        uploader: 'WigCraft',
        uploadDate: '3 days ago',
        duration: '10:24',
        views: '2 views',
        rating: '★★★★☆',
        ratingCount: 127,
        description: 'I, AM STEVE',
        videoFile: 'assets/videos/steve.mp4',
        thumbnail: 'assets/images/thumbnail/steve.png'
    },
    'yo Darren': {
        title: 'Yo Darren',
        uploader: 'Codemittens',
        uploadDate: '05-11-2025',
        duration: '01:41',
        views: '5112025',
        rating: '★★★★★',
        ratingCount: 89,
        description: 'YO DARREN MY N',
        videoFile: 'assets/videos/dingaling.mp4',
        thumbnail: 'assets/images/thumbnail/yodarren.png'
    },
    'Fredrick fazbear touches youtubers dingalings': {
        title: 'Fredrick Fazbear Touches Youtubers Dingalings',
        uploader: 'fredbear',
        uploadDate: '1987 days ago',
        duration: '04:37',
        views: '4 views',
        rating: '★★★★☆',
        ratingCount: 203,
        description: 'The rival of mrPenis strikes once again',
        videoFile: 'assets/videos/nightguard.mp4',
        thumbnail: 'assets/images/thumbnail/dingaling.png'
    },
    'schlaubum1': {
        title: 'schlaubum1',
        uploader: 'schlatt & Co',
        uploadDate: '5 days ago',
        duration: '3:47',
        views: '12,456 views',
        rating: '★★★☆☆',
        ratingCount: 31,
        description: 'jolly music by the big man himself',
        videoFile: 'assets/audio/album/album1.mp4',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        isMusic: true,
        album: 'the Schlaubum',
        albumArt: 'assets/images/thumbnail/schlatt.png',
        artist: 'schlatt & Co',
        year: '2025',
        genre: 'Lo-Fi Hip Hop'
    },
    'html-css-tutorial': {
        title: 'HTML & CSS Tutorial',
        uploader: 'WigDev',
        uploadDate: '4 days ago',
        duration: '22:15',
        views: '8,923 views',
        rating: '★★★★★',
        ratingCount: 45,
        description: 'Complete beginner\'s guide to HTML and CSS! Learn how to create your first website from scratch.\n\nWhat you\'ll learn:\n• HTML structure and semantic tags\n• CSS styling and layout\n• Box model fundamentals\n• Responsive design basics\n• Best practices for web development\n\nThis tutorial is perfect for absolute beginners who want to get started with web development. No prior experience required!\n\nCode examples and resources:\n• All code is available for download\n• Step-by-step written guide\n• Practice exercises\n• Additional resources and links\n\nBy the end of this tutorial, you\'ll have created a complete webpage and understand the fundamentals of HTML and CSS.\n\nLet me know what web development topics you\'d like to see next!',
        videoFile: null,
        thumbnail: 'assets/images/thumbnail/nothtml.png'
    },
    'top-10-flash-games-2005': {
        title: 'Top 10 Flash Games 2005',
        uploader: 'WigRetro',
        uploadDate: '1 day ago',
        duration: '8:59',
        views: '34,782 views',
        rating: '★★★★☆',
        ratingCount: 78,
        description: 'Countdown of the best Flash games from 2005! These games defined online gaming for a generation and are still incredibly fun to play today.\n\nGames featured:\n10. Stick War\n9. Bloons\n8. Thing Thing Series\n7. Madness Interactive\n6. Age of War\n5. Fancy Pants Adventure\n4. Red Ball\n3. Super Crazy Guitar Maniac Deluxe\n2. Line Rider\n1. Alien Hominid\n\nFlash games were the foundation of internet culture in the early 2000s. Sites like Newgrounds, Miniclip, and AddictingGames provided endless entertainment.\n\nEach game showcase includes:\n• Gameplay footage\n• Historical context\n• Developer information\n• Cultural impact\n\nRIP Flash Player (1996-2020) - You will be missed!\n\nWhat was your favorite Flash game? Let me know in the comments!',
        videoFile: null,
        thumbnail: 'assets/images/thumbnail/flash.png'
    },
  'fredrick-fazbear-touches-youtubers-dingalings': {
        title: 'Fredrick Fazbear Touches Youtubers Dingalings',
        uploader: 'fredbear',
        uploadDate: '1987 days ago',
        duration: '04:37',
        views: '4 views',
        rating: '★★★★☆',
        ratingCount: 203,
        description: 'The rival of mrPenis strikes once again',
        videoFile: 'assets/videos/nightguard.mp4',
        thumbnail: 'assets/images/thumbnail/dingaling.png'
    },
    'fnaf-squid-games-real': {
        title: 'Fnaf squid games real',
        uploader: 'MrPenis',
        uploadDate: '2 centuries ago',
        duration: '00:56',
        views: '1B views',
        rating: '★★★★☆',
        ratingCount: 156,
        description: 'The true fnaf experience',
        videoFile: 'assets/videos/fnaf.mp4',
        thumbnail: 'assets/images/thumbnail/mr.png'
    },
    'schlaubum1': {
        title: 'jschlatt — Santa Claus Is Coming To Town',
        uploader: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '00:15',
        views: '420 views',
        rating: '★★★★★',
        ratingCount: 69,
        description: 'Schlaubman sings a festive tune',
        videoFile: 'assets/album/album1.mp4',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        isMusic: true,
        album: 'The Schlaubum',
        albumArt: 'assets/images/thumbnail/schlatt.png',
        artist: 'schlatt & Co',
        year: '2025',
        genre: 'Holiday'
    },
    'schlaubum2': {
        title: 'jschlatt — The Christmas Song',
        uploader: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '00:20',
        views: '380 views',
        rating: '★★★★★',
        ratingCount: 54,
        description: 'A jolly holiday song by Schlaubman',
        videoFile: 'assets/album/album2.mp4',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        isMusic: true,
        album: 'The Schlaubum',
        albumArt: 'assets/images/thumbnail/schlatt.png',
        artist: 'schlatt & Co',
        year: '2025',
        genre: 'Holiday'
    },
    'schlaubum3': {
        title: 'jschlatt — Let It Snow! Let It Snow! Let It Snow!',
        uploader: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '00:18',
        views: '512 views',
        rating: '★★★★★',
        ratingCount: 71,
        description: 'Another festive track from Schlaubman',
        videoFile: 'assets/album/album3.mp4',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        isMusic: true,
        album: 'The Schlaubum',
        albumArt: 'assets/images/thumbnail/schlatt.png',
        artist: 'schlatt & Co',
        year: '2025',
        genre: 'Holiday'
    },
    'schlaubum4': {
        title: 'jschlatt — Baby It\'s Cold Outside',
        uploader: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '00:25',
        views: '445 views',
        rating: '★★★★★',
        ratingCount: 63,
        description: 'Schlaubman brings the holiday spirit',
        videoFile: 'assets/album/album4.mp4',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        isMusic: true,
        album: 'The Schlaubum',
        albumArt: 'assets/images/thumbnail/schlatt.png',
        artist: 'schlatt & Co',
        year: '2025',
        genre: 'Holiday'
    },
    'schlaubum5': {
        title: 'jschlatt — Happy Holiday',
        uploader: 'schlatt & Co',
        uploadDate: '1 day ago',
        duration: '00:30',
        views: '390 views',
        rating: '★★★★★',
        ratingCount: 58,
        description: 'The grand finale of the Schlaubum',
        videoFile: 'assets/album/album5.mp4',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        isMusic: true,
        album: 'The Schlaubum',
        albumArt: 'assets/images/thumbnail/schlatt.png',
        artist: 'schlatt & Co',
        year: '2025',
        genre: 'Holiday'
    }
};

// Album/Playlist data - Premade collections that autoplay
const albumData = {
    'schlaubum': {
        id: 'schlaubum',
        title: 'The Schlaubum - Christmas Songs',
        description: 'Christmas songs from a totally good guy - Schlaubman brings the holiday spirit',
        thumbnail: 'assets/images/thumbnail/schlatt.png',
        tracks: [
            'schlaubum1',
            'schlaubum2',
            'schlaubum3',
            'schlaubum4',
            'schlaubum5'
        ],
        creator: 'Schlaubman',
        created: '2025-12-25',
        totalDuration: '1:48'
    },
    'gaming-highlights': {
        id: 'gaming-highlights',
        title: 'Epic Gaming Moments',
        description: 'The best gaming content on WigTube',
        thumbnail: 'assets/images/thumbnail/steve.png',
        tracks: [
            'epic-minecraft-castle-build',
            'yo Darren',
            'top-10-flash-games-2005'
        ],
        creator: 'WigTube',
        created: '2025-01-10',
        totalDuration: '40:22'
    },
    'fnaf-collection': {
        id: 'fnaf-collection',
        title: 'Five Nights Collection',
        description: 'All FNAF content in one place',
        thumbnail: 'assets/images/thumbnail/dingaling.png',
        tracks: [
            'fredrick-fazbear-touches-youtubers-dingalings',
            'fnaf-squid-games-real'
        ],
        creator: 'Horror Fans',
        created: '1987-06-26',
        totalDuration: '5:33'
    }
};

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
        id: 'chill-beats-mix-vol-12',
        title: 'Chill Beats Mix Vol. 12',
        uploader: 'WigBeats',
        duration: '3:47',
        thumbnail: 'assets/images/thumbnail/beats.png'
    },
    {
        id: 'html-css-tutorial',
        title: 'HTML & CSS Tutorial',
        uploader: 'WigDev',
        duration: '22:15',
        thumbnail: 'assets/images/thumbnail/nothtml.png'
    },
    {
        id: 'top-10-flash-games-2005',
        title: 'Top 10 Flash Games 2005',
        uploader: 'WigRetro',
        duration: '8:59',
        thumbnail: 'assets/images/thumbnail/flash.png'
    },
    {
        id: 'fredrick-fazbear-touches-youtubers-dingalings',
        title: 'Fredrick Fazbear Touches Youtubers Dingalings',
        uploader: 'fredbear',
        duration: '04:37',
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
let videoElement = null;
let isPlaying = false;
let currentTime = 0;
let duration = 0;
let selectedImage = null;
let videoSimulationInterval = null;
let currentAlbum = null;
let currentTrackIndex = 0;
let isPlayingAlbum = false;

document.addEventListener('DOMContentLoaded', function() {
    initializePlayer();
    loadVideoFromURL();
    setupEventListeners();
    populateRelatedVideos();
    loadComments(); // Load saved comments
});

function initializePlayer() {
    // Get video ID or album ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    const albumId = urlParams.get('album');
    
    if (albumId && albumData[albumId]) {
        // Load album playlist
        loadAlbum(albumId);
    } else {
        // Load single video
        loadVideo(videoId || 'epic-minecraft-castle-build');
    }
}

function loadVideoFromURL() {
    // This function handles loading video based on URL parameters
    // Simulates early YouTube URL structure: ?v=videoId
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    
    if (videoId && videoData[videoId]) {
        loadVideo(videoId);
    } else {
        // Default to first video if no valid ID
        loadVideo('epic-minecraft-castle-build');
    }
}

function loadVideo(videoId) {
    const video = videoData[videoId];
    if (!video) {
        console.error('Video not found:', videoId);
        return;
    }
    
    currentVideo = video;
    
    // Update page title
    document.title = `${video.title} - WigTube`;
    
    // Load saved video stats from localStorage
    const savedStats = loadVideoStats(videoId);
    
    // Update video information with saved stats
    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('uploader').textContent = video.uploader;
    document.getElementById('uploadDate').textContent = video.uploadDate;
    document.getElementById('viewCount').textContent = savedStats.views;
    document.getElementById('rating').textContent = savedStats.ratingStars;
    document.getElementById('ratingCount').textContent = savedStats.ratingCount;
    document.getElementById('videoDescription').textContent = video.description;
    document.getElementById('totalTime').textContent = video.duration;
    
    // Show album section if this is a music video
    if (video.isMusic) {
        displayAlbumSection(video);
    } else {
        hideAlbumSection();
    }
    
    // Increment view count (after a delay to simulate actual viewing)
    setTimeout(() => {
        incrementViewCount(videoId);
    }, 3000);
    
    // Start buffering simulation
    startBuffering();
    
    // Update status
    updateStatus('Loading video: ' + video.title);
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
    
    // Comment form
    document.querySelector('.comment-submit').addEventListener('click', function() {
        const commentInput = document.querySelector('.comment-input');
        const comment = commentInput.value.trim();
        
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
}

function playVideo() {
    const playButton = document.getElementById('playButton');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const statusText = document.getElementById('statusText');
    
    // Hide big play button
    playButton.style.display = 'none';
    
    // Update button text
    playPauseBtn.textContent = 'Pause';
    
    // Set playing state
    isPlaying = true;
    
    // Update status
    statusText.textContent = `Playing: ${currentVideo.title}`;
    
    // Try to play actual video if available
    if (currentVideo.videoFile) {
        // If video element already exists, just resume playback
        if (videoElement) {
            videoElement.play().catch(e => {
                console.log('Video play failed:', e);
            });
        } else {
            // Create new video element
            createVideoElement();
        }
    } else {
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
    videoElement.src = currentVideo.videoFile;
    videoElement.style.cssText = 'width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; z-index: 10;';
    videoElement.controls = false; // We handle controls ourselves
    
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

function addToFavorites(videoId) {
    // Get current favorites from centralized storage
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

function addComment(commentText, imageData = null) {
    const commentsList = document.querySelector('.comments-list');
    const newComment = document.createElement('div');
    newComment.className = 'comment';
    
    const now = new Date();
    const timeString = 'Just now';
    
    // Create comment content with optional image
    let imageHTML = '';
    if (imageData) {
        imageHTML = `<div class="comment-image"><img src="${imageData}" alt="Comment image"></div>`;
    }
    
    newComment.innerHTML = `
        <div class="comment-author">Guest User</div>
        <div class="comment-time">${timeString}</div>
        <div class="comment-text">${commentText}</div>
        ${imageHTML}
    `;
    
    // Add to top of comments
    commentsList.insertBefore(newComment, commentsList.firstChild);
    
    // Update comment count
    const commentsHeader = document.querySelector('.comments-section .sidebar-header');
    const currentCount = parseInt(commentsHeader.textContent.match(/\\d+/)[0]);
    commentsHeader.textContent = `Comments (${currentCount + 1})`;
    
    // Save comment to localStorage
    saveComment(commentText, imageData, timeString);
    
    // Show success message
    updateStatus('Comment posted successfully');
}

function saveComment(text, imageData, timeString) {
    const videoId = getVideoIdFromURL();
    const allComments = getWigTubeProperty('comments') || {};
    const comments = allComments[videoId] || [];
    
    comments.unshift({
        text: text,
        image: imageData,
        time: timeString,
        author: 'Guest User',
        timestamp: Date.now()
    });
    
    // Keep only last 50 comments to prevent storage bloat
    if (comments.length > 50) {
        comments.splice(50);
    }
    
    allComments[videoId] = comments;
    updateWigTubeProperty('comments', allComments);
}

function loadComments() {
    const videoId = getVideoIdFromURL();
    const allComments = getWigTubeProperty('comments') || {};
    const comments = allComments[videoId] || [];
    const commentsList = document.querySelector('.comments-list');
    
    // Clear existing comments
    commentsList.innerHTML = '';
    
    // Load saved comments
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        
        let imageHTML = '';
        if (comment.image) {
            imageHTML = `<div class="comment-image"><img src="${comment.image}" alt="Comment image"></div>`;
        }
        
        commentElement.innerHTML = `
            <div class="comment-author">${comment.author}</div>
            <div class="comment-time">${comment.time}</div>
            <div class="comment-text">${comment.text}</div>
            ${imageHTML}
        `;
        
        commentsList.appendChild(commentElement);
    });
    
    // Update comment count
    const commentsHeader = document.querySelector('.comments-section .sidebar-header');
    commentsHeader.textContent = `Comments (${comments.length})`;
}

function getVideoIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v') || 'epic-minecraft-castle-build';
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

function populateRelatedVideos() {
    const relatedVideosList = document.getElementById('relatedVideosList');
    const currentVideoId = getVideoIdFromURL();
    
    // Filter out current video and get a random selection
    const availableVideos = relatedVideos.filter(video => video.id !== currentVideoId);
    
    // Shuffle array and take first 4 videos
    const shuffled = availableVideos.sort(() => 0.5 - Math.random());
    const selectedVideos = shuffled.slice(0, 4);
    
    selectedVideos.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.className = 'related-video';
        videoElement.onclick = () => loadRelatedVideo(video.id);
        
        const thumbnailHtml = video.thumbnail ?
            `<img src="${video.thumbnail}" alt="${video.title}" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(45deg, #667eea, #764ba2)'; this.parentElement.innerHTML='<div style=\\'display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; width: 100%; height: 100%;\\'>📺</div>';">` :
            `<div style="background: linear-gradient(45deg, #667eea, #764ba2); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white;">📺</div>`;
        
        videoElement.innerHTML = `
            <div class="related-thumbnail">
                ${thumbnailHtml}
                <div class="related-duration">${video.duration}</div>
            </div>
            <div class="related-info">
                <h4>${video.title}</h4>
                <div class="related-meta">by ${video.uploader}</div>
            </div>
        `;
        
        relatedVideosList.appendChild(videoElement);
    });
}

function loadRelatedVideo(videoId) {
    // Update URL and reload video
    const newUrl = `${window.location.pathname}?v=${videoId}`;
    window.history.pushState({}, '', newUrl);
    
    // Stop current video
    stopVideo();
    
    // Load new video
    loadVideo(videoId);
    
    // Clear and repopulate related videos
    document.getElementById('relatedVideosList').innerHTML = '';
    populateRelatedVideos();
    
    // Load comments for new video
    loadComments();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function goBack() {
    // Return to main WigTube page
    window.history.back();
}

function updateStatus(message) {
    document.getElementById('statusText').textContent = message;
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    loadVideoFromURL();
    loadComments(); // Load comments for the new video
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
function loadAlbum(albumId) {
    const album = albumData[albumId];
    if (!album || !album.tracks || album.tracks.length === 0) {
        console.error('Album not found or empty:', albumId);
        loadVideo('epic-minecraft-castle-build');
        return;
    }
    
    currentAlbum = album;
    currentTrackIndex = 0;
    isPlayingAlbum = true;
    
    // Display album playlist UI
    displayAlbumPlaylist(album);
    
    // Load first track
    const firstTrackId = album.tracks[0];
    loadVideo(firstTrackId);
    
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
function playNextTrack() {
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
    
    setTimeout(() => {
        loadVideo(nextTrackId);
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
function jumpToTrack(trackIndex) {
    if (!currentAlbum || trackIndex < 0 || trackIndex >= currentAlbum.tracks.length) return;
    
    currentTrackIndex = trackIndex;
    const trackId = currentAlbum.tracks[trackIndex];
    
    stopVideo();
    
    setTimeout(() => {
        loadVideo(trackId);
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
function getUserPlaylists() {
    return getWigTubeProperty('playlists') || {};
}

/**
 * Save user playlists to localStorage
 */
function saveUserPlaylists(playlists) {
    updateWigTubeProperty('playlists', playlists);
}

/**
 * Create a new playlist
 */
function createNewPlaylist(playlistName) {
    if (!playlistName || playlistName.trim() === '') {
        updateStatus('Please enter a playlist name');
        return false;
    }
    
    const playlists = getUserPlaylists();
    
    // Check if playlist already exists
    if (playlists[playlistName]) {
        updateStatus('Playlist already exists');
        return false;
    }
    
    playlists[playlistName] = {
        name: playlistName,
        tracks: [],
        created: new Date().toISOString(),
        modified: new Date().toISOString()
    };
    
    saveUserPlaylists(playlists);
    updateStatus(`Created playlist: ${playlistName}`);
    return true;
}

/**
 * Delete a playlist
 */
function deletePlaylist(playlistName) {
    const playlists = getUserPlaylists();
    
    if (!playlists[playlistName]) {
        updateStatus('Playlist not found');
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${playlistName}"?`)) {
        delete playlists[playlistName];
        saveUserPlaylists(playlists);
        updateStatus(`Deleted playlist: ${playlistName}`);
        closePlaylistModal();
    }
}

/**
 * Show playlist selection modal
 */
function showPlaylistModal(trackTitle, trackData, buttonElement) {
    const playlists = getUserPlaylists();
    const playlistNames = Object.keys(playlists);
    
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
    if (playlistNames.length === 0) {
        playlistListHTML = '<div style="padding: 10px; text-align: center; color: #666;">No playlists yet. Create one below!</div>';
    } else {
        playlistListHTML = playlistNames.map(name => {
            const playlist = playlists[name];
            const trackCount = playlist.tracks.length;
            const isInPlaylist = playlist.tracks.some(t => t.title === trackTitle);
            
            return `
                <div style="
                    background: white;
                    border: 2px inset #ddd;
                    padding: 8px;
                    margin-bottom: 5px;
                    cursor: ${isInPlaylist ? 'not-allowed' : 'pointer'};
                    opacity: ${isInPlaylist ? '0.6' : '1'};
                " 
                onclick="${isInPlaylist ? '' : `addTrackToPlaylist('${name.replace(/'/g, "\\'")}', '${trackTitle.replace(/'/g, "\\'")}'); closePlaylistModal();`}"
                onmouseover="if(!${isInPlaylist}) this.style.background='#FFFFCC'"
                onmouseout="this.style.background='white'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: bold; font-size: 11px;">${name}</div>
                            <div style="font-size: 10px; color: #666;">${trackCount} track${trackCount !== 1 ? 's' : ''}</div>
                        </div>
                        <div>
                            ${isInPlaylist ? 
                                '<span style="color: green; font-size: 10px;">✓ Already added</span>' : 
                                '<button onclick="event.stopPropagation(); addTrackToPlaylist(\'' + name.replace(/'/g, "\\'") + '\', \'' + trackTitle.replace(/'/g, "\\'") + '\'); closePlaylistModal();" style="background: white; border: 2px outset #ddd; padding: 2px 8px; cursor: pointer; font-size: 10px;">Add</button>'
                            }
                            <button onclick="event.stopPropagation(); deletePlaylist('${name.replace(/'/g, "\\'")}'); showPlaylistModal('${trackTitle.replace(/'/g, "\\'")}', null, null);" style="background: #FFB0B0; border: 2px outset #ddd; padding: 2px 8px; cursor: pointer; font-size: 10px; margin-left: 5px;">Delete</button>
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
function createNewPlaylistAndAdd(trackTitle) {
    const input = document.getElementById('newPlaylistName');
    const playlistName = input.value.trim();
    
    if (createNewPlaylist(playlistName)) {
        addTrackToPlaylist(playlistName, trackTitle);
        closePlaylistModal();
    }
}

/**
 * Add track to specific playlist
 */
function addTrackToPlaylist(playlistName, trackTitle) {
    const playlists = getUserPlaylists();
    
    if (!playlists[playlistName]) {
        updateStatus('Playlist not found');
        return;
    }
    
    // Check if track already in playlist
    if (playlists[playlistName].tracks.some(t => t.title === trackTitle)) {
        updateStatus('Track already in this playlist');
        return;
    }
    
    // Get track data
    const trackData = videoData[Object.keys(videoData).find(key => 
        videoData[key].title === trackTitle
    )] || null;
    
    // Add track
    playlists[playlistName].tracks.push({
        title: trackTitle,
        uploader: trackData?.uploader || 'Unknown',
        duration: trackData?.duration || '0:00',
        videoId: Object.keys(videoData).find(key => videoData[key].title === trackTitle),
        addedDate: new Date().toISOString()
    });
    
    playlists[playlistName].modified = new Date().toISOString();
    saveUserPlaylists(playlists);
    
    updateStatus(`Added "${trackTitle}" to "${playlistName}"`);
}

/**
 * Main function to add to playlist - shows modal
 */
function addToPlaylist(trackTitle, buttonElement) {
    showPlaylistModal(trackTitle, null, buttonElement);
}

/**
 * Open playlist manager
 */
function openPlaylistManager() {
    closePlaylistModal();
    
    const playlists = getUserPlaylists();
    const playlistNames = Object.keys(playlists);
    
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
    if (playlistNames.length === 0) {
        playlistsHTML = '<div style="padding: 20px; text-align: center; color: #666;">No playlists yet. Create your first playlist!</div>';
    } else {
        playlistsHTML = playlistNames.map(name => {
            const playlist = playlists[name];
            const tracksHTML = playlist.tracks.map((track, idx) => `
                <div style="background: #F0F0F0; border: 1px solid #ccc; padding: 5px; margin: 3px 0; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <span style="font-size: 10px;">${idx + 1}. ${track.title}</span>
                        <span style="font-size: 9px; color: #666; margin-left: 10px;">(${track.duration})</span>
                    </div>
                    <button onclick="removeTrackFromPlaylist('${name.replace(/'/g, "\\'")}', ${idx}); openPlaylistManager();" style="background: #FFB0B0; border: 2px outset #ddd; padding: 2px 8px; cursor: pointer; font-size: 9px;">Remove</button>
                </div>
            `).join('');
            
            return `
                <div style="background: white; border: 2px inset #ddd; padding: 10px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <div style="font-weight: bold; font-size: 12px;">${name}</div>
                            <div style="font-size: 10px; color: #666;">${playlist.tracks.length} track${playlist.tracks.length !== 1 ? 's' : ''} • Created ${new Date(playlist.created).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <button onclick="playPlaylist('${name.replace(/'/g, "\\'")}'); closePlaylistManagerModal();" style="background: #90EE90; border: 2px outset #ddd; padding: 3px 10px; cursor: pointer; font-size: 10px; margin-right: 5px;">▶ Play</button>
                            <button onclick="deletePlaylist('${name.replace(/'/g, "\\'")}'); openPlaylistManager();" style="background: #FFB0B0; border: 2px outset #ddd; padding: 3px 10px; cursor: pointer; font-size: 10px;">Delete</button>
                        </div>
                    </div>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${tracksHTML || '<div style="padding: 10px; text-align: center; color: #999; font-size: 10px;">No tracks in this playlist</div>'}
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
function createNewPlaylistFromManager() {
    const input = document.getElementById('managerNewPlaylistName');
    const playlistName = input.value.trim();
    
    if (createNewPlaylist(playlistName)) {
        openPlaylistManager();
    }
}

/**
 * Remove track from playlist
 */
function removeTrackFromPlaylist(playlistName, trackIndex) {
    const playlists = getUserPlaylists();
    
    if (!playlists[playlistName]) {
        updateStatus('Playlist not found');
        return;
    }
    
    if (trackIndex < 0 || trackIndex >= playlists[playlistName].tracks.length) {
        updateStatus('Track not found');
        return;
    }
    
    const trackTitle = playlists[playlistName].tracks[trackIndex].title;
    playlists[playlistName].tracks.splice(trackIndex, 1);
    playlists[playlistName].modified = new Date().toISOString();
    
    saveUserPlaylists(playlists);
    updateStatus(`Removed "${trackTitle}" from "${playlistName}"`);
}

/**
 * Play a user playlist
 */
function playPlaylist(playlistName) {
    const playlists = getUserPlaylists();
    
    if (!playlists[playlistName]) {
        updateStatus('Playlist not found');
        return;
    }
    
    const playlist = playlists[playlistName];
    
    if (playlist.tracks.length === 0) {
        updateStatus('Playlist is empty');
        return;
    }
    
    // Load first track
    const firstTrack = playlist.tracks[0];
    if (firstTrack.videoId && videoData[firstTrack.videoId]) {
        loadVideo(firstTrack.videoId);
        updateStatus(`Playing playlist: ${playlistName}`);
        
        // Set up playlist queue
        currentAlbum = {
            name: playlistName,
            tracks: playlist.tracks.map(t => t.videoId).filter(id => id && videoData[id])
        };
        currentTrackIndex = 0;
        
        // Display playlist UI
        displayUserPlaylist(playlist);
    } else {
        updateStatus('Track not found');
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
    
    const tracksHTML = playlist.tracks.map((track, index) => {
        const isCurrentTrack = currentAlbum && index === currentTrackIndex;
        return `
            <div class="playlist-track ${isCurrentTrack ? 'current-track' : ''}" 
                 style="padding: 5px; margin: 3px 0; background: ${isCurrentTrack ? '#FFFFCC' : '#F0F0F0'}; border: 1px solid #ccc; cursor: pointer; font-size: 11px;"
                 onclick="playTrackFromPlaylist(${index})"
                 onmouseover="if(!${isCurrentTrack}) this.style.background='#E0E0FF'"
                 onmouseout="if(!${isCurrentTrack}) this.style.background='#F0F0F0'">
                ${isCurrentTrack ? '▶ ' : ''}${index + 1}. ${track.title} - ${track.duration}
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
function playTrackFromPlaylist(index) {
    if (currentAlbum && currentAlbum.tracks && index >= 0 && index < currentAlbum.tracks.length) {
        currentTrackIndex = index;
        const videoId = currentAlbum.tracks[index];
        if (videoId && videoData[videoId]) {
            loadVideo(videoId);
            
            // Update playlist display
            const playlists = getUserPlaylists();
            const playlistName = currentAlbum.name;
            if (playlists[playlistName]) {
                displayUserPlaylist(playlists[playlistName]);
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
    const video = videoData[videoId];
    const allStats = getWigTubeProperty('videoStats') || {};
    const savedStats = allStats[videoId];
    
    if (savedStats) {
        return savedStats;
    } else {
        // Initialize with default values from videoData
        const initialStats = {
            viewCount: parseViewCount(video.views),
            views: video.views,
            ratingTotal: 0,
            ratingCount: video.ratingCount || 0,
            ratingStars: video.rating,
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
function rateVideo(videoId, rating) {
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
function setupRatingButtons() {
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
    `;
    
    ratingSection.appendChild(ratingContainer);
    
    // Add click handlers to rating buttons
    document.querySelectorAll('.rate-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            const videoId = getVideoIdFromURL();
            rateVideo(videoId, rating);
            
            // Disable all rating buttons after rating
            document.querySelectorAll('.rate-btn').forEach(b => {
                b.disabled = true;
                b.style.opacity = '0.5';
                b.style.cursor = 'not-allowed';
            });
            
            // Highlight selected rating
            this.style.background = '#90EE90';
            this.style.fontWeight = 'bold';
        });
        
        // Hover effect
        btn.addEventListener('mouseenter', function() {
            if (!this.disabled) {
                this.style.background = '#e0e0e0';
            }
        });
        
        btn.addEventListener('mouseleave', function() {
            if (!this.disabled && this.style.background !== 'rgb(144, 238, 144)') {
                this.style.background = 'white';
            }
        });
    });
    
    // Check if user already rated and disable buttons
    const videoId = getVideoIdFromURL();
    const stats = loadVideoStats(videoId);
    if (stats.userRating > 0) {
        document.querySelectorAll('.rate-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            
            if (parseInt(btn.getAttribute('data-rating')) === stats.userRating) {
                btn.style.background = '#90EE90';
                btn.style.fontWeight = 'bold';
            }
        });
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