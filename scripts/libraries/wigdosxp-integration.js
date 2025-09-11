/**
 * WigdosXP Integration Helper for Universal Save System
 * 
 * This file provides integration helpers to use the Universal Save System
 * with existing WigdosXP applications and games.
 */

/**
 * Initialize Universal Save System for WigdosXP
 * Automatically uses existing Firebase connection if available
 */
async function initializeUniversalSaveForWigdosXP() {
    // Wait for Firebase to be ready if it's still initializing
    if (typeof window.firebaseAPI === 'undefined') {
        await new Promise(resolve => {
            if (typeof window !== 'undefined') {
                window.addEventListener('dbReady', resolve, { once: true });
            } else {
                setTimeout(resolve, 1000); // fallback timeout
            }
        });
    }

    // Initialize the universal save system
    const saveSystem = new UniversalSaveSystem();
    await saveSystem.initialize();
    
    // Make it globally available
    window.universalSaveSystem = saveSystem;
    
    console.log('Universal Save System integrated with WigdosXP');
    console.log('Status:', saveSystem.getStatus());
    
    return saveSystem;
}

/**
 * Enhanced save function that uses Universal Save System
 * Can be used as a drop-in replacement for existing game save functions
 */
async function saveGameDataUniversal(gameId, data) {
    // Initialize if not already done
    if (!window.universalSaveSystem) {
        await initializeUniversalSaveForWigdosXP();
    }
    
    try {
        const success = await window.universalSaveSystem.saveGameData(gameId, data);
        if (success) {
            console.log(`✅ Universal save successful for ${gameId}`);
            // Trigger WigdosXP data update event for compatibility
            window.dispatchEvent(new Event("dataUpdate"));
        } else {
            console.error(`❌ Universal save failed for ${gameId}`);
        }
        return success;
    } catch (error) {
        console.error(`Universal save error for ${gameId}:`, error);
        return false;
    }
}

/**
 * Enhanced load function that uses Universal Save System
 * Can be used as a drop-in replacement for existing game load functions
 */
async function loadGameDataUniversal(gameId, defaultData = null) {
    // Initialize if not already done
    if (!window.universalSaveSystem) {
        await initializeUniversalSaveForWigdosXP();
    }
    
    try {
        const data = await window.universalSaveSystem.loadGameData(gameId, defaultData);
        if (data) {
            console.log(`✅ Universal load successful for ${gameId}`);
        } else {
            console.log(`ℹ️ No save data found for ${gameId}, using defaults`);
        }
        return data;
    } catch (error) {
        console.error(`Universal load error for ${gameId}:`, error);
        return defaultData;
    }
}

/**
 * Migrate existing WigdosXP save data to Universal Save System
 * This helps transition existing games to use the new system
 */
async function migrateWigdosXPSaves() {
    if (!window.universalSaveSystem) {
        await initializeUniversalSaveForWigdosXP();
    }

    console.log('🔄 Migrating existing WigdosXP save data...');
    let migrated = 0;

    try {
        // Check for existing save data patterns in localStorage
        const savePatterns = [
            { pattern: /^(\w+)SaveData$/, type: 'standard' },
            { pattern: /^(\w+)Data$/, type: 'alternative' },
            { pattern: /^save_(\w+)$/, type: 'prefixed' }
        ];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            for (const pattern of savePatterns) {
                const match = key.match(pattern.pattern);
                if (match) {
                    const gameId = match[1];
                    
                    // Skip if already migrated
                    if (gameId === 'universal' || gameId === 'system') continue;
                    
                    try {
                        const existingData = localStorage.getItem(key);
                        if (existingData) {
                            const parsedData = JSON.parse(existingData);
                            
                            // Check if this data is already in universal format
                            const universalData = await window.universalSaveSystem.loadGameData(gameId);
                            if (!universalData) {
                                // Migrate the data
                                await window.universalSaveSystem.saveGameData(gameId, parsedData);
                                migrated++;
                                console.log(`✅ Migrated ${gameId} save data`);
                            }
                        }
                    } catch (error) {
                        console.warn(`⚠️ Could not migrate ${key}:`, error);
                    }
                    break;
                }
            }
        }

        console.log(`🎉 Migration complete! Migrated ${migrated} save files.`);
        return migrated;

    } catch (error) {
        console.error('❌ Migration failed:', error);
        return 0;
    }
}

/**
 * Create a wrapper for existing postMessage-based save/load systems
 * This allows existing games to use Universal Save System without major changes
 */
function createUniversalSaveMessageHandler() {
    window.addEventListener('message', async (event) => {
        // Handle universal save system messages
        if (event.data.type === 'universalSave') {
            const { gameId, data } = event.data;
            const success = await saveGameDataUniversal(gameId, data);
            
            // Send response back to the game
            event.source.postMessage({
                type: 'universalSaveResponse',
                success: success,
                gameId: gameId
            }, '*');
            
        } else if (event.data.type === 'universalLoad') {
            const { gameId, defaultData } = event.data;
            const data = await loadGameDataUniversal(gameId, defaultData);
            
            // Send response back to the game
            event.source.postMessage({
                type: 'universalLoadResponse',
                data: data,
                gameId: gameId
            }, '*');
        }
    });
    
    console.log('Universal Save System message handler registered');
}

/**
 * Auto-initialize Universal Save System when this script loads
 * Only if we're in the main window context
 */
if (typeof window !== 'undefined' && window === window.top) {
    // Auto-initialize when the page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeUniversalSaveForWigdosXP();
            createUniversalSaveMessageHandler();
        });
    } else {
        // Page already loaded
        initializeUniversalSaveForWigdosXP();
        createUniversalSaveMessageHandler();
    }
}

// Export functions for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeUniversalSaveForWigdosXP,
        saveGameDataUniversal,
        loadGameDataUniversal,
        migrateWigdosXPSaves,
        createUniversalSaveMessageHandler
    };
}