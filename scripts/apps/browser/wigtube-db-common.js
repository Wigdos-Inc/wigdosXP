// WigTube Database Common Utilities
// Shared helper functions for WigTube database operations

/**
 * Storage key for offline data
 */
const STORAGE_KEY = 'wigtube_offline_data';

/**
 * Rating constants
 */
const MIN_RATING = 0;
const MAX_RATING = 5;

/**
 * Get offline data from localStorage
 * @returns {Object} Parsed offline data or default empty structure
 */
function getOfflineData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const parsed = data ? JSON.parse(data) : {};
        return parsed;
    } catch (e) {
        console.error('Error reading offline data:', e);
        return {};
    }
}

/**
 * Save offline data to localStorage
 * @param {Object} data - Data to save to localStorage
 */
function saveOfflineData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving offline data:', e);
    }
}

/**
 * Format Firestore timestamp to readable string
 * @param {*} timestamp - Firestore timestamp or Date object
 * @returns {string} Formatted relative time string
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Format view count to readable string
 * @param {number} count - Number of views
 * @returns {string} Formatted view count (e.g., "1.2K views")
 */
function formatViewCount(count) {
    if (count === 0) return '0 views';
    if (count === 1) return '1 view';
    if (count < 1000) return `${count} views`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K views`;
    if (count < 1000000000) return `${(count / 1000000).toFixed(1)}M views`;
    return `${(count / 1000000000).toFixed(1)}B views`;
}

/**
 * Calculate average rating and return star string
 * @param {Array|Object} ratings - Array of ratings or Object with ratings as values
 * @returns {string} Star rating string (e.g., "★★★☆☆")
 */
function calculateStarRating(ratings) {
    let values;
    
    // Handle both array and object formats
    if (Array.isArray(ratings)) {
        if (ratings.length === 0) return '☆☆☆☆☆';
        values = ratings;
    } else if (typeof ratings === 'object' && ratings !== null) {
        const keys = Object.keys(ratings);
        if (keys.length === 0) return '☆☆☆☆☆';
        values = Object.values(ratings);
    } else {
        return '☆☆☆☆☆';
    }
    
    const sum = values.reduce((acc, r) => acc + r, 0);
    const avg = sum / values.length;
    // Clamp rating between MIN_RATING and MAX_RATING
    const roundedAvg = Math.max(MIN_RATING, Math.min(MAX_RATING, Math.round(avg)));
    
    const fullStars = '★'.repeat(roundedAvg);
    const emptyStars = '☆'.repeat(MAX_RATING - roundedAvg);
    
    return fullStars + emptyStars;
}

// Export functions to window object for use across scripts
if (typeof window !== 'undefined') {
    window.WigTubeDBCommon = {
        getOfflineData,
        saveOfflineData,
        formatTimestamp,
        formatViewCount,
        calculateStarRating,
        STORAGE_KEY
    };
}
