// ============================================================================
// Save System - Core Save/Load Operations
// ES6 Module - Main entry point for save system
// ============================================================================

import { SAVE_CONFIG } from './saveConfig.js';
import { sleep, unwrapSaveData } from './helpers.js';
import { uploadSaveDataToFirebase, exportSaveData, importSaveData, deleteSaveData, listBackups, restoreBackup } from './cloudSync.js';
import { initializeMessageListener } from './messageHandler.js';

// Initialize the message listener on module load
initializeMessageListener();

export async function pushIframeSaveToFirestore(gameId, iframe) {
    iframe = iframe || document.getElementById('gameIframe') || document.querySelector('iframe.appContent');
    if (!iframe) {
        window.Logger.error('SaveSystem', 'Game iframe not found');
        throw new Error('Game iframe not found');
    }

    let allLocalStorageData;
    
    try {
        const iframeStorage = iframe.contentWindow.localStorage;
        allLocalStorageData = {};
        
        for (let i = 0; i < iframeStorage.length; i++) {
            const key = iframeStorage.key(i);
            allLocalStorageData[key] = iframeStorage.getItem(key);
        }
        
        window.Logger.debug('SaveSystem', `Retrieved ${Object.keys(allLocalStorageData).length} localStorage items`);
    } catch (err) {
        window.Logger.info('SaveSystem', 'Cross-origin iframe detected, using postMessage');
        return await pushSaveViaPostMessageWithRetry(iframe, gameId);
    }

    if (Object.keys(allLocalStorageData).length === 0) {
        window.Logger.info('SaveSystem', 'No data to save');
        return false;
    }

    return await uploadSaveDataToFirebase(gameId, allLocalStorageData);
}

async function pushSaveViaPostMessageWithRetry(iframe, gameId, attempts = SAVE_CONFIG.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
        try {
            window.Logger.info('SaveSystem', `Save attempt ${i + 1}/${attempts} for ${gameId}`);
            const result = await pushSaveViaPostMessage(iframe, gameId);
            if (result) return true;
        } catch (e) {
            window.Logger.warn('SaveSystem', `Save attempt ${i + 1} failed for ${gameId}`, e);
            if (i < attempts - 1) {
                await sleep(SAVE_CONFIG.retryDelay);
            }
        }
    }
    window.Logger.error('SaveSystem', `All save attempts failed for ${gameId}`);
    return false;
}

async function pushSaveViaPostMessage(iframe, gameId) {
    return new Promise((resolve) => {
        const messageId = `save_${gameId}_${Date.now()}`;
        let iframeOrigin = '*';
        
        try {
            iframeOrigin = new URL(iframe.src).origin;
        } catch (e) {
            iframeOrigin = '*';
        }

        window.Logger.debug('SaveSystem', `Attempting cross-origin save for ${gameId}`, {
            messageId,
            iframeSrc: iframe.src,
            iframeOrigin
        });
        
        const handleResponse = (event) => {
            if (iframeOrigin !== '*' && event.origin !== iframeOrigin) return;
            
            if (event.data && event.data.type === 'saveDataResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);

                if (event.data.allLocalStorageData && Object.keys(event.data.allLocalStorageData).length > 0) {
                    window.Logger.info('SaveSystem', `Save data received for ${gameId}, uploading to Firebase`);
                    uploadSaveDataToFirebase(gameId, event.data.allLocalStorageData)
                        .then(success => {
                            window.Logger.info('SaveSystem', `Firebase upload ${success ? 'successful' : 'failed'} for ${gameId}`);
                            resolve(success);
                        })
                        .catch((err) => {
                            window.Logger.error('SaveSystem', `Firebase upload error for ${gameId}`, err);
                            resolve(false);
                        });
                } else {
                    window.Logger.info('SaveSystem', `No save data received for ${gameId}`);
                    resolve(false);
                }
            }
        };
        
        window.addEventListener('message', handleResponse);
        
        window.Logger.debug('SaveSystem', `Sending getAllLocalStorageData to ${gameId} iframe`);
        try {
            iframe.contentWindow.postMessage({
                type: 'getAllLocalStorageData',
                gameId: gameId,
                messageId: messageId
            }, iframeOrigin);
        } catch (err) {
            window.Logger.warn('SaveSystem', 'postMessage to iframe failed, falling back to "*" targetOrigin', err);
            try {
                iframe.contentWindow.postMessage({
                    type: 'getAllLocalStorageData',
                    gameId: gameId,
                    messageId: messageId
                }, '*');
            } catch (e) {
                window.Logger.error('SaveSystem', 'All postMessage attempts failed', e);
            }
        }
        
        setTimeout(() => {
            window.Logger.warn('SaveSystem', `Cross-origin save timeout for ${gameId}`);
            window.removeEventListener('message', handleResponse);
            resolve(false);
        }, SAVE_CONFIG.timeout);
    });
}

