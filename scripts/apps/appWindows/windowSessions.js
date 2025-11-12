// Simple Window Sessions Manager
// Persists open windows (app id, position, size, full state) to localStorage per-user
// ES6 Module

const STORAGE_KEY = 'wigdos_window_sessions_v1';

function _getAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
}
function _saveAll(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); return true; }
    catch (e) { console.warn('Could not persist sessions', e); return false; }
}

// Save or update a single session entry by window index
export function saveWindow(session) {
    if (!session || typeof session.index === 'undefined') return false;
    const all = _getAll();
    const existing = all.find(s => s.index === session.index);
    if (existing) Object.assign(existing, session);
    else all.push(session);
    return _saveAll(all);
}

export function removeWindow(index) {
    const all = _getAll().filter(s => s.index !== index);
    return _saveAll(all);
}

export function getSessions() { return _getAll(); }

// Restore helper: returns an array of session objects for re-creation
export function restoreAll() { return _getAll(); }

// Clear all saved sessions
export function clearAll() { localStorage.removeItem(STORAGE_KEY); }

// Expose on window for backward compatibility
window.windowSessions = {
    saveWindow,
    removeWindow,
    getSessions,
    restoreAll,
    clearAll
};
