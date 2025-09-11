/*
 * WigdosXP Cross-Origin Save System Integration
 * 
 * This file provides a template for game developers to integrate their games
 * with WigdosXP's cross-origin save system using postMessage communication.
 * 
 * The system now preserves your game's ENTIRE localStorage, maintaining all
 * your game's native save data keys and structure.
 * 
 * Usage: Include this script in your game to enable save/load functionality
 * when your game is running inside WigdosXP's iframe environment.
 */

(function() {
    'use strict';
    
    // Configuration - update these for your game
    const GAME_CONFIG = {
        gameId: 'your-game-id', // Should match the gameId used in WigdosXP applications.js
        saveKey: 'your-game-save-data', // localStorage key where your game stores save data
        debug: false // Set to true for debug logging
    };
    
    // Debug logging helper
    function log(message, data = null) {
        if (GAME_CONFIG.debug) {
            console.log('[WigdosXP Save System]', message, data || '');
        }
    }
    
    // Listen for save/load requests from WigdosXP parent frame
    window.addEventListener('message', function(event) {
        // Verify this is a WigdosXP save system message
        if (!event.data || !event.data.type) return;
        
        log('Received message:', event.data);
        
        switch (event.data.type) {
            case 'getAllLocalStorageData':
                handleGetAllLocalStorageData(event);
                break;
                
            case 'setAllLocalStorageData':
                handleSetAllLocalStorageData(event);
                break;
                
            // Legacy support for old protocol
            case 'getSaveData':
                handleGetSaveData(event);
                break;
                
            case 'loadSaveData':
                handleLoadSaveData(event);
                break;
        }
    });
    
    // Handle save data request from WigdosXP (new protocol - entire localStorage)
    function handleGetAllLocalStorageData(event) {
        log('Processing getAllLocalStorageData request');
        
        try {
            // Get all localStorage data
            const allLocalStorageData = {};
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                allLocalStorageData[key] = localStorage.getItem(key);
            }
            
            log('All localStorage data retrieved:', allLocalStorageData);
            
            // Send response back to WigdosXP
            event.source.postMessage({
                type: 'saveDataResponse',
                messageId: event.data.messageId,
                allLocalStorageData: allLocalStorageData
            }, event.origin);
            
            log('All localStorage data response sent');
            
        } catch (error) {
            console.error('Error getting all localStorage data:', error);
            
            // Send error response
            event.source.postMessage({
                type: 'saveDataResponse',
                messageId: event.data.messageId,
                allLocalStorageData: null,
                error: error.message
            }, event.origin);
        }
    }
    
    // Handle load data request from WigdosXP (new protocol - entire localStorage)
    function handleSetAllLocalStorageData(event) {
        log('Processing setAllLocalStorageData request');
        
        try {
            if (event.data.allLocalStorageData) {
                // Clear existing localStorage and restore all data
                localStorage.clear();
                
                Object.keys(event.data.allLocalStorageData).forEach(key => {
                    localStorage.setItem(key, event.data.allLocalStorageData[key]);
                });
                
                log('All localStorage data restored:', event.data.allLocalStorageData);
                
                // Notify the game that save data was loaded
                window.dispatchEvent(new CustomEvent('wigdosxp-save-loaded', {
                    detail: event.data.allLocalStorageData
                }));
            }
            
            // Send success response
            event.source.postMessage({
                type: 'loadDataResponse',
                messageId: event.data.messageId,
                success: true
            }, event.origin);
            
            log('Set all localStorage data response sent');
            
        } catch (error) {
            console.error('Error setting all localStorage data:', error);
            
            // Send error response
            event.source.postMessage({
                type: 'loadDataResponse',
                messageId: event.data.messageId,
                success: false,
                error: error.message
            }, event.origin);
        }
    }

    // Handle save data request from WigdosXP (legacy protocol - single key)
    function handleGetSaveData(event) {
        log('Processing getSaveData request');
        
        try {
            // Get save data from localStorage
            const saveDataString = localStorage.getItem(GAME_CONFIG.saveKey);
            let saveData = null;
            
            if (saveDataString) {
                try {
                    saveData = JSON.parse(saveDataString);
                    log('Save data retrieved:', saveData);
                } catch (parseError) {
                    console.error('Failed to parse save data:', parseError);
                    saveData = null;
                }
            }
            
            // Send response back to WigdosXP
            event.source.postMessage({
                type: 'saveDataResponse',
                messageId: event.data.messageId,
                saveData: saveData
            }, event.origin);
            
            log('Save data response sent');
            
        } catch (error) {
            console.error('Error getting save data:', error);
            
            // Send error response
            event.source.postMessage({
                type: 'saveDataResponse',
                messageId: event.data.messageId,
                saveData: null,
                error: error.message
            }, event.origin);
        }
    }
    
    // Handle load data request from WigdosXP (legacy protocol - single key)
    function handleLoadSaveData(event) {
        log('Processing loadSaveData request');
        
        try {
            if (event.data.saveData) {
                // Store the save data in localStorage
                const saveDataString = JSON.stringify(event.data.saveData);
                localStorage.setItem(GAME_CONFIG.saveKey, saveDataString);
                
                log('Save data stored:', event.data.saveData);
                
                // Notify the game that save data was loaded (optional)
                // You might want to trigger a game state reload here
                window.dispatchEvent(new CustomEvent('wigdosxp-save-loaded', {
                    detail: event.data.saveData
                }));
            }
            
            // Send success response
            event.source.postMessage({
                type: 'loadDataResponse',
                messageId: event.data.messageId,
                success: true
            }, event.origin);
            
            log('Load data response sent');
            
        } catch (error) {
            console.error('Error loading save data:', error);
            
            // Send error response
            event.source.postMessage({
                type: 'loadDataResponse',
                messageId: event.data.messageId,
                success: false,
                error: error.message
            }, event.origin);
        }
    }
    
    // Optional: Provide helper functions for game developers
    window.WigdosXPSaveSystem = {
        // Check if running inside WigdosXP
        isInWigdosXP: function() {
            return window.parent !== window && window.parent.pushIframeSaveToFirestore;
        },
        
        // Request WigdosXP to save current data
        requestSave: function() {
            if (this.isInWigdosXP()) {
                // The save will happen automatically when the window closes
                // but you can also trigger it manually if needed
                log('Save will be triggered automatically on window close');
                return true;
            }
            return false;
        },
        
        // Listen for save data being loaded
        onSaveLoaded: function(callback) {
            window.addEventListener('wigdosxp-save-loaded', function(event) {
                callback(event.detail);
            });
        },
        
        // Get current game configuration
        getConfig: function() {
            return { ...GAME_CONFIG };
        }
    };
    
    log('WigdosXP Save System integration initialized');
    
})();

