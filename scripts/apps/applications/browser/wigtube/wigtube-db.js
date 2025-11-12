// WigTube Database Integration - Firestore & localStorage fallback
// Manages video data, views, ratings, and comments

// Debug mode - check URL parameter
if (typeof window.WIGTUBE_DEBUG === 'undefined') {
    window.WIGTUBE_DEBUG = new URLSearchParams(window.location.search).has('debug');
}

function debugLog(...args) {
    if (window.WIGTUBE_DEBUG) {
        console.log('[WigTubeDB]', ...args);
    }
}

/**
 * WigTube Database API
 * Provides methods for video CRUD operations with Firestore backend
 * Falls back to localStorage when offline
 */
window.WigTubeDB = (function() {
    'use strict';

    // Use the same Firebase API that WigdOS uses
    let db = null;
    let dbCheckAttempted = false;
    const COLLECTION = 'wigtube_data';
    const STORAGE_KEY = 'wigtube_offline_data';
    
    /**
     * Get Firestore database instance (lazy initialization)
     */
    function getDB() {
        if (db) {
            debugLog('Returning cached Firestore instance');
            return db;
        }
        
        // Check if Firebase API is available (from firebaseconfig.js)
        if (typeof window.firebaseAPI !== 'undefined' && 
            window.firebaseAPI.db && 
            window.firebaseOnline === true) {
            db = window.firebaseAPI.db;
            
            // Only log once per session
            if (!dbCheckAttempted) {
                dbCheckAttempted = true;
                console.log('WigTubeDB: Connected to Firestore via firebaseAPI');
            }
            
            debugLog('Firebase API available, connected to Firestore');
            return db;
        }
        
        debugLog('Firebase API not available, using offline mode');
        return null;
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
            const parsed = data ? JSON.parse(data) : {};
            debugLog('Retrieved offline data:', Object.keys(parsed));
            return parsed;
        } catch (e) {
            console.error('Error reading offline data:', e);
            return {};
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
     * Format Firestore timestamp to readable string
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
        if (!ratings || ratings.length === 0) return '☆☆☆☆☆';
        
        const sum = ratings.reduce((acc, r) => acc + r, 0);
        const avg = sum / ratings.length;
        const roundedAvg = Math.round(avg);
        
        const fullStars = '★'.repeat(roundedAvg);
        const emptyStars = '☆'.repeat(5 - roundedAvg);
        
        return fullStars + emptyStars;
    }

    // ============================================
    // Video CRUD Operations
    // ============================================

    /**
     * Get all videos from Firestore
     */
    async function getAllVideos() {
        const db = getDB();
        if (!db) {
            debugLog('getAllVideos: Using offline data');
            console.log('Firestore not available, using offline data');
            const offlineData = getOfflineData();
            return Object.values(offlineData.videos || {});
        }

        try {
            debugLog('getAllVideos: Querying Firestore');
            const { collection, getDocs, query, where, orderBy } = window.firebaseAPI;
            
            const videosRef = collection(db, COLLECTION);
            const q = query(
                videosRef,
                where('visibility', '==', 'public'),
                orderBy('uploadDate', 'desc')
            );
            
            const snapshot = await getDocs(q);
            const videos = [];
            
            snapshot.forEach(doc => {
                videos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            debugLog(`getAllVideos: Retrieved ${videos.length} videos from Firestore`);
            return videos;
        } catch (error) {
            console.error('Error fetching videos from Firestore:', error);
            debugLog('getAllVideos: Falling back to offline data');
            // Fallback to offline data
            const offlineData = getOfflineData();
            return Object.values(offlineData.videos || {});
        }
    }

    /**
     * Get a single video by ID
     */
    async function getVideoById(videoId) {
        debugLog(`getVideoById: Fetching video ${videoId}`);
        const db = getDB();
        if (!db) {
            debugLog(`getVideoById: Using offline data for ${videoId}`);
            const offlineData = getOfflineData();
            return offlineData.videos?.[videoId] || null;
        }

        try {
            const { doc, getDoc } = window.firebaseAPI;
            const docRef = doc(db, COLLECTION, videoId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                debugLog(`getVideoById: Video ${videoId} not found in Firestore, checking offline`);
                console.log('Video not found in Firestore, checking offline data');
                const offlineData = getOfflineData();
                return offlineData.videos?.[videoId] || null;
            }

            const videoData = {
                id: docSnap.id,
                ...docSnap.data()
            };
            debugLog(`getVideoById: Retrieved video ${videoId} from Firestore`, videoData);
            return videoData;
        } catch (error) {
            console.error('Error fetching video:', error);
            debugLog(`getVideoById: Error, falling back to offline for ${videoId}`);
            const offlineData = getOfflineData();
            return offlineData.videos?.[videoId] || null;
        }
    }

    /**
     * Create a new video in Firestore
     */
    async function createVideo(videoData) {
        const db = getDB();
        
        const newVideo = {
            title: videoData.title || 'Untitled Video',
            description: videoData.description || '',
            uploaderId: videoData.uploaderId || 'anonymous',
            uploaderName: videoData.uploaderName || 'Anonymous User',
            uploadDate: db ? window.firebaseAPI.serverTimestamp() : new Date().toISOString(),
            viewCount: 0,
            ratings: [], // Array of 1-5 star ratings
            likeCount: 0,
            dislikeCount: 0,
            commentCount: 0,
            duration: videoData.duration || '0:00',
            thumbnail: videoData.thumbnail || 'assets/images/thumbnail/default.png',
            videoUrl: videoData.videoUrl || '',
            category: videoData.category || 'general',
            tags: videoData.tags || [],
            visibility: videoData.visibility || 'public'
        };

        if (!db) {
            // Save to offline storage
            const offlineData = getOfflineData();
            const videoId = 'video_' + Date.now();
            newVideo.id = videoId;
            newVideo.uploadDate = new Date().toISOString();
            
            if (!offlineData.videos) offlineData.videos = {};
            offlineData.videos[videoId] = newVideo;
            saveOfflineData(offlineData);
            
            return { id: videoId, ...newVideo };
        }

        try {
            const { collection, addDoc } = window.firebaseAPI;
            const colRef = collection(db, COLLECTION);
            const docRef = await addDoc(colRef, newVideo);
            return { id: docRef.id, ...newVideo };
        } catch (error) {
            console.error('Error creating video:', error);
            throw error;
        }
    }

    /**
     * Update video metadata
     */
    async function updateVideo(videoId, updates) {
        const db = getDB();
        if (!db) {
            const offlineData = getOfflineData();
            if (offlineData.videos?.[videoId]) {
                offlineData.videos[videoId] = {
                    ...offlineData.videos[videoId],
                    ...updates
                };
                saveOfflineData(offlineData);
                return true;
            }
            return false;
        }

        try {
            const { doc, updateDoc } = window.firebaseAPI;
            const docRef = doc(db, COLLECTION, videoId);
            await updateDoc(docRef, updates);
            return true;
        } catch (error) {
            console.error('Error updating video:', error);
            return false;
        }
    }

    /**
     * Delete a video
     */
    async function deleteVideo(videoId) {
        const db = getDB();
        if (!db) {
            const offlineData = getOfflineData();
            if (offlineData.videos?.[videoId]) {
                delete offlineData.videos[videoId];
                saveOfflineData(offlineData);
                return true;
            }
            return false;
        }

        try {
            const { doc, deleteDoc } = window.firebaseAPI;
            const docRef = doc(db, COLLECTION, videoId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error('Error deleting video:', error);
            return false;
        }
    }

    // ============================================
    // View Count Operations
    // ============================================

    /**
     * Increment view count for a video
     * @param {string} videoId - The video ID
     * @param {object} videoMetadata - Optional video metadata to create document if it doesn't exist
     */
    async function incrementViewCount(videoId, videoMetadata = null) {
        debugLog(`incrementViewCount: Starting for video ${videoId}`);
        const db = getDB();
        if (!db) {
            debugLog(`incrementViewCount: Using offline mode for ${videoId}`);
            const offlineData = getOfflineData();
            if (offlineData.videos?.[videoId]) {
                offlineData.videos[videoId].viewCount = (offlineData.videos[videoId].viewCount || 0) + 1;
                saveOfflineData(offlineData);
                debugLog(`incrementViewCount: Updated offline count to ${offlineData.videos[videoId].viewCount}`);
                return offlineData.videos[videoId].viewCount;
            }
            return 0;
        }

        try {
            const { doc, getDoc, setDoc, increment, serverTimestamp } = window.firebaseAPI;
            const docRef = doc(db, COLLECTION, videoId);
            
            debugLog(`incrementViewCount: Checking if document exists for ${videoId}`);
            // Check if document exists first
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                debugLog(`incrementViewCount: Document doesn't exist, creating for ${videoId}`);
                // Try to get video data from offline storage first
                const offlineData = getOfflineData();
                let videoData = offlineData.videos?.[videoId];
                
                // If not in offline storage but metadata provided, use that
                if (!videoData && videoMetadata) {
                    debugLog(`incrementViewCount: Using provided metadata for ${videoId}`);
                    videoData = {
                        title: videoMetadata.title || 'Untitled',
                        description: videoMetadata.description || '',
                        uploader: videoMetadata.uploader || 'Unknown',
                        uploadDate: videoMetadata.uploadDate || serverTimestamp(),
                        duration: videoMetadata.duration || '0:00',
                        thumbnail: videoMetadata.thumbnail || '',
                        videoFile: videoMetadata.videoFile || '',
                        visibility: 'public',
                        ratings: [],
                        viewCount: 1
                    };
                }
                
                if (videoData) {
                    // Ensure viewCount is set
                    if (!videoData.viewCount) {
                        videoData.viewCount = 1;
                    }
                    
                    // Create document with initial view count
                    await setDoc(docRef, videoData);
                    debugLog(`incrementViewCount: Created document for ${videoId} with count ${videoData.viewCount}`);
                    console.log(`Created Firestore document for video: ${videoId} with view count: ${videoData.viewCount}`);
                    return videoData.viewCount;
                } else {
                    console.warn(`Video ${videoId} not found in offline data or metadata not provided`);
                    debugLog(`incrementViewCount: No data available for ${videoId}`);
                    return 0;
                }
            } else {
                debugLog(`incrementViewCount: Document exists, incrementing count for ${videoId}`);
                // Document exists, increment the view count
                await setDoc(docRef, {
                    viewCount: increment(1)
                }, { merge: true });

                // Get updated count
                const updatedSnap = await getDoc(docRef);
                const newCount = updatedSnap.data()?.viewCount || 0;
                debugLog(`incrementViewCount: New count for ${videoId}: ${newCount}`);
                return newCount;
            }
        } catch (error) {
            console.error('Error incrementing view count:', error);
            debugLog(`incrementViewCount: Error for ${videoId}:`, error);
            return 0;
        }
    }

    /**
     * Get view count for a video
     */
    async function getViewCount(videoId) {
        const video = await getVideoById(videoId);
        return video?.viewCount || 0;
    }

    // ============================================
    // Rating Operations
    // ============================================

    /**
     * Add a rating to a video (1-5 stars)
     */
    async function addRating(videoId, rating, userId = 'anonymous') {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5 stars');
        }

        const db = getDB();
        if (!db) {
            const offlineData = getOfflineData();
            if (offlineData.videos?.[videoId]) {
                if (!offlineData.videos[videoId].ratings) {
                    offlineData.videos[videoId].ratings = [];
                }
                offlineData.videos[videoId].ratings.push(rating);
                
                // Store user rating to prevent duplicates
                if (!offlineData.userRatings) offlineData.userRatings = {};
                offlineData.userRatings[`${userId}_${videoId}`] = rating;
                
                saveOfflineData(offlineData);
                return offlineData.videos[videoId].ratings;
            }
            return [];
        }

        try {
            const { doc, updateDoc, arrayUnion, setDoc, serverTimestamp, getDoc } = window.firebaseAPI;
            const videoRef = doc(db, COLLECTION, videoId);
            
            // Add rating to array
            await updateDoc(videoRef, {
                ratings: arrayUnion(rating)
            });

            // Store user rating in separate collection to prevent duplicate ratings
            const userRatingRef = doc(db, 'wigtube_user_ratings', `${userId}_${videoId}`);
            await setDoc(userRatingRef, {
                userId: userId,
                videoId: videoId,
                rating: rating,
                timestamp: serverTimestamp()
            });

            // Get updated ratings
            const videoSnap = await getDoc(videoRef);
            return videoSnap.data()?.ratings || [];
        } catch (error) {
            console.error('Error adding rating:', error);
            throw error;
        }
    }

    /**
     * Get user's rating for a video
     */
    async function getUserRating(videoId, userId = 'anonymous') {
        const db = getDB();
        if (!db) {
            const offlineData = getOfflineData();
            return offlineData.userRatings?.[`${userId}_${videoId}`] || null;
        }

        try {
            const { doc, getDoc } = window.firebaseAPI;
            const userRatingRef = doc(db, 'wigtube_user_ratings', `${userId}_${videoId}`);
            const docSnap = await getDoc(userRatingRef);
            
            return docSnap.exists() ? docSnap.data().rating : null;
        } catch (error) {
            console.error('Error getting user rating:', error);
            return null;
        }
    }

    /**
     * Get average rating for a video
     */
    async function getAverageRating(videoId) {
        const video = await getVideoById(videoId);
        const ratings = video?.ratings || [];
        
        if (ratings.length === 0) return 0;
        
        const sum = ratings.reduce((acc, r) => acc + r, 0);
        return sum / ratings.length;
    }

    // ============================================
    // Comment Operations
    // ============================================

    /**
     * Add a comment to a video
     */
    async function addComment(videoId, commentData) {
        debugLog(`addComment: Adding comment to video ${videoId}`);
        const db = getDB();
        
        const comment = {
            videoId: videoId,
            author: commentData.author || 'Anonymous',
            text: commentData.text || '',
            image: commentData.image || null,
            timestamp: db ? window.firebaseAPI.serverTimestamp() : new Date().toISOString(),
            likes: 0
        };

        if (!db) {
            debugLog(`addComment: Using offline mode for ${videoId}`);
            const offlineData = getOfflineData();
            const commentId = 'comment_' + Date.now();
            comment.id = commentId;
            comment.timestamp = new Date().toISOString();
            
            if (!offlineData.comments) offlineData.comments = {};
            if (!offlineData.comments[videoId]) offlineData.comments[videoId] = [];
            offlineData.comments[videoId].unshift(comment);
            
            // Update comment count
            if (offlineData.videos?.[videoId]) {
                offlineData.videos[videoId].commentCount = (offlineData.videos[videoId].commentCount || 0) + 1;
            }
            
            saveOfflineData(offlineData);
            debugLog(`addComment: Saved offline comment ${commentId} for ${videoId}`);
            return comment;
        }

        try {
            debugLog(`addComment: Saving to Firestore for ${videoId}`);
            const { collection, addDoc, doc, getDoc, setDoc, increment } = window.firebaseAPI;
            
            // Add comment document
            const commentsRef = collection(db, 'wigtube_comments');
            const docRef = await addDoc(commentsRef, comment);
            
            debugLog(`addComment: Comment saved with ID ${docRef.id}`);
            
            // Increment comment count on video (use setDoc with merge to handle non-existent docs)
            const videoRef = doc(db, COLLECTION, videoId);
            
            try {
                await setDoc(videoRef, {
                    commentCount: increment(1)
                }, { merge: true });
                debugLog(`addComment: Updated comment count for ${videoId}`);
            } catch (updateError) {
                console.warn('Could not update comment count on video document:', updateError);
                debugLog(`addComment: Failed to update count for ${videoId}:`, updateError);
                // Comment was still added successfully, just couldn't update the count
            }

            return { id: docRef.id, ...comment };
        } catch (error) {
            console.error('Error adding comment:', error);
            debugLog(`addComment: Error for ${videoId}:`, error);
            throw error;
        }
    }

    /**
     * Get comments for a video
     */
    async function getComments(videoId, limit = 50) {
        debugLog(`getComments: Fetching comments for ${videoId}`);
        const db = getDB();
        if (!db) {
            debugLog(`getComments: Using offline data for ${videoId}`);
            const offlineData = getOfflineData();
            const comments = offlineData.comments?.[videoId] || [];
            debugLog(`getComments: Found ${comments.length} offline comments for ${videoId}`);
            return comments.slice(0, limit);
        }

        try {
            debugLog(`getComments: Querying Firestore for ${videoId}`);
            const { collection, query, where, orderBy, limit: firestoreLimit, getDocs } = window.firebaseAPI;
            
            const commentsRef = collection(db, 'wigtube_comments');
            const q = query(
                commentsRef,
                where('videoId', '==', videoId),
                orderBy('timestamp', 'desc'),
                firestoreLimit(limit)
            );
            
            const snapshot = await getDocs(q);
            const comments = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                // Convert Firestore Timestamp to milliseconds
                if (data.timestamp && typeof data.timestamp.toMillis === 'function') {
                    data.timestamp = data.timestamp.toMillis();
                } else if (data.timestamp && data.timestamp.seconds) {
                    // Alternative timestamp format
                    data.timestamp = data.timestamp.seconds * 1000;
                }
                
                comments.push({
                    id: doc.id,
                    ...data
                });
            });

            debugLog(`getComments: Retrieved ${comments.length} comments from Firestore for ${videoId}`);
            return comments;
        } catch (error) {
            console.error('Error fetching comments:', error);
            debugLog(`getComments: Error for ${videoId}, falling back to offline`);
            const offlineData = getOfflineData();
            return offlineData.comments?.[videoId] || [];
        }
    }

    /**
     * Delete a comment
     * @param {string} videoId - Video ID
     * @param {string} commentId - Comment document ID to delete
     */
    async function deleteComment(videoId, commentId) {
        debugLog(`deleteComment: Deleting comment ${commentId} from video ${videoId}`);
        const db = getDB();
        
        if (!db) {
            // Offline mode - delete from localStorage
            debugLog(`deleteComment: Using offline mode for ${videoId}`);
            const offlineData = getOfflineData();
            if (offlineData.comments?.[videoId]) {
                offlineData.comments[videoId] = offlineData.comments[videoId].filter(
                    comment => comment.id !== commentId
                );
                saveOfflineData(offlineData);
                debugLog(`deleteComment: Deleted offline comment ${commentId}`);
            }
            return;
        }

        try {
            debugLog(`deleteComment: Deleting from Firestore`);
            const { doc, deleteDoc, setDoc } = window.firebaseAPI;
            
            // Delete the comment document
            const commentRef = doc(db, 'wigtube_comments', commentId);
            await deleteDoc(commentRef);
            debugLog(`deleteComment: Comment ${commentId} deleted from Firestore`);
            
            // Update comment count in video document
            try {
                const videoRef = doc(db, COLLECTION, videoId);
                const currentVideo = await getVideoById(videoId);
                const currentCount = currentVideo.commentCount || 0;
                const newCount = Math.max(0, currentCount - 1);
                
                await setDoc(videoRef, {
                    commentCount: newCount
                }, { merge: true });
                
                debugLog(`deleteComment: Updated comment count for ${videoId} to ${newCount}`);
            } catch (updateError) {
                debugLog(`deleteComment: Failed to update count for ${videoId}:`, updateError);
            }
            
        } catch (error) {
            console.error('Error deleting comment:', error);
            debugLog(`deleteComment: Error for ${commentId}:`, error);
            throw error;
        }
    }

    // ============================================
    // Search Operations
    // ============================================

    /**
     * Search videos by title, description, or tags
     */
    async function searchVideos(query, options = {}) {
        const { category = null, sortBy = 'uploadDate', limit = 50 } = options;
        
        const db = getDB();
        if (!db) {
            const offlineData = getOfflineData();
            let videos = Object.values(offlineData.videos || {});
            
            // Filter by query
            if (query) {
                const lowerQuery = query.toLowerCase();
                videos = videos.filter(v => 
                    v.title?.toLowerCase().includes(lowerQuery) ||
                    v.description?.toLowerCase().includes(lowerQuery) ||
                    v.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
                );
            }
            
            // Filter by category
            if (category) {
                videos = videos.filter(v => v.category === category);
            }
            
            return videos.slice(0, limit);
        }

        try {
            const { collection, query: firestoreQuery, where, orderBy, limit: firestoreLimit, getDocs } = window.firebaseAPI;
            
            const videosRef = collection(db, COLLECTION);
            let q = firestoreQuery(
                videosRef,
                where('visibility', '==', 'public')
            );

            // Add category filter if specified
            if (category) {
                q = firestoreQuery(
                    videosRef,
                    where('visibility', '==', 'public'),
                    where('category', '==', category)
                );
            }

            // Note: Firestore doesn't support full-text search natively
            // For production, use Algolia or similar service
            q = firestoreQuery(
                videosRef,
                where('visibility', '==', 'public'),
                ...(category ? [where('category', '==', category)] : []),
                orderBy(sortBy, 'desc'),
                firestoreLimit(limit)
            );
            
            const snapshot = await getDocs(q);
            let videos = [];
            
            snapshot.forEach(doc => {
                videos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Client-side filtering for search query
            if (query) {
                const lowerQuery = query.toLowerCase();
                videos = videos.filter(v => 
                    v.title?.toLowerCase().includes(lowerQuery) ||
                    v.description?.toLowerCase().includes(lowerQuery) ||
                    v.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
                );
            }

            return videos;
        } catch (error) {
            console.error('Error searching videos:', error);
            return [];
        }
    }

    // ============================================
    // Public API
    // ============================================

    return {
        // Video operations
        getAllVideos,
        getVideoById,
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
        
        // Comment operations
        addComment,
        getComments,
        deleteComment,
        
        // Search operations
        searchVideos,
        
        // Utility functions
        formatTimestamp,
        formatViewCount,
        calculateStarRating,
        
        // State
        isOnline: () => getDB() !== null
    };
})();

console.log('WigTube Database API loaded');
// Log connection status after Firebase has time to initialize
setTimeout(() => {
    const status = window.WigTubeDB.isOnline() ? 'Online (Firestore)' : 'Offline (localStorage)';
    console.log('WigTubeDB Status:', status);
}, 1500);
