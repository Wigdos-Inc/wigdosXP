// Achievements Database Integration - Firestore & localStorage fallback
// Manages achievements/badges data across all games and apps

console.log('AchievementsDB: Module loading...');

/**
 * Achievements Database API
 * Provides methods for achievement/badge operations with Firestore backend
 * Falls back to localStorage when offline
 */
window.AchievementsDB = (function() {
    'use strict';

    // Use the same Firebase API that WigdOS uses
    let db = null;
    let dbCheckAttempted = false;
    const COLLECTION = 'user_achievements';
    const STORAGE_KEY = 'achievements_offline_data';
    
    /**
     * Get Firestore database instance (lazy initialization)
     */
    function getDB() {
        if (db) {
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
                console.log('AchievementsDB: Connected to Firestore via firebaseAPI');
            }
            
            return db;
        }
        
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
            return parsed;
        } catch (e) {
            console.error('Error reading offline achievements data:', e);
            return {};
        }
    }

    /**
     * Save offline data to localStorage
     */
    function saveOfflineData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            console.log('AchievementsDB: Saved offline data for', Object.keys(data).length, 'users');
        } catch (e) {
            console.error('Error saving offline achievements data:', e);
        }
    }

    /**
     * Get current username
     */
    function getUsername() {
        if (typeof window.getUser === 'function') {
            return window.getUser();
        }
        return 'guest';
    }

    /**
     * Merge online and offline data when reconnecting
     */
    async function syncOfflineData() {
        const username = getUsername();
        if (username === 'guest') {
            return;
        }

        const offlineData = getOfflineData();
        const userOfflineData = offlineData[username];
        
        if (!userOfflineData || userOfflineData.length === 0) {
            return; // Nothing to sync
        }

        const db = getDB();
        if (!db) {
            return; // Still offline, can't sync
        }

        try {
            const { doc, getDoc, setDoc } = window.firebaseAPI;
            const docRef = doc(db, COLLECTION, username);
            
            // Get current online data
            const docSnap = await getDoc(docRef);
            let onlineBadges = [];
            
            if (docSnap.exists()) {
                onlineBadges = docSnap.data().badges || [];
            }
            
            // Merge: combine online and offline, remove duplicates
            const mergedBadges = [...new Set([...onlineBadges, ...userOfflineData])];
            
            // Save merged data back to Firestore
            await setDoc(docRef, {
                badges: mergedBadges,
                lastUpdated: Date.now()
            });
            
            // Clear offline data for this user after successful sync
            delete offlineData[username];
            saveOfflineData(offlineData);
            
            console.log('AchievementsDB: Successfully synced offline data for', username);
            return mergedBadges;
        } catch (error) {
            console.error('AchievementsDB: Error syncing offline data:', error);
            return null;
        }
    }

    // ============================================
    // Achievement Operations
    // ============================================

    /**
     * Load user's achievements from Firebase or localStorage
     * @param {string} username - Optional username, defaults to current user
     * @returns {Promise<Array>} Array of badge IDs
     */
    async function loadAchievements(username = null) {
        username = username || getUsername();
        
        console.log('AchievementsDB: loadAchievements called for user:', username);
        
        if (username === 'guest') {
            // Load guest achievements from localStorage
            const offlineData = getOfflineData();
            const badges = offlineData[username] || [];
            console.log('AchievementsDB: Guest user - loaded', badges.length, 'achievements from localStorage');
            return [...new Set(badges)];
        }

        // Try to sync offline data first if we're online
        const db = getDB();
        if (db) {
            await syncOfflineData();
        }

        // If online, load from Firebase
        if (db) {
            try {
                const { doc, getDoc } = window.firebaseAPI;
                const docRef = doc(db, COLLECTION, username);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const badges = docSnap.data().badges || [];
                    // Remove duplicates
                    const uniqueBadges = [...new Set(badges)];
                    console.log('AchievementsDB: Loaded', uniqueBadges.length, 'achievements from Firebase for', username);
                    return uniqueBadges;
                } else {
                    console.log('AchievementsDB: No achievements found in Firebase for', username);
                    return [];
                }
            } catch (error) {
                console.error('AchievementsDB: Error loading achievements from Firebase:', error);
                // Fall through to offline data
            }
        }
        
        // Fallback to offline data
        const offlineData = getOfflineData();
        const badges = offlineData[username] || [];
        console.log('AchievementsDB: Loaded', badges.length, 'achievements from offline storage for', username);
        return [...new Set(badges)];
    }

    /**
     * Save user's achievements to Firebase and localStorage
     * @param {Array} badges - Array of badge IDs
     * @param {string} username - Optional username, defaults to current user
     * @returns {Promise<boolean>} Success status
     */
    async function saveAchievements(badges, username = null) {
        username = username || getUsername();
        
        console.log('AchievementsDB: saveAchievements called for user:', username, 'with', badges.length, 'badges');
        
        if (username === 'guest') {
            console.warn('AchievementsDB: Guest user - achievements not saved to server (saved locally)');
            // Still save locally for guest users
            const uniqueBadges = [...new Set(badges)];
            const offlineData = getOfflineData();
            offlineData[username] = uniqueBadges;
            saveOfflineData(offlineData);
            
            // Dispatch event even for guest
            window.dispatchEvent(new CustomEvent('achievementSaved', { 
                detail: { username, badges: uniqueBadges } 
            }));
            
            return true;
        }

        // Remove duplicates before saving
        const uniqueBadges = [...new Set(badges)];
        
        // Always save to localStorage first (offline fallback)
        const offlineData = getOfflineData();
        offlineData[username] = uniqueBadges;
        saveOfflineData(offlineData);

        const db = getDB();
        if (!db) {
            console.log('AchievementsDB: Offline - achievements saved to localStorage only');
            
            // Dispatch event even for offline saves
            window.dispatchEvent(new CustomEvent('achievementSaved', { 
                detail: { username, badges: uniqueBadges } 
            }));
            
            return true;
        }

        // Try to save to Firebase
        try {
            const { doc, setDoc } = window.firebaseAPI;
            const docRef = doc(db, COLLECTION, username);
            
            await setDoc(docRef, {
                badges: uniqueBadges,
                lastUpdated: Date.now()
            });
            
            console.log('AchievementsDB: Successfully saved', uniqueBadges.length, 'achievements to Firebase for', username);
            
            // Dispatch event to notify other parts of the app
            window.dispatchEvent(new CustomEvent('achievementSaved', { 
                detail: { username, badges: uniqueBadges } 
            }));
            
            // Clear offline data after successful save to Firebase
            delete offlineData[username];
            saveOfflineData(offlineData);
            
            return true;
        } catch (error) {
            console.error('AchievementsDB: Error saving achievements to Firebase:', error);
            console.log('AchievementsDB: Achievements are safe in localStorage');
            return false;
        }
    }

    /**
     * Award a single achievement to the user
     * @param {string} badgeId - Badge ID to award
     * @param {string} username - Optional username, defaults to current user
     * @returns {Promise<boolean>} True if newly awarded, false if already had it
     */
    async function awardAchievement(badgeId, username = null) {
        username = username || getUsername();
        
        if (username === 'guest') {
            console.warn('AchievementsDB: Guest user - achievement not awarded');
            return false;
        }

        // Load current achievements
        const badges = await loadAchievements(username);
        
        // Check if already earned
        if (badges.includes(badgeId)) {
            console.log('AchievementsDB: Achievement already earned:', badgeId);
            return false;
        }
        
        // Add new badge
        badges.push(badgeId);
        
        // Save updated list
        await saveAchievements(badges, username);
        
        console.log('AchievementsDB: Awarded achievement:', badgeId);
        return true;
    }

    /**
     * Check if user has a specific achievement
     * @param {string} badgeId - Badge ID to check
     * @param {string} username - Optional username, defaults to current user
     * @returns {Promise<boolean>} True if user has this achievement
     */
    async function hasAchievement(badgeId, username = null) {
        const badges = await loadAchievements(username);
        return badges.includes(badgeId);
    }

    /**
     * Get count of user's achievements
     * @param {string} username - Optional username, defaults to current user
     * @returns {Promise<number>} Number of achievements earned
     */
    async function getAchievementCount(username = null) {
        const badges = await loadAchievements(username);
        return badges.length;
    }

    // ============================================
    // Public API
    // ============================================

    return {
        loadAchievements,
        saveAchievements,
        awardAchievement,
        hasAchievement,
        getAchievementCount,
        syncOfflineData
    };
})();

console.log('AchievementsDB: Module loaded successfully', typeof window.AchievementsDB);

// Dispatch event to signal AchievementsDB is ready
// This ensures other modules can wait for both Firebase AND AchievementsDB
window.dispatchEvent(new Event('achievementsDBReady'));

// If Firebase is already ready, dispatch a combined ready event
if (window.firebaseAPI) {
    console.log('AchievementsDB: Firebase already ready, dispatching combinedReady event');
    window.dispatchEvent(new Event('achievementsSystemReady'));
} else {
    // Wait for Firebase to be ready, then dispatch combined event
    window.addEventListener('dbReady', () => {
        console.log('AchievementsDB: Firebase now ready, dispatching combinedReady event');
        window.dispatchEvent(new Event('achievementsSystemReady'));
    }, { once: true });
}
