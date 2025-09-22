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

    // Try to access iframe localStorage (works only if same-origin)
    let raw;
    try {
        raw = iframe.contentWindow.localStorage.getItem(`${gameId}SaveData`);
    } catch (err) {
        throw new Error('Cannot access iframe localStorage — likely cross-origin. Serve the game from the same origin or add a postMessage shim in the game.');
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
            // Put data into iframe localStorage
            iframe.contentWindow.localStorage.setItem(`${gameId}SaveData`, data);
            return true;
        }
    } catch (err) {
        console.error('Load error:', err);
        return false;
    }
    
    return false;
}

// Make save functions available globally
window.pushIframeSaveToFirestore = pushIframeSaveToFirestore;
window.loadFirestoreToIframe = loadFirestoreToIframe;