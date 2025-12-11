// WigTube Database Integration - MySQL API Backend
// Manages video data, views, ratings, and comments

// Debug mode - check URL parameter
if (typeof window.WIGTUBE_DEBUG === 'undefined') {
    window.WIGTUBE_DEBUG = new URLSearchParams(window.location.search).has('debug');
}

function debugLog(...args) {
    if (window.WIGTUBE_DEBUG) {
        console.log('[WigTubeDB-MySQL]', ...args);
    }
}

/**
 * WigTube Database API - MySQL Backend
 * Provides methods for video CRUD operations with MySQL backend
 * Falls back to localStorage when API is offline
 */
window.WigTubeDB = (function() {
    'use strict';

    const API_URL = 'http://localhost:3002/api';
    const STORAGE_KEY = 'wigtube_offline_data';
    let apiAvailable = null; // null = not checked, true/false after check
    
    /**
     * Check if API is available
     */
    async function checkAPI() {
        if (apiAvailable !== null) {
            return apiAvailable;
        }
        
        try {
            const response = await fetch(`${API_URL}/../health`, { 
                method: 'GET',
                timeout: 2000 
            });
            apiAvailable = response.ok;
            if (apiAvailable) {
                console.log('WigTubeDB: Connected to MySQL API');
            }
        } catch (error) {
            apiAvailable = false;
            console.log('WigTubeDB: API not available, using offline mode');
        }
        
        return apiAvailable;
    }

    // ============================================
    // Helper Functions
    // ============================================

    /**
     * Get offline data from localStorage
     */
    function getOfflineData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            const parsed = data ? JSON.parse(data) : { videos: [], ratings: {}, comments: {} };
            debugLog('Retrieved offline data:', Object.keys(parsed));
            return parsed;
        } catch (e) {
            console.error('Error reading offline data:', e);
            return { videos: [], ratings: {}, comments: {} };
        }
    }

    /**
     * Save offline data to localStorage
     */
    function saveOfflineData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            debugLog('Saved offline data:', Object.keys(data));
        } catch (e) {
            console.error('Error saving offline data:', e);
        }
    }

    /**
     * Format timestamp to readable string
     */
    function formatTimestamp(timestamp) {
        if (!timestamp) return 'Just now';
        
        const date = new Date(typeof timestamp === 'number' ? timestamp : timestamp);
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
     */
    function calculateStarRating(ratings) {
        if (!ratings || Object.keys(ratings).length === 0) return '☆☆☆☆☆';
        
        const values = Object.values(ratings);
        const sum = values.reduce((acc, r) => acc + r, 0);
        const avg = sum / values.length;
        const roundedAvg = Math.round(avg);
        
        const fullStars = '★'.repeat(roundedAvg);
        const emptyStars = '☆'.repeat(5 - roundedAvg);
        
        return fullStars + emptyStars;
    }

    // ============================================
    // Video CRUD Operations
    // ============================================

    /**
     * Get all videos from MySQL API
     */
    async function getAllVideos() {
        try {
            const response = await fetch(`${API_URL}/videos`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const videos = await response.json();
            debugLog('Fetched videos:', videos.length);
            
            // Save to offline cache
            const offlineData = getOfflineData();
            offlineData.videos = videos;
            saveOfflineData(offlineData);
            
            return videos;
        } catch (error) {
            console.error('Error fetching videos from API, using offline data:', error);
            const offlineData = getOfflineData();
            return offlineData.videos || [];
        }
    }

    /**
     * Get video by ID
     */
    async function getVideoById(videoId) {
        try {
            const response = await fetch(`${API_URL}/videos/${videoId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.error('Video not found:', videoId);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const video = await response.json();
            debugLog('Fetched video:', video.id);
            return video;
        } catch (error) {
            console.error('Error fetching video from API:', error);
            
            // Try offline data
            const offlineData = getOfflineData();
            const video = offlineData.videos?.find(v => v.id === videoId);
            return video || null;
        }
    }

    /**
     * Get videos by uploader
     */
    async function getVideosByUploader(uploaderId) {
        try {
            const response = await fetch(`${API_URL}/videos/uploader/${uploaderId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const videos = await response.json();
            debugLog('Fetched videos for uploader:', uploaderId, videos.length);
            return videos;
        } catch (error) {
            console.error('Error fetching videos by uploader:', error);
            
            // Try offline data
            const offlineData = getOfflineData();
            return offlineData.videos?.filter(v => v.uploader_id === uploaderId) || [];
        }
    }

    /**
     * Create a new video
     */
    async function createVideo(videoData) {
        try {
            const response = await fetch(`${API_URL}/videos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: videoData.title,
                    description: videoData.description,
                    uploaderId: videoData.uploaderId,
                    uploaderName: videoData.uploaderName,
                    duration: videoData.duration,
                    thumbnail: videoData.thumbnail,
                    videoUrl: videoData.videoUrl,
                    category: videoData.category || 'Other',
                    tags: videoData.tags || [],
                    visibility: videoData.visibility || 'public'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            debugLog('Video created with ID:', result.id);
            
            // Add to offline cache
            const offlineData = getOfflineData();
            if (!offlineData.videos) offlineData.videos = [];
            offlineData.videos.push({
                id: result.id,
                ...videoData,
                upload_date: Date.now(),
                view_count: 0
            });
            saveOfflineData(offlineData);
            
            return result.id;
        } catch (error) {
            console.error('Error creating video:', error);
            throw error;
        }
    }

    /**
     * Update video (placeholder for future use)
     */
    async function updateVideo(videoId, updateData) {
        // TODO: Implement update endpoint if needed
        console.warn('updateVideo not yet implemented for MySQL backend');
        return false;
    }

    /**
     * Delete a video
     */
    async function deleteVideo(videoId) {
        try {
            const response = await fetch(`${API_URL}/videos/${videoId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            debugLog('Video deleted:', videoId);
            
            // Remove from offline cache
            const offlineData = getOfflineData();
            if (offlineData.videos) {
                offlineData.videos = offlineData.videos.filter(v => v.id !== videoId);
                saveOfflineData(offlineData);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting video:', error);
            throw error;
        }
    }

    // ============================================
    // View Operations
    // ============================================

    /**
     * Increment view count
     */
    async function incrementViewCount(videoId) {
        try {
            const response = await fetch(`${API_URL}/videos/${videoId}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            debugLog('View count incremented for:', videoId);
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    }

    /**
     * Get view count for a video
     */
    async function getViewCount(videoId) {
        const video = await getVideoById(videoId);
        return video ? (video.view_count || 0) : 0;
    }

    // ============================================
    // Rating Operations
    // ============================================

    /**
     * Add or update a rating
     */
    async function addRating(videoId, rating) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                console.warn('Guest users cannot rate videos');
                return false;
            }
            
            const response = await fetch(`${API_URL}/videos/${videoId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: username,
                    rating: rating
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            debugLog('Rating added:', videoId, username, rating);
            return true;
        } catch (error) {
            console.error('Error adding rating:', error);
            return false;
        }
    }

    /**
     * Get user's rating for a video
     */
    async function getUserRating(videoId) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                return 0;
            }
            
            const response = await fetch(`${API_URL}/videos/${videoId}/ratings`);
            
            if (!response.ok) {
                return 0;
            }
            
            const ratings = await response.json();
            return ratings[username] || 0;
        } catch (error) {
            console.error('Error getting user rating:', error);
            return 0;
        }
    }

    /**
     * Get average rating for a video
     */
    async function getAverageRating(videoId) {
        try {
            const response = await fetch(`${API_URL}/videos/${videoId}/ratings`);
            
            if (!response.ok) {
                return 0;
            }
            
            const ratings = await response.json();
            const values = Object.values(ratings);
            
            if (values.length === 0) return 0;
            
            const sum = values.reduce((acc, r) => acc + r, 0);
            return sum / values.length;
        } catch (error) {
            console.error('Error getting average rating:', error);
            return 0;
        }
    }

    /**
     * Get all ratings for a video
     */
    async function getAllRatings(videoId) {
        try {
            const response = await fetch(`${API_URL}/videos/${videoId}/ratings`);
            
            if (!response.ok) {
                return {};
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error getting all ratings:', error);
            return {};
        }
    }

    // ============================================
    // Comment Operations (localStorage only for now)
    // ============================================

    /**
     * Add a comment to a video
     */
    function addComment(videoId, commentText, commentImage = null) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                console.warn('Guest users cannot comment');
                return false;
            }
            
            const commentsKey = `wigtube_comments_${videoId}`;
            const comments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
            
            const comment = {
                id: 'comment_' + Date.now(),
                username: username,
                text: commentText,
                image: commentImage,
                timestamp: Date.now()
            };
            
            comments.push(comment);
            localStorage.setItem(commentsKey, JSON.stringify(comments));
            debugLog('Comment added to', videoId);
            return comment;
        } catch (error) {
            console.error('Error adding comment:', error);
            return false;
        }
    }

    /**
     * Get comments for a video
     */
    function getComments(videoId) {
        try {
            const commentsKey = `wigtube_comments_${videoId}`;
            return JSON.parse(localStorage.getItem(commentsKey) || '[]');
        } catch (error) {
            console.error('Error getting comments:', error);
            return [];
        }
    }

    /**
     * Delete a comment
     */
    function deleteComment(videoId, commentId) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            const commentsKey = `wigtube_comments_${videoId}`;
            let comments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
            
            comments = comments.filter(c => !(c.id === commentId && c.username === username));
            localStorage.setItem(commentsKey, JSON.stringify(comments));
            debugLog('Comment deleted:', commentId);
            return true;
        } catch (error) {
            console.error('Error deleting comment:', error);
            return false;
        }
    }

    // ============================================
    // Search Operations
    // ============================================

    /**
     * Search videos by title, description, or tags
     */
    async function searchVideos(query) {
        const allVideos = await getAllVideos();
        const lowerQuery = query.toLowerCase();
        
        return allVideos.filter(video => {
            const titleMatch = video.title?.toLowerCase().includes(lowerQuery);
            const descMatch = video.description?.toLowerCase().includes(lowerQuery);
            const tagMatch = video.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
            const uploaderMatch = video.uploader_name?.toLowerCase().includes(lowerQuery);
            
            return titleMatch || descMatch || tagMatch || uploaderMatch;
        });
    }

    // ============================================
    // Watch History (localStorage only)
    // ============================================

    /**
     * Add video to watch history
     */
    function addToHistory(videoId, videoTitle, thumbnail) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                return false;
            }
            
            const historyKey = `wigtube_history_${username}`;
            let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            
            // Remove if already exists (to move to front)
            history = history.filter(item => item.videoId !== videoId);
            
            // Add to front
            history.unshift({
                videoId,
                videoTitle,
                thumbnail,
                timestamp: Date.now()
            });
            
            // Keep only last 50 items
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            localStorage.setItem(historyKey, JSON.stringify(history));
            debugLog('Added to history:', videoId);
            return true;
        } catch (error) {
            console.error('Error adding to history:', error);
            return false;
        }
    }

    /**
     * Get watch history
     */
    function getHistory() {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                return [];
            }
            
            const historyKey = `wigtube_history_${username}`;
            return JSON.parse(localStorage.getItem(historyKey) || '[]');
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    }

    /**
     * Clear watch history
     */
    function clearHistory() {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                return false;
            }
            
            const historyKey = `wigtube_history_${username}`;
            localStorage.removeItem(historyKey);
            debugLog('History cleared for', username);
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    }

    // ============================================
    // Favorites (localStorage + MySQL API)
    // ============================================

    /**
     * Add video to favorites
     */
    async function addToFavorites(videoId, videoTitle, thumbnail) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                console.warn('Guest users cannot favorite videos');
                return false;
            }
            
            // Store in localStorage for quick access
            const favoritesKey = `wigtube_favorites_${username}`;
            let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
            
            if (!favorites.some(f => f.videoId === videoId)) {
                favorites.push({
                    videoId,
                    videoTitle,
                    thumbnail,
                    timestamp: Date.now()
                });
                localStorage.setItem(favoritesKey, JSON.stringify(favorites));
            }
            
            // Also store in MySQL API
            const response = await fetch(`${API_URL}/favorites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: username,
                    videoId: videoId
                })
            });
            
            debugLog('Added to favorites:', videoId);
            return true;
        } catch (error) {
            console.error('Error adding to favorites:', error);
            return false;
        }
    }

    /**
     * Remove video from favorites
     */
    async function removeFromFavorites(videoId) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                return false;
            }
            
            // Remove from localStorage
            const favoritesKey = `wigtube_favorites_${username}`;
            let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
            favorites = favorites.filter(item => item.videoId !== videoId);
            localStorage.setItem(favoritesKey, JSON.stringify(favorites));
            
            // Remove from MySQL API
            await fetch(`${API_URL}/favorites/${username}/${videoId}`, {
                method: 'DELETE'
            });
            
            debugLog('Removed from favorites:', videoId);
            return true;
        } catch (error) {
            console.error('Error removing from favorites:', error);
            return false;
        }
    }

    /**
     * Get user's favorites
     */
    function getFavorites() {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                return [];
            }
            
            const favoritesKey = `wigtube_favorites_${username}`;
            return JSON.parse(localStorage.getItem(favoritesKey) || '[]');
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    }

    /**
     * Check if video is favorited
     */
    function isFavorited(videoId) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                return false;
            }
            
            const favoritesKey = `wigtube_favorites_${username}`;
            const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
            return favorites.some(item => item.videoId === videoId);
        } catch (error) {
            console.error('Error checking favorites:', error);
            return false;
        }
    }

    // ============================================
    // Public API
    // ============================================

    return {
        // Video operations
        getAllVideos,
        getVideoById,
        getVideosByUploader,
        createVideo,
        updateVideo,
        deleteVideo,
        
        // View operations
        incrementViewCount,
        getViewCount,
        
        // Rating operations
        addRating,
        getUserRating,
        getAverageRating,
        getAllRatings,
        
        // Comment operations
        addComment,
        getComments,
        deleteComment,
        
        // Search operations
        searchVideos,
        
        // Watch history operations
        addToHistory,
        getHistory,
        clearHistory,
        
        // Favorites operations
        addToFavorites,
        removeFromFavorites,
        getFavorites,
        isFavorited,
        
        // Utility functions
        formatTimestamp,
        formatViewCount,
        calculateStarRating,
        
        // State
        isOnline: () => apiAvailable === true,
        checkAPI
    };
})();

console.log('WigTube Database API (MySQL) loaded');
// Check API status
setTimeout(async () => {
    await window.WigTubeDB.checkAPI();
    const status = window.WigTubeDB.isOnline() ? 'Online (MySQL API)' : 'Offline (localStorage)';
    console.log('WigTubeDB Status:', status);
}, 500);
