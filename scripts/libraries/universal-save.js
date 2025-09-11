/**
 * Universal Game Save System
 * 
 * A standalone library for receiving and managing game save data from Firebase Firestore.
 * Can be used across multiple game repositories that need cloud save functionality.
 * 
 * Features:
 * - Firebase Firestore integration
 * - Offline mode with localStorage fallback
 * - User authentication support
 * - Guest mode support
 * - Game-agnostic data handling
 * 
 * Usage:
 *   const saveSystem = new UniversalSaveSystem();
 *   await saveSystem.initialize();
 *   const data = await saveSystem.loadGameData('undertale');
 *   await saveSystem.saveGameData('undertale', gameData);
 */

class UniversalSaveSystem {
    constructor() {
        this.firebaseAPI = null;
        this.isOnline = false;
        this.currentUser = null;
        this.initialized = false;
    }

    /**
     * Initialize the save system with Firebase connection
     * @param {Object} firebaseConfig - Firebase configuration object (optional, uses default if not provided)
     * @returns {Promise<boolean>} - Returns true if initialized successfully
     */
    async initialize(firebaseConfig = null) {
        try {
            // Use existing Firebase connection if available
            if (window.firebaseAPI && window.firebaseOnline !== undefined) {
                this.firebaseAPI = window.firebaseAPI;
                this.isOnline = window.firebaseOnline;
                this.currentUser = this.getCurrentUser();
                this.initialized = true;
                console.log("Universal Save System: Using existing Firebase connection");
                return true;
            }

            // Otherwise, initialize our own Firebase connection
            await this.initializeFirebase(firebaseConfig);
            this.currentUser = this.getCurrentUser();
            this.initialized = true;
            console.log("Universal Save System: Initialized successfully");
            return true;

        } catch (error) {
            console.warn("Universal Save System: Initialization failed, using offline mode:", error);
            this.initializeOfflineMode();
            this.currentUser = this.getCurrentUser();
            this.initialized = true;
            return false;
        }
    }

