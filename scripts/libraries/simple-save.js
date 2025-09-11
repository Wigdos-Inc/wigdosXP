/**
 * Simple Save System for WigdosXP Games
 * 
 * Receives save data from Firebase and stores it in localStorage.
 * Requires WigdosXP's existing Firebase connection.
 * 
 * Usage:
 *   const saves = new SimpleSaveSystem();
 *   const data = await saves.load('undertale');
 *   await saves.save('undertale', gameData);
 */

class SimpleSaveSystem {
    constructor() {
        this.api = window.firebaseAPI;
        this.user = localStorage.getItem("username") || "guest";
    }

    async load(gameId) {
        try {
            // Get from Firebase if available
            if (this.api && this.user !== "guest") {
                const userDoc = await this.api.getDoc(this.api.doc(this.api.db, "game_saves", this.user));
                if (userDoc.exists() && userDoc.data()[gameId]) {
                    const data = JSON.parse(userDoc.data()[gameId]);
                    // Store in localStorage
                    localStorage.setItem(`${gameId}SaveData`, JSON.stringify(data));
                    return data;
                }
            }
            
            // Fallback to localStorage
            const localData = localStorage.getItem(`${gameId}SaveData`);
            return localData ? JSON.parse(localData) : null;
        } catch (error) {
            console.error('Load error:', error);
            const localData = localStorage.getItem(`${gameId}SaveData`);
            return localData ? JSON.parse(localData) : null;
        }
    }

    async save(gameId, data) {
        try {
            // Always save to localStorage
            localStorage.setItem(`${gameId}SaveData`, JSON.stringify(data));
            
            // Save to Firebase if available
            if (this.api && this.user !== "guest") {
                await this.api.setDoc(
                    this.api.doc(this.api.db, "game_saves", this.user),
                    { [gameId]: JSON.stringify(data) },
                    { merge: true }
                );
            }
            return true;
        } catch (error) {
            console.error('Save error:', error);
            return false;
        }
    }
}

// Make available globally
window.SimpleSaveSystem = SimpleSaveSystem;