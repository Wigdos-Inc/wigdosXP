// ============================================================================
// Utility Functions for Save Management
// ============================================================================

async function exportSaveData(gameId) {
    try {
        const user = localStorage.getItem('username') || 'guest';
        if (user === 'guest') {
            Logger.warn('SaveSystem', 'Cannot export save data for guest user');
            return null;
        }

        const api = window.firebaseAPI;
        if (!api || !api.db) {
            Logger.warn('SaveSystem', 'Firebase not available');
            return null;
        }

        const userDoc = await api.getDoc(api.doc(api.db, 'game_saves', user));
        const docData = userDoc.exists() ? userDoc.data() : {};
        let saveData = null;
        // Prefer v2
        if (docData[`${gameId}_v2`]) {
            saveData = JSON.parse(docData[`${gameId}_v2`]);
        } else if (docData[gameId]) {
            saveData = JSON.parse(docData[gameId]);
        }
        if (saveData) {
            
            const blob = new Blob([JSON.stringify(saveData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${gameId}_save_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Logger.info('SaveSystem', `Save data exported for ${gameId}`);
            return true;
        } else {
            Logger.warn('SaveSystem', `No save data to export for ${gameId}`);
            return false;
        }
    } catch (err) {
        Logger.error('SaveSystem', 'Export failed', err);
        return false;
    }
}

async function importSaveData(gameId, file) {
    try {
        const text = await file.text();
        const saveData = JSON.parse(text);
        
        const user = localStorage.getItem('username') || 'guest';
        if (user === 'guest') {
            Logger.warn('SaveSystem', 'Cannot import save data for guest user');
            return false;
        }

        const api = window.firebaseAPI;
        if (!api || !api.db) {
            Logger.warn('SaveSystem', 'Firebase not available');
            return false;
        }

        // If imported data is a wrapped save (v2), write to v2 key; otherwise write legacy
        const isWrapped = saveData && saveData.version;
        const payload = isWrapped ? { [`${gameId}_v2`]: JSON.stringify(saveData), [gameId]: JSON.stringify(saveData.data || {}) } : { [gameId]: JSON.stringify(saveData) };

        await api.setDoc(
            api.doc(api.db, 'game_saves', user),
            payload,
            { merge: true }
        );
        
        Logger.info('SaveSystem', `Save data imported for ${gameId}`);
        return true;
    } catch (err) {
        Logger.error('SaveSystem', 'Import failed', err);
        return false;
    }
}

async function deleteSaveData(gameId) {
    try {
        const user = localStorage.getItem('username') || 'guest';
        if (user === 'guest') {
            Logger.warn('SaveSystem', 'Cannot delete save data for guest user');
            return false;
        }

        const api = window.firebaseAPI;
        if (!api || !api.db) {
            Logger.warn('SaveSystem', 'Firebase not available');
            return false;
        }

        // Remove both legacy and v2 keys
        const patch = { [gameId]: api.deleteField(), [`${gameId}_v2`]: api.deleteField() };
        await api.setDoc(
            api.doc(api.db, 'game_saves', user),
            patch,
            { merge: true }
        );
        
        Logger.info('SaveSystem', `Save data deleted for ${gameId}`);
        return true;
    } catch (err) {
        Logger.error('SaveSystem', 'Delete failed', err);
        return false;
    }
}

async function listBackups(gameId) {
    try {
        const user = localStorage.getItem('username') || 'guest';
        if (user === 'guest') return [];

        const api = window.firebaseAPI;
        if (!api || !api.db) return [];

        const backupsRef = api.doc(api.db, 'game_saves_backups', user);
        const backupsDoc = await api.getDoc(backupsRef);
        
        if (backupsDoc.exists() && backupsDoc.data()[gameId]) {
            return backupsDoc.data()[gameId].map(backup => ({
                timestamp: backup.timestamp,
                date: new Date(backup.timestamp).toLocaleString()
            }));
        }
        
        return [];
    } catch (err) {
        Logger.error('SaveSystem', 'Failed to list backups', err);
        return [];
    }
}

async function restoreBackup(gameId, timestamp) {
    try {
        const user = localStorage.getItem('username') || 'guest';
        if (user === 'guest') {
            Logger.warn('SaveSystem', 'Cannot restore backup for guest user');
            return false;
        }

        const api = window.firebaseAPI;
        if (!api || !api.db) {
            Logger.warn('SaveSystem', 'Firebase not available');
            return false;
        }

        const backupsRef = api.doc(api.db, 'game_saves_backups', user);
        const backupsDoc = await api.getDoc(backupsRef);
        
        if (backupsDoc.exists() && backupsDoc.data()[gameId]) {
            const backup = backupsDoc.data()[gameId].find(b => b.timestamp === timestamp);
            
            if (backup) {
                await api.setDoc(
                    api.doc(api.db, 'game_saves', user),
                    { [gameId]: JSON.stringify(backup.data) },
                    { merge: true }
                );
                
                Logger.info('SaveSystem', `Backup restored for ${gameId} from ${new Date(timestamp).toLocaleString()}`);
                return true;
            }
        }
        
        Logger.warn('SaveSystem', `Backup not found for ${gameId} at timestamp ${timestamp}`);
        return false;
    } catch (err) {
        Logger.error('SaveSystem', 'Restore backup failed', err);
        return false;
    }
}

// ============================================================================
// Expose API
// ============================================================================

window.WigdosXPSaveAPI = {
    exportSave: exportSaveData,
    importSave: importSaveData,
    deleteSave: deleteSaveData,
    listBackups: listBackups,
    restoreBackup: restoreBackup,
    Logger: Logger
};

// ============================================================================
// Initialization
// ============================================================================

localStorage.removeItem("suActive");
localStorage.removeItem("suData");

Logger.info('WigdosXP', 'Window management and save system initialized');