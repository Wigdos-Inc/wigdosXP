/* Loading SFX */

function playerrorSound() {

    // Returns the Audio to what Called the Function, Allowing Onended to be Used There
    return new Promise((resolve) => {

        const audio = new Audio('assets/sfx/error.mp3');
        audio.play();

        audio.onended = () => resolve(audio);
    });
}

try {
} catch (error) {
    console.error(error.message);
    playerrorSound(); 
}


function getUser() {

    return localStorage.getItem("username");
}



const imgs = document.getElementsByTagName("img");
for (let i=0; i < imgs.length; i++) {

    let size;
    if (imgs[i].offsetWidth < 100) size = "16x";
    else if (imgs[i].offsetWidth < 200) size = "32x";
    else size = "48x";

    imgs[i].src = `assets/images/icons/${size}/bombs.png`;
}



// Catch errors for further handling if needed
const realConsoleError = console.error;
console.error = function(...args) {

    // Display Error in Console
    realConsoleError.apply(console, args);

    // Log Out User when Database Overloaded
    if (args[1] && typeof args[1] === "string" && args[1].includes("resource-exhausted")) {

        window.alert("Account functions are currently unavailable. Please try again later.\nYou will now be logged out.");

        if (document.getElementsByClassName("accBox")[0]) {
            localStorage.clear();
            localStorage.clear();
            localStorage.setItem("username", "guest");
        }
        else power.stage1(false);

    }
}

// WigdosXP Save System - Parent-side iframe localStorage management
// Reads/writes iframe localStorage directly and syncs with Firebase

// Parent-side: read iframe localStorage and push to Firestore
async function pushIframeSaveToFirestore(gameId) {
    const iframe = document.getElementById('gameIframe') || document.querySelector('iframe.appContent');
    if (!iframe) throw new Error('Game iframe not found');

    let raw;
    
    // Try direct access first (for same-origin iframes)
    try {
        raw = iframe.contentWindow.localStorage.getItem(`${gameId}SaveData`);
    } catch (err) {
        // Cross-origin iframe - use postMessage
        console.log('Cross-origin iframe detected, using postMessage for save operation');
        return await pushSaveViaPostMessage(iframe, gameId);
    }

    if (!raw) return false; // nothing to save

    const data = JSON.parse(raw);
    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') return false; // don't upload guest saves

    // Using WigdosXP's existing Firebase connection
    const api = window.firebaseAPI;
    if (!api || !api.db) return false; // Firebase not available

    await api.setDoc(
        api.doc(api.db, 'game_saves', user),
        { [gameId]: JSON.stringify(data) },
        { merge: true }
    );
    return true;
}

// Handle cross-origin save via postMessage
async function pushSaveViaPostMessage(iframe, gameId) {
    return new Promise((resolve) => {
        const messageId = `save_${gameId}_${Date.now()}`;
        
        // Set up response listener
        const handleResponse = (event) => {
            if (event.data.type === 'saveDataResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);
                
                if (event.data.saveData) {
                    // Upload to Firebase
                    uploadSaveDataToFirebase(gameId, event.data.saveData)
                        .then(success => resolve(success))
                        .catch(() => resolve(false));
                } else {
                    resolve(false); // No save data
                }
            }
        };
        
        window.addEventListener('message', handleResponse);
        
        // Request save data from iframe
        iframe.contentWindow.postMessage({
            type: 'getSaveData',
            gameId: gameId,
            messageId: messageId
        }, '*');
        
        // Timeout after 5 seconds
        setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            resolve(false);
        }, 5000);
    });
}

// Helper function to upload save data to Firebase
async function uploadSaveDataToFirebase(gameId, saveData) {
    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') return false;

    const api = window.firebaseAPI;
    if (!api || !api.db) return false;

    try {
        await api.setDoc(
            api.doc(api.db, 'game_saves', user),
            { [gameId]: JSON.stringify(saveData) },
            { merge: true }
        );
        return true;
    } catch (err) {
        console.error('Firebase save error:', err);
        return false;
    }
}

// Parent-side: load from Firestore and put into iframe localStorage
async function loadFirestoreToIframe(gameId) {
    const iframe = document.getElementById('gameIframe') || document.querySelector('iframe.appContent');
    if (!iframe) throw new Error('Game iframe not found');

    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') return false; // no remote saves for guests

    const api = window.firebaseAPI;
    if (!api || !api.db) return false; // Firebase not available

    try {
        const userDoc = await api.getDoc(api.doc(api.db, 'game_saves', user));
        if (userDoc.exists() && userDoc.data()[gameId]) {
            const data = userDoc.data()[gameId];
            
            // Try direct access first (for same-origin iframes)
            try {
                iframe.contentWindow.localStorage.setItem(`${gameId}SaveData`, data);
                return true;
            } catch (err) {
                // Cross-origin iframe - use postMessage
                console.log('Cross-origin iframe detected, using postMessage for load operation');
                return await loadSaveViaPostMessage(iframe, gameId, data);
            }
        }
    } catch (err) {
        console.error('Load error:', err);
        return false;
    }
    
    return false;
}

// Handle cross-origin load via postMessage
async function loadSaveViaPostMessage(iframe, gameId, saveData) {
    return new Promise((resolve) => {
        const messageId = `load_${gameId}_${Date.now()}`;
        
        // Set up response listener
        const handleResponse = (event) => {
            if (event.data.type === 'loadDataResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);
                resolve(event.data.success === true);
            }
        };
        
        window.addEventListener('message', handleResponse);
        
        // Send save data to iframe
        iframe.contentWindow.postMessage({
            type: 'loadSaveData',
            gameId: gameId,
            saveData: JSON.parse(saveData), // Parse the JSON string
            messageId: messageId
        }, '*');
        
        // Timeout after 5 seconds
        setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            resolve(false);
        }, 5000);
    });
}

// Make save functions available globally
window.pushIframeSaveToFirestore = pushIframeSaveToFirestore;
window.loadFirestoreToIframe = loadFirestoreToIframe;