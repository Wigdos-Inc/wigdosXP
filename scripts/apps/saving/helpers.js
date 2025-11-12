// ============================================================================
// Save System Utility Functions
// ES6 Module
// ============================================================================

import { SAVE_CONFIG, ALLOWED_ORIGINS } from './saveConfig.js';

export function validateOrigin(origin) {
    return ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');
}

export function generateChecksum(data) {
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

export function validateChecksum(data, checksum) {
    return generateChecksum(data) === checksum;
}

export function wrapSaveData(gameId, data) {
    return {
        version: SAVE_CONFIG.version,
        gameId: gameId,
        timestamp: Date.now(),
        data: data,
        checksum: generateChecksum(data)
    };
}

export function unwrapSaveData(wrapped) {
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

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