export async function loadFirestoreToIframe(gameId, iframe) {
    iframe = iframe || document.getElementById('gameIframe') || document.querySelector('iframe.appContent');
    if (!iframe) {
        window.Logger.error('SaveSystem', 'Game iframe not found');
        throw new Error('Game iframe not found');
    }

    window.Logger.info('SaveSystem', `Loading save data for ${gameId}`);

    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') {
        window.Logger.info('SaveSystem', 'Guest user, skipping save load');
        return false;
    }

    const api = window.firebaseAPI;
    if (!api || !api.db) {
        window.Logger.warn('SaveSystem', 'Firebase not available');
        return false;
    }

    try {
        window.Logger.debug('SaveSystem', `Fetching save data from Firebase for ${gameId}`);
        const userDoc = await api.getDoc(api.doc(api.db, 'game_saves', user));
        
        if (!userDoc.exists()) {
            window.Logger.info('SaveSystem', `No save document found for ${gameId}`);
            return false;
        }

        const docData = userDoc.data();
        
        if (!docData[gameId]) {
            window.Logger.info('SaveSystem', `No save data found for ${gameId}`);
            return false;
        }

        let allLocalStorageData = null;
        
        try {
            const raw = JSON.parse(docData[gameId]);
            allLocalStorageData = unwrapSaveData(raw);
            window.Logger.info('SaveSystem', `Save data found for ${gameId}`, {
                keys: Object.keys(allLocalStorageData).length
            });
        } catch (e) {
            window.Logger.error('SaveSystem', 'Failed to parse save data', e);
            return false;
        }

        if (allLocalStorageData && Object.keys(allLocalStorageData).length > 0) {
            // Always use postMessage to restore save data
            try {
                return await loadSaveViaPostMessage(iframe, gameId, allLocalStorageData);
            } catch (err) {
                window.Logger.error('SaveSystem', `Failed to load save via postMessage for ${gameId}`, err);
                return false;
            }
        } else {
            window.Logger.info('SaveSystem', `No save data to load for ${gameId}`);
        }
    } catch (err) {
        window.Logger.error('SaveSystem', `Load error for ${gameId}`, err);
        return false;
    }
    
    return false;
}

async function loadSaveViaPostMessage(iframe, gameId, allLocalStorageData) {
    return new Promise((resolve) => {
        const messageId = `load_${gameId}_${Date.now()}`;
        let iframeOrigin = '*';
        
        try {
            iframeOrigin = new URL(iframe.src).origin;
        } catch (e) {
            iframeOrigin = '*';
        }

        window.Logger.debug('SaveSystem', `Attempting cross-origin load for ${gameId}`, {
            messageId,
            dataKeys: Object.keys(allLocalStorageData).length,
            iframeOrigin
        });
        
        const handleResponse = (event) => {
            if (iframeOrigin !== '*' && event.origin !== iframeOrigin) return;
            
            if (event.data && event.data.type === 'loadDataResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);
                window.Logger.info('SaveSystem', `Load ${event.data.success ? 'successful' : 'failed'} for ${gameId}`);
                resolve(event.data.success === true);
            }
        };
        
        window.addEventListener('message', handleResponse);
        
        window.Logger.debug('SaveSystem', `Sending setAllLocalStorageData to ${gameId} iframe`);
        try {
            iframe.contentWindow.postMessage({
                type: 'setAllLocalStorageData',
                gameId: gameId,
                allLocalStorageData: allLocalStorageData,
                messageId: messageId
            }, iframeOrigin);
        } catch (err) {
            window.Logger.warn('SaveSystem', 'postMessage to iframe failed, falling back to "*" targetOrigin', err);
            try {
                iframe.contentWindow.postMessage({
                    type: 'setAllLocalStorageData',
                    gameId: gameId,
                    allLocalStorageData: allLocalStorageData,
                    messageId: messageId
                }, '*');
            } catch (e) {
                window.Logger.error('SaveSystem', 'All postMessage attempts failed', e);
            }
        }
        
        setTimeout(() => {
            window.Logger.warn('SaveSystem', `Cross-origin load timeout for ${gameId}`);
            window.removeEventListener('message', handleResponse);
            resolve(false);
        }, SAVE_CONFIG.timeout);
    });
}

// Also export the cloud sync functions for easy access
export { exportSaveData, importSaveData, deleteSaveData, listBackups, restoreBackup };

// Expose API globally for backward compatibility
window.SaveSystem = {
    pushIframeSaveToFirestore,
    loadFirestoreToIframe,
    exportSaveData,
    importSaveData,
    deleteSaveData,
    listBackups,
    restoreBackup
};
