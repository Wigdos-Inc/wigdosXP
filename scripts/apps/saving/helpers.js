// ============================================================================
// Save System Utility Functions
// ============================================================================

function validateOrigin(origin) {
    return window.ALLOWED_ORIGINS.includes(origin) || window.ALLOWED_ORIGINS.includes('*');
}

function generateChecksum(data) {
    try {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    } catch (e) {
        return null;
    }
}

function validateChecksum(data, checksum) {
    return generateChecksum(data) === checksum;
}

function wrapSaveData(gameId, data) {
    return {
        version: window.SAVE_CONFIG.version,
        gameId: gameId,
        timestamp: Date.now(),
        data: data,
        checksum: generateChecksum(data)
    };
}

function unwrapSaveData(wrapped) {
    // If it's not wrapped (old data or plain object), return as-is
    if (!wrapped || !wrapped.version || !wrapped.data) {
        window.Logger.info('SaveSystem', 'Save data is not wrapped format, returning as-is');
        return wrapped;
    }
    
    // Validate checksum
    if (!validateChecksum(wrapped.data, wrapped.checksum)) {
        window.Logger.warn('SaveSystem', 'Save data checksum validation failed, returning inner data anyway');
    }
    
    return wrapped.data;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Expose globally
window.SaveHelpers = {
    validateOrigin,
    generateChecksum,
    validateChecksum,
    wrapSaveData,
    unwrapSaveData,
    sleep
};
