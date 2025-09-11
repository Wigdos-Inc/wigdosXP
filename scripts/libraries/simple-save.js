/**
 * Simple Save System for WigdosXP Games
 * 
 * Reads save data from iframe localStorage and pushes it to Firestore.
 * Runs from parent window using WigdosXP's existing Firebase connection.
 * 
 * Usage:
 *   const saved = await pushIframeSaveToFirestore('undertale');
 *   const loaded = await loadFirestoreToIframe('undertale');
 */

// Parent-side: read iframe localStorage and push to Firestore
async function pushIframeSaveToFirestore(gameId) {
    const iframe = document.getElementById('gameIframe'); // ensure your iframe has this id
    if (!iframe) throw new Error('iframe #gameIframe not found');

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
    const iframe = document.getElementById('gameIframe');
    if (!iframe) throw new Error('iframe #gameIframe not found');

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

// Make available globally
window.pushIframeSaveToFirestore = pushIframeSaveToFirestore;
window.loadFirestoreToIframe = loadFirestoreToIframe;