/*
 * WigdosXP Cross-Origin Save System Integration
 * 
 * This file provides a template for game developers to integrate their games
 * with WigdosXP's cross-origin save system using postMessage communication.
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
            case 'getSaveData':
                handleGetSaveData(event);
                break;
                
            case 'loadSaveData':
                handleLoadSaveData(event);
                break;
        }
    });
    
    // Handle save data request from WigdosXP
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
    
    // Handle load data request from WigdosXP
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
 * 1. Update GAME_CONFIG at the top of this file:
 *    - gameId: Must match the ID used in WigdosXP's applications.js
 *    - saveKey: The localStorage key your game uses for save data
 *    - debug: Set to true for debugging
 * 
 * 2. Include this script in your game's HTML:
 *    <script src="wigdosxp-save-integration.js"></script>
 * 
 * 3. Your game should store save data as JSON in localStorage using the saveKey
 * 
 * 4. Optional: Listen for save data being loaded:
 *    WigdosXPSaveSystem.onSaveLoaded(function(saveData) {
 *        // Apply the loaded save data to your game
 *        console.log('Save data loaded:', saveData);
 *    });
 * 
 * 5. The save system will automatically:
 *    - Save your data when the game window is closed in WigdosXP
 *    - Load your data when the game window is opened in WigdosXP
 * 
 * EXAMPLE USAGE IN YOUR GAME:
 * 
 * // Save game data
 * function saveGame() {
 *     const saveData = {
 *         level: currentLevel,
 *         score: playerScore,
 *         progress: gameProgress
 *     };
 *     localStorage.setItem('your-game-save-data', JSON.stringify(saveData));
 * }
 * 
 * // Load game data
 * function loadGame() {
 *     const saved = localStorage.getItem('your-game-save-data');
 *     if (saved) {
 *         const saveData = JSON.parse(saved);
 *         currentLevel = saveData.level;
 *         playerScore = saveData.score;
 *         gameProgress = saveData.progress;
 *     }
 * }
 * 
 * // Listen for WigdosXP save loading
 * WigdosXPSaveSystem.onSaveLoaded(function(saveData) {
 *     // The save data has been loaded by WigdosXP
 *     // You might want to reload your game state here
 *     loadGame();
 * });
 */