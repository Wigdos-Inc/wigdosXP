/**
 * Universal Save System - Standalone Version
 * 
 * A compact, self-contained version for easy integration into any game repository.
 * This file contains everything needed to add cloud save functionality to your game.
 * 
 * Simply include this file and use:
 *   const saves = new UniversalSaveSystem();
 *   await saves.init();
 *   const data = await saves.load('mygame', defaultData);
 *   await saves.save('mygame', gameData);
 */

class UniversalSaveSystem {
    constructor() {
        this.api = null;
        this.online = false;
        this.user = 'guest';
        this.ready = false;
    }

    async init(config = null) {
        try {
            // Use existing Firebase if available (WigdosXP integration)
            if (window.firebaseAPI) {
                this.api = window.firebaseAPI;
                this.online = window.firebaseOnline !== false;
                this.user = this.getUser();
                this.ready = true;
                return this.online;
            }

            // Initialize Firebase
            if (window.location.protocol === 'file:') throw new Error('File protocol');
            
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js");
            const { getFirestore, doc, setDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");

            const defaultConfig = {
                apiKey: "AIzaSyDqDU6p8BH1hTqox7f5Sj1ySTWifIP2818",
                authDomain: "wigdos-9aa6a.firebaseapp.com",
                projectId: "wigdos-9aa6a",
                storageBucket: "wigdos-9aa6a.firebasestorage.app",
                messagingSenderId: "124867645389",
                appId: "1:124867645389:web:4530e19e575669f3cabe84"
            };

            const app = initializeApp(config || defaultConfig);
            this.api = { db: getFirestore(app), setDoc, getDoc, doc };
            this.online = true;
        } catch (error) {
            // Offline mode
            this.api = {
                setDoc: async () => Promise.resolve(),
                getDoc: async () => ({ exists: () => false }),
                doc: () => null
            };
            this.online = false;
        }
        
        this.user = this.getUser();
        this.ready = true;
        return this.online;
    }

    getUser() {
        return localStorage.getItem("username") || 
               localStorage.getItem("user") || 
               sessionStorage.getItem("username") || 
               "guest";
    }

    async load(gameId, defaultData = null) {
        if (!this.ready) throw new Error('Not initialized');

        try {
            // Try localStorage first for guests/offline
            if (this.user === "guest" || !this.online) {
                const data = localStorage.getItem(`${gameId}SaveData`);
                return data ? JSON.parse(data) : defaultData;
            }

            // Try Firebase for authenticated users
            if (this.online && this.user !== "guest") {
                const userDoc = await this.api.getDoc(this.api.doc(this.api.db, "game_saves", this.user));
                if (userDoc.exists() && userDoc.data()[gameId]) {
                    const data = JSON.parse(userDoc.data()[gameId]);
                    localStorage.setItem(`${gameId}SaveData`, JSON.stringify(data)); // Backup
                    return data;
                }
            }

            // Fallback to localStorage
            const data = localStorage.getItem(`${gameId}SaveData`);
            return data ? JSON.parse(data) : defaultData;
        } catch (error) {
            console.error('Load error:', error);
            const data = localStorage.getItem(`${gameId}SaveData`);
            return data ? JSON.parse(data) : defaultData;
        }
    }

    async save(gameId, data) {
        if (!this.ready) throw new Error('Not initialized');

        try {
            const dataString = JSON.stringify(data);
            
            // Always save to localStorage
            localStorage.setItem(`${gameId}SaveData`, dataString);

            // Save to Firebase if online and authenticated
            if (this.online && this.user !== "guest") {
                await this.api.setDoc(
                    this.api.doc(this.api.db, "game_saves", this.user),
                    { [gameId]: dataString },
                    { merge: true }
                );
            }
            return true;
        } catch (error) {
            console.error('Save error:', error);
            // Emergency localStorage save
            try {
                localStorage.setItem(`${gameId}SaveData`, JSON.stringify(data));
                return true;
            } catch {
                return false;
            }
        }
    }

    async delete(gameId) {
        if (!this.ready) throw new Error('Not initialized');

        try {
            localStorage.removeItem(`${gameId}SaveData`);
            
            if (this.online && this.user !== "guest") {
                await this.api.setDoc(
                    this.api.doc(this.api.db, "game_saves", this.user),
                    { [gameId]: null },
                    { merge: true }
                );
            }
            return true;
        } catch (error) {
            console.error('Delete error:', error);
            return false;
        }
    }

    status() {
        return {
            ready: this.ready,
            online: this.online,
            user: this.user
        };
    }

    async list() {
        const saves = [];
        try {
            // Check localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.endsWith('SaveData')) {
                    saves.push(key.replace('SaveData', ''));
                }
            }

            // Check Firebase if online
            if (this.online && this.user !== "guest") {
                const userDoc = await this.api.getDoc(this.api.doc(this.api.db, "game_saves", this.user));
                if (userDoc.exists()) {
                    Object.keys(userDoc.data()).forEach(gameId => {
                        if (!saves.includes(gameId)) saves.push(gameId);
                    });
                }
            }
        } catch (error) {
            console.error('List error:', error);
        }
        return saves;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.UniversalSaveSystem = UniversalSaveSystem;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalSaveSystem;
}

/*
 * USAGE EXAMPLES:
 * 
 * Basic usage:
 *   const saves = new UniversalSaveSystem();
 *   await saves.init();
 *   const data = await saves.load('mygame', { level: 1, score: 0 });
 *   await saves.save('mygame', { level: 5, score: 1000 });
 * 
 * Check status:
 *   console.log(saves.status()); // { ready: true, online: false, user: 'guest' }
 * 
 * List saves:
 *   const gameList = await saves.list(); // ['mygame', 'othergame']
 * 
 * Delete save:
 *   await saves.delete('mygame');
 * 
 * Custom Firebase config:
 *   await saves.init({ apiKey: '...', projectId: '...' });
 */