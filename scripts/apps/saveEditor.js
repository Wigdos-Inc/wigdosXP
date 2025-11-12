// ============================================================================
// Save Editor API - Delegates to CloudSync module
// ============================================================================

// Expose API that delegates to CloudSync
window.WigdosXPSaveAPI = {
    exportSave: (gameId) => window.CloudSync.exportSaveData(gameId),
    importSave: (gameId, file) => window.CloudSync.importSaveData(gameId, file),
    deleteSave: (gameId) => window.CloudSync.deleteSaveData(gameId),
    listBackups: (gameId) => window.CloudSync.listBackups(gameId),
    restoreBackup: (gameId, timestamp) => window.CloudSync.restoreBackup(gameId, timestamp),
    Logger: window.Logger
};

// ============================================================================
// Initialization
// ============================================================================

localStorage.removeItem("suActive");
localStorage.removeItem("suData");

window.Logger.info('WigdosXP', 'Save Editor API initialized');