    /**
     * Initialize Firebase connection
     * @private
     */
    async initializeFirebase(firebaseConfig) {
        // Check if running from file:// protocol
        if (window.location.protocol === 'file:') {
            throw new Error("Firebase not available on file:// protocol");
        }

        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js");
        const { getFirestore, doc, setDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");

        // Use provided config or default WigdosXP config
        const config = firebaseConfig || {
            apiKey: "AIzaSyDqDU6p8BH1hTqox7f5Sj1ySTWifIP2818",
            authDomain: "wigdos-9aa6a.firebaseapp.com",
            databaseURL: "https://wigdos-9aa6a-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "wigdos-9aa6a",
            storageBucket: "wigdos-9aa6a.firebasestorage.app",
            messagingSenderId: "124867645389",
            appId: "1:124867645389:web:4530e19e575669f3cabe84",
            measurementId: "G-1KTKSSCJ33"
        };

        const app = initializeApp(config);
        const db = getFirestore(app);

        this.firebaseAPI = { db, setDoc, getDoc, doc };
        this.isOnline = true;
    }

    /**
     * Initialize offline mode with mock Firebase API
     * @private
     */
    initializeOfflineMode() {
        this.firebaseAPI = {
            db: null,
            setDoc: async () => {
                console.log("Universal Save System: Mock setDoc - data stored locally only");
                return Promise.resolve();
            },
            getDoc: async () => {
                console.log("Universal Save System: Mock getDoc - no remote data available");
                return { exists: () => false, data: () => null };
            },
            doc: () => null
        };
        this.isOnline = false;
    }

    /**
     * Get the current user (supports various user systems)
     * @private
     */
    getCurrentUser() {
        // Try localStorage first (WigdosXP style)
        if (localStorage.getItem("username")) {
            return localStorage.getItem("username");
        }
        
        // Try other common user storage methods
        if (localStorage.getItem("user")) {
            return localStorage.getItem("user");
        }
        
        if (sessionStorage.getItem("username")) {
            return sessionStorage.getItem("username");
        }

        // Default to guest
        return "guest";
    }

    /**
     * Load game save data for a specific game
     * @param {string} gameId - Unique identifier for the game
     * @param {Object} defaultData - Default data to return if no save exists (optional)
     * @returns {Promise<Object|null>} - The loaded save data or null if error
     */
    async loadGameData(gameId, defaultData = null) {
        if (!this.initialized) {
            throw new Error("Universal Save System not initialized. Call initialize() first.");
        }

        try {
            const username = this.currentUser;

            // For guests or offline mode, try localStorage first
            if (username === "guest" || !this.isOnline) {
                const localData = localStorage.getItem(`${gameId}SaveData`);
                if (localData) {
                    console.log(`Universal Save System: Loaded ${gameId} data from localStorage`);
                    return JSON.parse(localData);
                }
                return defaultData;
            }

            // Try to load from Firebase if online and authenticated
            if (this.isOnline && username !== "guest") {
                console.log(`Universal Save System: Loading ${gameId} data from Firebase`);
                
                const { db, getDoc, doc } = this.firebaseAPI;
                const userDoc = await getDoc(doc(db, "game_saves", username));
                
                if (userDoc.exists() && userDoc.data()[gameId]) {
                    const saveData = JSON.parse(userDoc.data()[gameId]);
                    // Also store locally as backup
                    localStorage.setItem(`${gameId}SaveData`, JSON.stringify(saveData));
                    console.log(`Universal Save System: Loaded ${gameId} data from Firebase`);
                    return saveData;
                }
            }

            // Fallback to localStorage
            const localData = localStorage.getItem(`${gameId}SaveData`);
            if (localData) {
                console.log(`Universal Save System: Loaded ${gameId} data from localStorage fallback`);
                return JSON.parse(localData);
            }

            console.log(`Universal Save System: No save data found for ${gameId}, returning default`);
            return defaultData;

        } catch (error) {
            console.error(`Universal Save System: Error loading ${gameId} data:`, error);
            
            // Try localStorage as final fallback
            try {
                const localData = localStorage.getItem(`${gameId}SaveData`);
                if (localData) {
                    console.log(`Universal Save System: Emergency fallback to localStorage for ${gameId}`);
                    return JSON.parse(localData);
                }
            } catch (localError) {
                console.error(`Universal Save System: localStorage fallback failed:`, localError);
            }
            
            return defaultData;
        }
    }

    /**
     * Save game data for a specific game
     * @param {string} gameId - Unique identifier for the game
     * @param {Object} data - The save data to store
     * @returns {Promise<boolean>} - Returns true if saved successfully
     */
    async saveGameData(gameId, data) {
        if (!this.initialized) {
            throw new Error("Universal Save System not initialized. Call initialize() first.");
        }

        try {
            const username = this.currentUser;
            const dataString = JSON.stringify(data);

            // Always save to localStorage as backup
            localStorage.setItem(`${gameId}SaveData`, dataString);
            console.log(`Universal Save System: Saved ${gameId} data to localStorage`);

            // If online and authenticated, also save to Firebase
            if (this.isOnline && username !== "guest") {
                const { db, setDoc, doc } = this.firebaseAPI;
                
                await setDoc(
                    doc(db, "game_saves", username),
                    { [gameId]: dataString },
                    { merge: true }
                );
                
                console.log(`Universal Save System: Saved ${gameId} data to Firebase`);
            } else if (username === "guest") {
                console.log(`Universal Save System: Guest mode - ${gameId} data saved locally only`);
            } else {
                console.log(`Universal Save System: Offline mode - ${gameId} data saved locally only`);
            }

            return true;

        } catch (error) {
            console.error(`Universal Save System: Error saving ${gameId} data:`, error);
            
            // Ensure localStorage save as emergency fallback
            try {
                localStorage.setItem(`${gameId}SaveData`, JSON.stringify(data));
                console.log(`Universal Save System: Emergency save to localStorage successful for ${gameId}`);
                return true;
            } catch (localError) {
                console.error(`Universal Save System: Emergency localStorage save failed:`, localError);
                return false;
            }
        }
    }

    /**
     * Delete save data for a specific game
     * @param {string} gameId - Unique identifier for the game
     * @returns {Promise<boolean>} - Returns true if deleted successfully
     */
    async deleteGameData(gameId) {
        if (!this.initialized) {
            throw new Error("Universal Save System not initialized. Call initialize() first.");
        }

        try {
            const username = this.currentUser;

            // Remove from localStorage
            localStorage.removeItem(`${gameId}SaveData`);
            console.log(`Universal Save System: Deleted ${gameId} data from localStorage`);

            // If online and authenticated, also remove from Firebase
            if (this.isOnline && username !== "guest") {
                const { db, setDoc, doc } = this.firebaseAPI;
                
                await setDoc(
                    doc(db, "game_saves", username),
                    { [gameId]: null },
                    { merge: true }
                );
                
                console.log(`Universal Save System: Deleted ${gameId} data from Firebase`);
            }

            return true;

        } catch (error) {
            console.error(`Universal Save System: Error deleting ${gameId} data:`, error);
            return false;
        }
    }

    /**
     * Get system status information
     * @returns {Object} - Status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            isOnline: this.isOnline,
            currentUser: this.currentUser,
            hasFirebase: this.firebaseAPI !== null
        };
    }

    /**
     * List all available save data for the current user
     * @returns {Promise<Array>} - Array of game IDs that have save data
     */
    async listSaveData() {
        const saveIds = [];

        try {
            // Check localStorage for saves
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.endsWith('SaveData')) {
                    const gameId = key.replace('SaveData', '');
                    saveIds.push(gameId);
                }
            }

            // If online, also check Firebase
            if (this.isOnline && this.currentUser !== "guest") {
                const { db, getDoc, doc } = this.firebaseAPI;
                const userDoc = await getDoc(doc(db, "game_saves", this.currentUser));
                
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    Object.keys(data).forEach(gameId => {
                        if (!saveIds.includes(gameId)) {
                            saveIds.push(gameId);
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Universal Save System: Error listing save data:", error);
        }

        return saveIds;
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalSaveSystem;
} else {
    window.UniversalSaveSystem = UniversalSaveSystem;
}

// Also create a convenience global instance
window.universalSaveSystem = new UniversalSaveSystem();