/*
 * INTEGRATION INSTRUCTIONS FOR GAME DEVELOPERS:
 * 
 * The WigdosXP save system now preserves your game's ENTIRE localStorage,
 * maintaining all your game's natural save data structure and keys.
 * 
 * 1. Update GAME_CONFIG at the top of this file:
 *    - gameId: Must match the ID used in WigdosXP's applications.js
 *    - saveKey: Only needed for legacy compatibility 
 *    - debug: Set to true for debugging
 * 
 * 2. Include this script in your game's HTML:
 *    <script src="wigdosxp-save-integration.js"></script>
 * 
 * 3. Your game can use localStorage normally - all keys/values will be preserved
 * 
 * 4. Optional: Listen for save data being loaded:
 *    WigdosXPSaveSystem.onSaveLoaded(function(allLocalStorageData) {
 *        // All your localStorage has been restored
 *        console.log('All localStorage restored:', allLocalStorageData);
 *    });
 * 
 * 5. The save system will automatically:
 *    - Save ALL your localStorage when the game window is closed in WigdosXP
 *    - Restore ALL your localStorage when the game window is opened in WigdosXP
 * 
 * EXAMPLE USAGE IN YOUR GAME:
 * 
 * // Your game can use localStorage naturally:
 * localStorage.setItem('level', '5');
 * localStorage.setItem('playerName', 'Alice');
 * localStorage.setItem('gameSettings', JSON.stringify({sound: true, music: false}));
 * 
 * // All of these will be automatically preserved by WigdosXP!
 * 
 * // Listen for WigdosXP save loading (optional)
 * WigdosXPSaveSystem.onSaveLoaded(function(allData) {
 *     // All your localStorage has been restored
 *     console.log('Game data restored by WigdosXP');
 *     // Optionally refresh your game state here
 * });
 */