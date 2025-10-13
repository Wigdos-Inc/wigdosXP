// WigTube Video Player JavaScript - 2003 YouTube Style

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
    'persona-5-best-moments': {
        title: 'Persona 5 Best Moments',
        uploader: 'WigGaming',
        uploadDate: '1 week ago',
        duration: '5:42',
        views: '23,891 views',
        rating: '★★★★★',
        ratingCount: 89,
        description: 'A compilation of the best and most memorable moments from Persona 5! This JRPG masterpiece has so many incredible scenes that it was hard to narrow it down.\n\nHighlights include:\n• Kamoshida\'s confession\n• The first Palace infiltration\n• Joker\'s awakening scene\n• Best friendship moments\n• Epic boss battles\n\nPersona 5 truly revolutionized the JRPG genre with its stylish presentation, engaging story, and unforgettable characters. The Phantom Thieves will steal your heart!\n\nWhat\'s your favorite Persona 5 moment? Let me know in the comments!',
        videoFile: 'assets/videos/persona5_opening.mp4',
        thumbnail: 'assets/images/thumbnail/eggman.png'
    },
    'deltarune-chapter-3-theories': {
        title: 'DELTARUNE Chapter 3 Theories',
        uploader: 'WigTheory',
        uploadDate: '2 days ago',
        duration: '15:33',
        views: '67,542 views',
        rating: '★★★★☆',
        ratingCount: 203,
        description: 'Deep dive into the most compelling theories about DELTARUNE Chapter 3! Toby Fox has left us so many clues and mysteries to unpack.\n\nTheories covered:\n• The TV World connection\n• Tenna as the main antagonist\n• Kris\'s true nature and the Soul\n• The Angel\'s prophecy\n• Connection to Undertale timeline\n• Secret bosses predictions\n\nWith the latest teasers and hints from Toby Fox, we\'re getting closer to understanding the bigger picture. The TV theme seems to be central to Chapter 3, and I have some wild theories about what that means for our heroes.\n\nMake sure to watch until the end for my boldest prediction about the chapter\'s release!\n\nWhat do you think will happen in Chapter 3? Share your theories below!',
        videoFile: 'assets/videos/tenna_battle.mp4',
        thumbnail: 'assets/images/thumbnail/deltarrune.png'
    },
    'chill-beats-mix-vol-12': {
        title: 'Chill Beats Mix Vol. 12',
        uploader: 'WigBeats',
        uploadDate: '5 days ago',
        duration: '3:47',
        views: '12,456 views',
        rating: '★★★☆☆',
        ratingCount: 31,
        description: 'Another relaxing beats mix for studying, working, or just chilling out. This volume features a selection of lo-fi hip hop tracks perfect for background listening.\n\nTracklist:\n1. Midnight Study Session\n2. Rain on Windows\n3. Coffee Shop Vibes\n4. Nostalgic Dreams\n5. City Lights\n6. Peaceful Moments\n\nAll beats are original compositions created using various vintage synthesizers and drum machines to achieve that authentic lo-fi sound.\n\nPerfect for:\n• Studying\n• Working\n• Meditation\n• Background music\n• Relaxation\n\nDrop a comment if you\'d like to see specific themes in future volumes!',
        videoFile: 'assets/audio/music/mc_c418.mp3',
        thumbnail: 'assets/images/thumbnail/beats.png'
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
    'roaring-twenties-documentary': {
        title: 'The Roaring Twenties Documentary',
        uploader: 'WigHistory',
        uploadDate: '6 days ago',
        duration: '45:12',
        views: '15,789 views',
        rating: '★★★★★',
        ratingCount: 34,
        description: 'A comprehensive look at one of the most vibrant decades in American history. The 1920s brought unprecedented economic prosperity, cultural innovation, and social change.\n\nTopics covered:\n• Jazz Age music and culture\n• Prohibition and its effects\n• Women\'s rights and fashion\n• Economic boom and speculation\n• Art and literature renaissance\n• Technology and modernization\n\nFeaturing rare archival footage, expert interviews, and fascinating historical insights. Discover how the Roaring Twenties shaped modern America and set the stage for dramatic changes ahead.\n\nThis documentary is perfect for history students, educators, and anyone interested in understanding this pivotal period in American culture.',
        videoFile: null,
        thumbnail: 'assets/images/thumbnail/roaring.png'
    },
    'mystery-review-episode-1': {
        title: 'Mystery Review Episode 1',
        uploader: 'MrWigReviews',
        uploadDate: '2 weeks ago',
        duration: '12:34',
        views: '98,234 views',
        rating: '★★★★☆',
        ratingCount: 156,
        description: 'Welcome to Mystery Review, where we dive deep into the most puzzling cases, unsolved mysteries, and bizarre phenomena from around the world.\n\nIn this inaugural episode:\n• The vanishing of Amelia Earhart\n• Strange radio signals from space\n• Unexplained historical artifacts\n• Modern mystery disappearances\n\nJoin me as we examine the evidence, explore theories, and try to separate fact from fiction. Each episode brings you closer to the truth behind history\'s most perplexing mysteries.\n\nSubscribe for weekly mystery content and let me know in the comments what mysteries you\'d like to see covered next!',
        videoFile: null,
        thumbnail: 'assets/images/thumbnail/mr.png'
    }
};

