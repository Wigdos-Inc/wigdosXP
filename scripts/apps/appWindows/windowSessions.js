// Simple Window Sessions Manager
// Persists open windows (app id, position, size, full state) to localStorage per-user

const windowSessions = (function() {
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
    function saveWindow(session) {
        if (!session || typeof session.index === 'undefined') return false;
        const all = _getAll();
        const existing = all.find(s => s.index === session.index);
        if (existing) Object.assign(existing, session);
        else all.push(session);
        return _saveAll(all);
    }

    function removeWindow(index) {
        const all = _getAll().filter(s => s.index !== index);
        return _saveAll(all);
    }

    function getSessions() { return _getAll(); }

    // Restore helper: returns an array of session objects for re-creation
    function restoreAll() { return _getAll(); }

    // Clear all saved sessions
    function clearAll() { localStorage.removeItem(STORAGE_KEY); }

    return {
        saveWindow,
        removeWindow,
        getSessions,
        restoreAll,
        clearAll
    };
})();

// Expose on window for simple usage by other scripts
window.windowSessions = window.windowSessions || windowSessions;
