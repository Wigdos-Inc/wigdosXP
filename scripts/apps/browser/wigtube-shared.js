// WigTube Shared Utilities
// Shared functions used across wigtube.js and wigtube-player.js

// ============================================
// Configuration
// ============================================

/**
 * WigTube Configuration
 * Cloudflare Worker URL for video uploads
 */
window.WIGTUBE_CONFIG = window.WIGTUBE_CONFIG || {};
window.WIGTUBE_CONFIG.workerUrl = window.WIGTUBE_CONFIG.workerUrl || 'https://wigtube-upload.102457.workers.dev';

// ============================================
// Debug Utilities
// ============================================

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
    
    // If it's a local asset path, use it directly from this repository
    if (videoPath.startsWith('assets/')) {
        debugLog('Using local asset path:', videoPath);
        return videoPath;
    }
    
    // Otherwise assume it's just a filename and construct external URL from video repo
    const { owner, name, branch, folder } = getVideoRepoConfig();
    const externalUrl = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${folder}/${videoPath}`;
    debugLog('Generating external video URL:', externalUrl);
    return externalUrl;
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

/**
 * Convert duration string to seconds
 * @param {string} duration - Duration string (e.g., "1:23" or "1:23:45")
 * @returns {number} Duration in seconds
 */
function durationToSeconds(duration) {
    const parts = duration.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
}

/**
 * Convert seconds to duration string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string (e.g., "1:23" or "1:23:45")
 */
function secondsToDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Load video data from JSON file
 * Loads wigtube-data.json and returns the parsed data
 * @param {string} jsonPath - Path to the JSON file (relative to current page)
 * @returns {Promise<Object|null>} Parsed video data or null if failed
 */
async function loadVideoDataFromJSON(jsonPath = 'scripts/apps/browser/wigtube-data.json') {
    try {
        const response = await fetch(jsonPath);
        const data = await response.json();
        debugLog('Video data loaded successfully:', data.videos?.length, 'videos');
        return data;
    } catch (error) {
        console.error('Error loading video data:', error);
        return null;
    }
}
