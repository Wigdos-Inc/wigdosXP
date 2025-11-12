// ============================================================================
// Message Handler - PostMessage Communication
// ES6 Module
// ============================================================================

import { validateOrigin, unwrapSaveData } from './helpers.js';

async function handleInitialSaveDataRequest(event) {
    const gameId = event.data.gameId;
    const messageId = event.data.messageId;
    
    window.Logger.info('SaveSystem', `Processing initial save data request for ${gameId}`);
    
    try {
        const user = localStorage.getItem('username') || 'guest';
        if (user === 'guest') {
            window.Logger.info('SaveSystem', `Guest user - no save data for ${gameId}`);
            event.source.postMessage({
                type: 'initialSaveDataResponse',
                messageId: messageId,
                allLocalStorageData: {}
            }, event.origin);
            return;
        }

        const api = window.firebaseAPI;
        if (!api || !api.db) {
            window.Logger.warn('SaveSystem', `Firebase not available for ${gameId}`);
            event.source.postMessage({
                type: 'initialSaveDataResponse',
                messageId: messageId,
                allLocalStorageData: {}
            }, event.origin);
            return;
        }

        window.Logger.debug('SaveSystem', `Fetching save data from Firebase for ${gameId}`);
        const userDoc = await api.getDoc(api.doc(api.db, 'game_saves', user));

        let allLocalStorageData = {};
        
        if (userDoc.exists()) {
            const docData = userDoc.data();
            
            if (docData[gameId]) {
                try {
                    const raw = JSON.parse(docData[gameId]);
                    allLocalStorageData = unwrapSaveData(raw);
                    window.Logger.info('SaveSystem', `Found save data for ${gameId}`, { 
                        keys: Object.keys(allLocalStorageData).length 
                    });
                } catch (e) {
                    window.Logger.warn('SaveSystem', 'Failed to parse save data', e);
                    allLocalStorageData = {};
                }
            } else {
                window.Logger.info('SaveSystem', `No save data found for ${gameId}`);
            }
        }

        event.source.postMessage({
            type: 'initialSaveDataResponse',
            messageId: messageId,
            allLocalStorageData: allLocalStorageData
        }, event.origin);
        
        window.Logger.debug('SaveSystem', `Initial save data response sent for ${gameId}`);
        
    } catch (error) {
        window.Logger.error('SaveSystem', `Error handling initial save data request for ${gameId}`, error);
        event.source.postMessage({
            type: 'initialSaveDataResponse',
            messageId: messageId,
            allLocalStorageData: {},
            error: error.message
        }, event.origin);
    }
}

function handleCloseWindowRequest(event) {
    window.Logger.info('WindowManager', 'Close window request from iframe');
    // Find the iframe that sent the message
    const iframe = Array.from(document.querySelectorAll('iframe.appContent')).find(
        frame => frame.contentWindow === event.source
    );
    if (iframe) {
        const appIndex = iframe.dataset.appIndex;
        window.Logger.debug('WindowManager', `Found iframe with appIndex: ${appIndex}`);
        const windowObj = window.windows.object.find(w => w && w.index != null && w.index == appIndex);
        if (windowObj && typeof windowObj.close === 'function') {
            window.Logger.info('WindowManager', `Closing window ${appIndex}`);
            windowObj.close();
        } else {
            window.Logger.warn('WindowManager', `Window object not found or invalid for appIndex ${appIndex}`);
        }
    } else {
        window.Logger.warn('WindowManager', 'Could not find iframe that sent close request');
    }
}

export function initializeMessageListener() {
    window.addEventListener('message', function(event) {
        if (!validateOrigin(event.origin)) {
            window.Logger.warn('SaveSystem', 'Rejected message from untrusted origin', event.origin);
            return;
        }
        
        if (!event.data) return;
        
        // Handle closeWindow action from iframe
        if (event.data.action === 'closeWindow') {
            handleCloseWindowRequest(event);
            return;
        }
        
        if (!event.data.type) return;
        
        if (event.data.type === 'getInitialSaveData') {
            window.Logger.info('SaveSystem', 'Game requesting initial save data', event.data);
            handleInitialSaveDataRequest(event);
        }
        
        if (event.data.type === 'wigdosxp-integration-ready') {
            window.Logger.info('SaveSystem', 'Game integration ready', event.data.gameId);
        }
    });
}

export { handleInitialSaveDataRequest, handleCloseWindowRequest };