// Related videos for the sidebar - using proper thumbnails from main wigtube data
const relatedVideos = [
    {
        id: 'persona-5-best-moments',
        title: 'Persona 5 Best Moments',
        uploader: 'WigGaming',
        duration: '5:42',
        thumbnail: 'assets/images/thumbnail/eggman.png'
    },
    {
        id: 'deltarune-chapter-3-theories',
        title: 'DELTARUNE Chapter 3 Theories',
        uploader: 'WigTheory', 
        duration: '15:33',
        thumbnail: 'assets/images/thumbnail/deltarrune.png'
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
        id: 'roaring-twenties-documentary',
        title: 'The Roaring Twenties Documentary',
        uploader: 'WigHistory',
        duration: '45:12',
        thumbnail: 'assets/images/thumbnail/roaring.png'
    },
    {
        id: 'mystery-review-episode-1',
        title: 'Mystery Review Episode 1',
        uploader: 'MrWigReviews',
        duration: '12:34',
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

document.addEventListener('DOMContentLoaded', function() {
    initializePlayer();
    loadVideoFromURL();
    setupEventListeners();
    populateRelatedVideos();
    loadComments(); // Load saved comments
});

function initializePlayer() {
    // Get video ID from URL parameters or default
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v') || 'epic-minecraft-castle-build';
    
    loadVideo(videoId);
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
    
    // Update video information
    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('uploader').textContent = video.uploader;
    document.getElementById('uploadDate').textContent = video.uploadDate;
    document.getElementById('viewCount').textContent = video.views;
    document.getElementById('rating').textContent = video.rating;
    document.getElementById('ratingCount').textContent = video.ratingCount;
    document.getElementById('videoDescription').textContent = video.description;
    document.getElementById('totalTime').textContent = video.duration;
    
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
    
    // Start video simulation
    startVideoSimulation();
    
    // Update status
    statusText.textContent = `Playing: ${currentVideo.title}`;
    
    // Try to play actual video if available
    if (currentVideo.videoFile) {
        createVideoElement();
    }
}

function pauseVideo() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const statusText = document.getElementById('statusText');
    
    isPlaying = false;
    playPauseBtn.textContent = 'Play';
    statusText.textContent = `Paused: ${currentVideo.title}`;
    
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
    
    videoElement = document.createElement('video');
    videoElement.src = currentVideo.videoFile;
    videoElement.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
    videoElement.controls = false; // We handle controls ourselves
    
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
        stopVideo();
        updateStatus('Video ended');
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
        
        // Simulate playback
        const simulateInterval = setInterval(() => {
            if (!isPlaying) {
                clearInterval(simulateInterval);
                return;
            }
            
            currentTime += 0.5; // Update every 500ms
            
            if (currentTime >= duration) {
                currentTime = duration;
                clearInterval(simulateInterval);
                stopVideo();
                updateStatus('Video ended');
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
    // Get current favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem('wigtube_favorites') || '[]');
    
    // Check if already in favorites
    if (favorites.includes(videoId)) {
        updateStatus('Video already in favorites');
        return;
    }
    
    // Add to favorites
    favorites.push(videoId);
    localStorage.setItem('wigtube_favorites', JSON.stringify(favorites));
    
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
    // Store flag in localStorage (simulated reporting system)
    let flaggedVideos = JSON.parse(localStorage.getItem('wigtube_flagged') || '[]');
    
    if (flaggedVideos.includes(videoId)) {
        updateStatus('Video already flagged for review');
        return;
    }
    
    flaggedVideos.push({
        videoId: videoId,
        timestamp: Date.now(),
        title: currentVideo.title
    });
    
    localStorage.setItem('wigtube_flagged', JSON.stringify(flaggedVideos));
    
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
    const comments = JSON.parse(localStorage.getItem(`wigtube_comments_${videoId}`) || '[]');
    
    comments.unshift({
        text: text,
        image: imageData,
        time: timeString,
        author: 'Guest User',
        timestamp: Date.now()
    });
    
    // Keep only last 50 comments to prevent localStorage bloat
    if (comments.length > 50) {
        comments.splice(50);
    }
    
    localStorage.setItem(`wigtube_comments_${videoId}`, JSON.stringify(comments));
}

function loadComments() {
    const videoId = getVideoIdFromURL();
    const comments = JSON.parse(localStorage.getItem(`wigtube_comments_${videoId}`) || '[]');
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