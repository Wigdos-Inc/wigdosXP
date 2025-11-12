// ============================================================================
// Save System Configuration & Constants
// ES6 Module
// ============================================================================

export const SAVE_CONFIG = {
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
    version: '1.0',
    maxBackups: 5
};

export const ALLOWED_ORIGINS = [
    window.location.origin,
    'https://wigdos-inc.github.io',
    '*'
];
