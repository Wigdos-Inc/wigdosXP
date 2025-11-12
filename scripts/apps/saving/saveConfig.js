// ============================================================================
// Save System Configuration & Constants
// ============================================================================

const SAVE_CONFIG = {
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
    version: '1.0',
    maxBackups: 5
};

const ALLOWED_ORIGINS = [
    window.location.origin,
    'https://wigdos-inc.github.io',
    '*'
];

// Expose globally
window.SAVE_CONFIG = window.SAVE_CONFIG || SAVE_CONFIG;
window.ALLOWED_ORIGINS = window.ALLOWED_ORIGINS || ALLOWED_ORIGINS;
