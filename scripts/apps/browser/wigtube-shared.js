// WigTube Shared Utilities
// Shared functions used across wigtube.js and wigtube-player.js

// Debug mode - check URL parameter
if (typeof window.WIGTUBE_DEBUG === 'undefined') {
    window.WIGTUBE_DEBUG = new URLSearchParams(window.location.search).has('debug');
}

/**
 * Debug logging utility
 * Only define if not already defined by wigtube-db.js
 */
if (typeof window.debugLog === 'undefined') {
    window.debugLog = function(...args) {
        if (window.WIGTUBE_DEBUG) {
            console.log('[WigTube]', ...args);
        }
    };
}

/**
 * Get external video repository configuration
 * Default: Danie-GLR/Videoswigtube-EEEEEE (can be overridden via window globals or localStorage)
 */
function getVideoRepoConfig() {
    const owner = (window.WIGTUBE_VIDEO_REPO_OWNER || localStorage.getItem('VIDEO_REPO_OWNER') || 'Danie-GLR').trim();
    const name = (window.WIGTUBE_VIDEO_REPO_NAME || localStorage.getItem('VIDEO_REPO_NAME') || 'Videoswigtube-EEEEEE').trim();
    const branch = (window.WIGTUBE_VIDEO_REPO_BRANCH || localStorage.getItem('VIDEO_REPO_BRANCH') || 'main').trim();
    const folder = (window.WIGTUBE_VIDEO_FOLDER || localStorage.getItem('VIDEO_FOLDER') || 'videos').trim();
    return { owner, name, branch, folder };
}

/**
 * Generate external video URL from a relative path or return full URL if already absolute
 * @param {string} videoPath - The video path (relative or absolute URL)
 * @returns {string} The full video URL
 */
function generateVideoUrl(videoPath) {
    if (!videoPath) return '';
    
    // If it's already a full URL, return as-is
    if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        return videoPath;
    }
    
    // If it's a local asset path, try external repo first
    if (videoPath.startsWith('assets/')) {
        // Extract just the filename from the path
        const fileName = videoPath.split('/').pop();
        const { owner, name, branch, folder } = getVideoRepoConfig();
        
        // Construct external repository URL
        const externalUrl = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${folder}/${fileName}`;
        debugLog('Generating external video URL:', externalUrl);
        return externalUrl;
    }
    
    // Otherwise assume it's just a filename and construct external URL
    const { owner, name, branch, folder } = getVideoRepoConfig();
    return `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${folder}/${videoPath}`;
}

/**
 * Try to load video from multiple sources (external repo, then local fallback)
 * @param {HTMLVideoElement} videoElement - The video element to load
 * @param {string} primaryUrl - The primary URL to try
 * @param {string} fallbackPath - Optional local fallback path
 */
function loadVideoWithFallback(videoElement, primaryUrl, fallbackPath) {
    videoElement.src = primaryUrl;
    
    // If primary fails and we have a fallback, try it
    if (fallbackPath && fallbackPath.startsWith('assets/')) {
        const fallbackHandler = function(e) {
            debugLog('Primary URL failed, trying local fallback:', fallbackPath);
            console.log('Trying local fallback:', fallbackPath);
            videoElement.removeEventListener('error', fallbackHandler);
            videoElement.src = fallbackPath;
        };
        videoElement.addEventListener('error', fallbackHandler, { once: true });
    }
}
