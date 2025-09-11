/**
 * Universal Save System Example
 * 
 * This example demonstrates how to use the Universal Save System
 * in a game to save and load player data.
 */

// Example game data structure
const defaultGameData = {
    playerName: "Player",
    level: 1,
    experience: 0,
    inventory: [],
    settings: {
        musicVolume: 0.8,
        soundVolume: 0.8,
        difficulty: "normal"
    },
    progress: {
        currentStage: "intro",
        completedLevels: [],
        unlockedItems: []
    },
    timestamp: Date.now()
};

// Example implementation for a game called "undertale"
class UndertaleGame {
    constructor() {
        this.gameData = null;
        this.saveSystem = null;
        this.gameId = "undertale"; // Unique identifier for this game
    }

    async initialize() {
        try {
            // Initialize the universal save system
            this.saveSystem = new UniversalSaveSystem();
            await this.saveSystem.initialize();
            
            console.log("Save system status:", this.saveSystem.getStatus());
            
            // Load existing save data or use defaults
            this.gameData = await this.saveSystem.loadGameData(this.gameId, defaultGameData);
            
            console.log("Game initialized with data:", this.gameData);
            
            return true;
        } catch (error) {
            console.error("Failed to initialize game:", error);
            // Fallback to default data
            this.gameData = {...defaultGameData};
            return false;
        }
    }

    async saveGame() {
        if (!this.saveSystem) {
            console.error("Save system not initialized");
            return false;
        }

        try {
            // Update timestamp before saving
            this.gameData.timestamp = Date.now();
            
            // Save the current game state
            const success = await this.saveSystem.saveGameData(this.gameId, this.gameData);
            
            if (success) {
                console.log("Game saved successfully!");
                return true;
            } else {
                console.error("Failed to save game");
                return false;
            }
        } catch (error) {
            console.error("Error saving game:", error);
            return false;
        }
    }

    async loadGame() {
        if (!this.saveSystem) {
            console.error("Save system not initialized");
            return false;
        }

        try {
            const loadedData = await this.saveSystem.loadGameData(this.gameId, defaultGameData);
            
            if (loadedData) {
                this.gameData = loadedData;
                console.log("Game loaded successfully!");
                return true;
            } else {
                console.warn("No save data found, using defaults");
                this.gameData = {...defaultGameData};
                return false;
            }
        } catch (error) {
            console.error("Error loading game:", error);
            this.gameData = {...defaultGameData};
            return false;
        }
    }

    async deleteSave() {
        if (!this.saveSystem) {
            console.error("Save system not initialized");
            return false;
        }

        try {
            const success = await this.saveSystem.deleteGameData(this.gameId);
            
            if (success) {
                this.gameData = {...defaultGameData};
                console.log("Save data deleted successfully!");
                return true;
            } else {
                console.error("Failed to delete save data");
                return false;
            }
        } catch (error) {
            console.error("Error deleting save data:", error);
            return false;
        }
    }

    // Game-specific methods
    levelUp() {
        this.gameData.level++;
        this.gameData.experience = 0;
        console.log(`Level up! Now level ${this.gameData.level}`);
        
        // Auto-save after important events
        this.saveGame();
    }

    addExperience(amount) {
        this.gameData.experience += amount;
        console.log(`Gained ${amount} experience. Total: ${this.gameData.experience}`);
        
        // Check for level up (example: 100 exp per level)
        if (this.gameData.experience >= 100) {
            this.levelUp();
        }
    }

    addToInventory(item) {
        this.gameData.inventory.push(item);
        console.log(`Added ${item} to inventory`);
        
        // Auto-save inventory changes
        this.saveGame();
    }

    updateSettings(newSettings) {
        this.gameData.settings = {...this.gameData.settings, ...newSettings};
        console.log("Settings updated:", this.gameData.settings);
        
        // Auto-save settings changes
        this.saveGame();
    }

    completeLevel(levelId) {
        if (!this.gameData.progress.completedLevels.includes(levelId)) {
            this.gameData.progress.completedLevels.push(levelId);
            console.log(`Completed level: ${levelId}`);
            
            // Auto-save progress
            this.saveGame();
        }
    }
}

// Example usage:
async function exampleUsage() {
    const game = new UndertaleGame();
    
    // Initialize the game and load save data
    await game.initialize();
    
    // Play the game (simulate some actions)
    game.addExperience(25);
    game.addToInventory("Butterscotch Pie");
    game.completeLevel("ruins_1");
    
    // Manual save
    await game.saveGame();
    
    // Show save system status
    console.log("Available saves:", await game.saveSystem.listSaveData());
}

// Auto-run example if this file is loaded directly
if (typeof window !== 'undefined') {
    window.UndertaleGameExample = UndertaleGame;
    window.runUndertaleExample = exampleUsage;
    
    // Uncomment the line below to run the example automatically
    // exampleUsage();
}