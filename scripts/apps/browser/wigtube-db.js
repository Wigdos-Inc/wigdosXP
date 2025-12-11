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
    const COLLECTION = 'wigtube';
    const DATA_DOC = 'data';
    const COMMENTS_DOC = 'wigtube_comments';
    const RATINGS_DOC = 'user_ratings';
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
            debugLog('getAllVideos: Querying Firestore subcollection');
            const { collection, getDocs, query, where, orderBy } = window.firebaseAPI;
            
            const videosCollectionRef = collection(db, COLLECTION, DATA_DOC, 'videos');
            const q = query(videosCollectionRef, where('visibility', '==', 'public'));
            const querySnapshot = await getDocs(q);
            
            const videos = [];
            querySnapshot.forEach((doc) => {
                videos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Sort by upload date
            videos.sort((a, b) => {
                const dateA = a.uploadDate || 0;
                const dateB = b.uploadDate || 0;
                return dateB - dateA;
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
     * Get videos by uploader
     */
    async function getVideosByUploader(uploaderId) {
        const allVideos = await getAllVideos();
        return allVideos.filter(video => 
            video.uploaderId === uploaderId || video.uploaderName === uploaderId
        );
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
            console.debug('[WigTubeDB] getVideoById: Fetching from subcollection for:', videoId);
            const { doc, getDoc, collection } = window.firebaseAPI;
            
            const videosCollectionRef = collection(db, COLLECTION, DATA_DOC, 'videos');
            const videoDocRef = doc(videosCollectionRef, videoId);
            const docSnap = await getDoc(videoDocRef);
            
            if (docSnap.exists()) {
                const videoData = {
                    id: videoId,
                    ...docSnap.data()
                };
                debugLog(`getVideoById: Retrieved video ${videoId} from Firestore`, videoData);
                console.debug('[WigTubeDB] Video found:', videoId);
                return videoData;
            }
            
            debugLog(`getVideoById: Video ${videoId} not found in Firestore`);
            console.debug('[WigTubeDB] Video document does not exist, checking offline');
            const offlineData = getOfflineData();
            return offlineData.videos?.[videoId] || null;
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
            uploadDate: Date.now(), // Use timestamp instead of serverTimestamp for nested objects
            viewCount: 0,
            userRatings: {}, // Map of userId -> rating (1-5)
            likeCount: 0,
            dislikeCount: 0,
            commentCount: 0,
            duration: videoData.duration || '0:00',
            thumbnail: videoData.thumbnail || 'assets/images/thumbnail/nothtml.png',
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
            const { doc, setDoc, collection, addDoc } = window.firebaseAPI;
            const videoId = 'video_' + Date.now();
            
            // Store each video as a separate document in a subcollection
            const videosCollectionRef = collection(db, COLLECTION, DATA_DOC, 'videos');
            const videoDocRef = doc(videosCollectionRef, videoId);
            
            // Add video with its ID
            await setDoc(videoDocRef, newVideo);
            
            return { id: videoId, ...newVideo };
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
            const { doc, getDoc, updateDoc, collection } = window.firebaseAPI;
            const videosCollectionRef = collection(db, COLLECTION, DATA_DOC, 'videos');
            const videoDocRef = doc(videosCollectionRef, videoId);
            
            // Check if video exists
            const docSnap = await getDoc(videoDocRef);
            if (!docSnap.exists()) return false;
            
            // Update video document
            await updateDoc(videoDocRef, updates);
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
            const { doc, deleteDoc, collection } = window.firebaseAPI;
            
            // Delete video document from subcollection
            const videosCollectionRef = collection(db, COLLECTION, DATA_DOC, 'videos');
            const videoDocRef = doc(videosCollectionRef, videoId);
            
            console.log('Deleting video from Firebase subcollection:', videoId);
            await deleteDoc(videoDocRef);
            
            console.log('Video deleted successfully from Firebase');
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
        console.debug('[WigTubeDB] incrementViewCount called for:', videoId, 'metadata:', !!videoMetadata);
        const db = getDB();
        if (!db) {
            debugLog(`incrementViewCount: Using offline mode for ${videoId}`);
            console.debug('[WigTubeDB] Using offline mode for view count');
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
            console.debug('[WigTubeDB] Accessing Firebase subcollection');
            const { doc, setDoc, getDoc, collection, updateDoc, increment } = window.firebaseAPI;
            
            const videosCollectionRef = collection(db, COLLECTION, DATA_DOC, 'videos');
            const videoDocRef = doc(videosCollectionRef, videoId);
            const docSnap = await getDoc(videoDocRef);
            
            if (!docSnap.exists() && videoMetadata) {
                // Video doesn't exist, create it with metadata
                debugLog(`incrementViewCount: Creating new video entry for ${videoId}`);
                console.debug('[WigTubeDB] Creating new video entry with metadata');
                await setDoc(videoDocRef, {
                    ...videoMetadata,
                    viewCount: 1
                });
                debugLog(`incrementViewCount: Created entry with view count 1`);
                console.debug('[WigTubeDB] Video created with viewCount: 1');
                return 1;
            } else if (docSnap.exists()) {
                // Video exists, increment view count atomically
                debugLog(`incrementViewCount: Incrementing view count for existing video ${videoId}`);
                const oldCount = docSnap.data().viewCount || 0;
                console.debug('[WigTubeDB] Incrementing view count from', oldCount);
                
                // Use atomic increment for better performance and concurrency
                await updateDoc(videoDocRef, {
                    viewCount: increment(1)
                });
                
                const newCount = oldCount + 1;
                debugLog(`incrementViewCount: New view count is ${newCount}`);
                console.debug('[WigTubeDB] View count updated successfully to:', newCount);
                return newCount;
            } else {
                debugLog(`incrementViewCount: Video ${videoId} doesn't exist and no metadata provided`);
                console.debug('[WigTubeDB] Video not found and no metadata provided');
                return 0;
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
     * OPTIMIZED RATING SYSTEM:
     * - Stores ratings as a map (userRatings) within the video document
     * - Each user's rating is stored by their userId as the key
     * - Cached ratingAverage and ratingCount are stored in the video document
     * - This approach minimizes Firebase reads:
     *   1. Only 1 read to check user's existing rating (getUserRating)
     *   2. Only 1 write to update rating (addRating with merge)
     *   3. getAllRatings uses cached data from video document (no extra read)
     * - Supports rating updates: users can change their rating anytime
     * - Average rating is calculated and cached on every rating update
     */

    /**
     * Add or update a rating for a video (1-5 stars)
     * If user already rated, updates their rating instead of adding a new one
     */
    async function addRating(videoId, rating, userId = 'anonymous') {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5 stars');
        }

        const db = getDB();
        if (!db) {
            const offlineData = getOfflineData();
            if (!offlineData.videos) offlineData.videos = {};
            if (!offlineData.videos[videoId]) {
                offlineData.videos[videoId] = {};
            }
            if (!offlineData.videos[videoId].userRatings) {
                offlineData.videos[videoId].userRatings = {};
            }
            
            // Store rating by userId - this allows updates
            offlineData.videos[videoId].userRatings[userId] = rating;
            
            // Calculate and store average
            const allRatings = Object.values(offlineData.videos[videoId].userRatings);
            const avg = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
            offlineData.videos[videoId].ratingAverage = avg;
            offlineData.videos[videoId].ratingCount = allRatings.length;
            
            saveOfflineData(offlineData);
            return allRatings;
        }

        try {
            console.debug('[WigTubeDB] addRating called:', { videoId, rating, userId });
            const { doc, setDoc, getDoc, collection, updateDoc } = window.firebaseAPI;
            const ratingsRef = doc(db, COLLECTION, RATINGS_DOC);
            
            // Video reference in subcollection
            const videosCollectionRef = collection(db, COLLECTION, DATA_DOC, 'videos');
            const videoDocRef = doc(videosCollectionRef, videoId);
            
            // Get current ratings
            console.debug('[WigTubeDB] Fetching ratings from: wigtube/user_ratings');
            const ratingsSnap = await getDoc(ratingsRef);
            const ratingsData = ratingsSnap.exists() ? ratingsSnap.data() : {};
            const ratings = ratingsData.ratings || {};
            console.debug('[WigTubeDB] Current ratings document:', ratingsSnap.exists(), 'videos with ratings:', Object.keys(ratings).length);
            
            // Initialize video ratings if needed
            if (!ratings[videoId]) {
                ratings[videoId] = {};
                console.debug('[WigTubeDB] Initializing ratings for video:', videoId);
            }
            
            // Add or update user's rating
            ratings[videoId][userId] = rating;
            console.debug('[WigTubeDB] Updated rating for', videoId, 'by', userId, 'to', rating);
            
            // Calculate average rating
            const allRatings = Object.values(ratings[videoId]);
            const ratingAverage = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
            const ratingCount = allRatings.length;
            console.debug('[WigTubeDB] Calculated average:', ratingAverage, 'from', ratingCount, 'ratings');
            
            // Update ratings document
            await setDoc(ratingsRef, { ratings }, { merge: true });
            console.debug('[WigTubeDB] Ratings document updated');
            
            // Update video document with averages
            const videoSnap = await getDoc(videoDocRef);
            if (videoSnap.exists()) {
                await updateDoc(videoDocRef, {
                    ratingAverage: ratingAverage,
                    ratingCount: ratingCount
                });
                console.debug('[WigTubeDB] Video document updated with rating averages');
            }

            debugLog(`addRating: Updated rating for ${videoId} - User ${userId} rated ${rating} stars. New average: ${ratingAverage.toFixed(2)}`);
            return allRatings;
        } catch (error) {
            console.error('Error adding rating:', error);
            throw error;
        }
    }

    /**
     * Get all ratings for a video (returns array of rating values)
     */
    async function getAllRatings(videoId) {
        const db = getDB();
        if (!db) {
            const offlineData = getOfflineData();
            const userRatings = offlineData.videos?.[videoId]?.userRatings || {};
            return Object.values(userRatings);
        }

        try {
            const { doc, getDoc } = window.firebaseAPI;
            const ratingsRef = doc(db, COLLECTION, RATINGS_DOC);
            const ratingsSnap = await getDoc(ratingsRef);
            
            if (!ratingsSnap.exists()) {
                return [];
            }
            
            const data = ratingsSnap.data();
            const ratings = data.ratings || {};
            const videoRatings = ratings[videoId] || {};
            return Object.values(videoRatings);
        } catch (error) {
            console.error('Error getting all ratings:', error);
            return [];
        }
    }

    /**
     * Get user's rating for a video
     */
    async function getUserRating(videoId, userId = 'anonymous') {
        const db = getDB();
        if (!db) {
            const offlineData = getOfflineData();
            return offlineData.videos?.[videoId]?.userRatings?.[userId] || null;
        }

        try {
            const { doc, getDoc } = window.firebaseAPI;
            const ratingsRef = doc(db, COLLECTION, RATINGS_DOC);
            const ratingsSnap = await getDoc(ratingsRef);
            
            if (!ratingsSnap.exists()) {
                return null;
            }
            
            const data = ratingsSnap.data();
            const ratings = data.ratings || {};
            const videoRatings = ratings[videoId] || {};
            return videoRatings[userId] || null;
        } catch (error) {
            console.error('Error getting user rating:', error);
            return null;
        }
    }

    /**
     * Get average rating for a video (from cached value to reduce reads)
     */
    async function getAverageRating(videoId) {
        const db = getDB();
        if (!db) {
            const offlineData = getOfflineData();
            return offlineData.videos?.[videoId]?.ratingAverage || 0;
        }

        try {
            const { doc, getDoc, collection } = window.firebaseAPI;
            const videosCollectionRef = collection(db, COLLECTION, DATA_DOC, 'videos');
            const videoDocRef = doc(videosCollectionRef, videoId);
            const videoSnap = await getDoc(videoDocRef);
            
            if (!videoSnap.exists()) {
                return 0;
            }
            
            const video = videoSnap.data();
            return video?.ratingAverage || 0;
        } catch (error) {
            console.error('Error getting average rating:', error);
            return 0;
        }
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
            console.debug('[WigTubeDB] addComment called for:', videoId, 'by:', commentData.author);
            const { doc, getDoc, setDoc, collection, updateDoc } = window.firebaseAPI;
            
            const commentsRef = doc(db, COLLECTION, COMMENTS_DOC);
            const dataRef = doc(db, COLLECTION, DATA_DOC);
            
            // Get current comments
            console.debug('[WigTubeDB] Fetching comments from: wigtube/wigtube_comments');
            const commentsSnap = await getDoc(commentsRef);
            const commentsData = commentsSnap.exists() ? commentsSnap.data() : {};
            const comments = commentsData.comments || {};
            console.debug('[WigTubeDB] Comments document exists:', commentsSnap.exists(), 'videos with comments:', Object.keys(comments).length);
            
            // Initialize video comments array if needed
            if (!comments[videoId]) {
                comments[videoId] = [];
                console.debug('[WigTubeDB] Initializing comments array for video:', videoId);
            }
            
            // Generate comment ID and add to array
            const commentId = 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            comment.id = commentId;
            comment.timestamp = new Date().toISOString();
            comments[videoId].unshift(comment);
            console.debug('[WigTubeDB] Added comment:', commentId, 'total comments for video:', comments[videoId].length);
            
            // Update comments document
            await setDoc(commentsRef, { comments }, { merge: true });
            debugLog(`addComment: Comment saved with ID ${commentId}`);
            console.debug('[WigTubeDB] Comments document updated');
            
            // Update comment count in video data
            try {
                const videosCollectionRef = collection(db, COLLECTION, DATA_DOC, 'videos');
                const videoDocRef = doc(videosCollectionRef, videoId);
                const videoSnap = await getDoc(videoDocRef);
                
                if (videoSnap.exists()) {
                    const oldCount = videoSnap.data().commentCount || 0;
                    await updateDoc(videoDocRef, {
                        commentCount: oldCount + 1
                    });
                    debugLog(`addComment: Updated comment count for ${videoId}`);
                    console.debug('[WigTubeDB] Comment count updated from', oldCount, 'to', oldCount + 1);
                }
            } catch (updateError) {
                console.warn('Could not update comment count:', updateError);
                debugLog(`addComment: Failed to update count for ${videoId}:`, updateError);
            }

            return comment;
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
            const { doc, getDoc } = window.firebaseAPI;
            
            const commentsRef = doc(db, COLLECTION, COMMENTS_DOC);
            const commentsSnap = await getDoc(commentsRef);
            
            if (!commentsSnap.exists()) {
                debugLog(`getComments: No comments document found`);
                return [];
            }
            
            const data = commentsSnap.data();
            const commentsMap = data.comments || {};
            const videoComments = commentsMap[videoId] || [];
            
            // Already sorted by newest first (unshift in addComment)
            // Apply limit
            const limitedComments = videoComments.slice(0, limit);

            debugLog(`getComments: Retrieved ${limitedComments.length} comments from Firestore for ${videoId}`);
            return limitedComments;
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
            const { doc, getDoc, setDoc, collection, updateDoc } = window.firebaseAPI;
            
            // Get comments document
            const commentsRef = doc(db, COLLECTION, COMMENTS_DOC);
            const commentsSnap = await getDoc(commentsRef);
            
            if (!commentsSnap.exists()) {
                debugLog(`deleteComment: No comments document found`);
                return;
            }
            
            const commentsData = commentsSnap.data();
            const comments = commentsData.comments || {};
            const videoComments = comments[videoId] || [];
            
            // Find and remove the comment
            const commentIndex = videoComments.findIndex(c => c.id === commentId);
            if (commentIndex !== -1) {
                videoComments.splice(commentIndex, 1);
                comments[videoId] = videoComments;
                
                // Update comments document
                await setDoc(commentsRef, { comments }, { merge: true });
                debugLog(`deleteComment: Comment ${commentId} deleted from Firestore`);
                
                // Update comment count in video data
                try {
                    const videosCollectionRef = collection(db, COLLECTION, DATA_DOC, 'videos');
                    const videoDocRef = doc(videosCollectionRef, videoId);
                    const videoSnap = await getDoc(videoDocRef);
                    
                    if (videoSnap.exists()) {
                        const currentCount = videoSnap.data().commentCount || 0;
                        await updateDoc(videoDocRef, {
                            commentCount: Math.max(0, currentCount - 1)
                        });
                        debugLog(`deleteComment: Updated comment count for ${videoId} to ${Math.max(0, currentCount - 1)}`);
                    }
                } catch (updateError) {
                    debugLog(`deleteComment: Failed to update count for ${videoId}:`, updateError);
                }
            } else {
                debugLog(`deleteComment: Comment ${commentId} not found in ${videoId}`);
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
    // Watch History Operations
    // ============================================

    /**
     * Add video to user's watch history
     */
    function addToHistory(videoId, videoData) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            // Don't track history for guest users
            if (username.toLowerCase() === 'guest') {
                return;
            }
            
            const historyKey = `wigtube_history_${username}`;
            let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            
            // Remove existing entry for this video if it exists
            history = history.filter(item => item.videoId !== videoId);
            
            // Add to beginning of history
            history.unshift({
                videoId: videoId,
                title: videoData.title,
                thumbnail: videoData.thumbnail,
                duration: videoData.duration,
                author: videoData.author || videoData.uploader,
                timestamp: new Date().toISOString()
            });
            
            // Keep only last 50 videos
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            localStorage.setItem(historyKey, JSON.stringify(history));
            debugLog(`Added ${videoId} to history for ${username}`);
        } catch (error) {
            console.error('Error adding to history:', error);
        }
    }

    /**
     * Get user's watch history
     */
    function getHistory(limit = 50) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                return [];
            }
            
            const historyKey = `wigtube_history_${username}`;
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            
            return history.slice(0, limit);
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    }

    /**
     * Clear user's watch history
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
            debugLog(`Cleared history for ${username}`);
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    }

    // ============================================
    // Favorites Operations
    // ============================================

    /**
     * Add video to user's favorites
     */
    function addToFavorites(videoId, videoData) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                return false;
            }
            
            const favoritesKey = `wigtube_favorites_${username}`;
            let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
            
            // Check if already favorited
            if (favorites.some(item => item.videoId === videoId)) {
                return false;
            }
            
            // Add to favorites
            favorites.unshift({
                videoId: videoId,
                title: videoData.title,
                thumbnail: videoData.thumbnail,
                duration: videoData.duration,
                author: videoData.author || videoData.uploader,
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem(favoritesKey, JSON.stringify(favorites));
            debugLog(`Added ${videoId} to favorites for ${username}`);
            return true;
        } catch (error) {
            console.error('Error adding to favorites:', error);
            return false;
        }
    }

    /**
     * Remove video from user's favorites
     */
    function removeFromFavorites(videoId) {
        try {
            const username = typeof window !== 'undefined' ? 
                (localStorage.getItem('username') || 'guest') : 'guest';
            
            if (username.toLowerCase() === 'guest') {
                return false;
            }
            
            const favoritesKey = `wigtube_favorites_${username}`;
            let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
            
            favorites = favorites.filter(item => item.videoId !== videoId);
            localStorage.setItem(favoritesKey, JSON.stringify(favorites));
            debugLog(`Removed ${videoId} from favorites for ${username}`);
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
     * Check if video is in favorites
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
        isOnline: () => getDB() !== null
    };
})();

console.log('WigTube Database API loaded');
// Log connection status after Firebase has time to initialize
setTimeout(() => {
    const status = window.WigTubeDB.isOnline() ? 'Online (Firestore)' : 'Offline (localStorage)';
    console.log('WigTubeDB Status:', status);
}, 1500);
