// WigTube Debug Utilities
// Shared debug logging configuration for WigTube modules

/**
 * Initialize debug mode from URL parameters
 * Only runs once per page load
 */
if (typeof window.WIGTUBE_DEBUG === 'undefined') {
    window.WIGTUBE_DEBUG = new URLSearchParams(window.location.search).has('debug');
}

/**
 * Create a debug logger function for a specific module
 * @param {string} moduleName - Name of the module (e.g., 'WigTubeDB', 'WigTubePlayer')
 * @returns {Function} Debug logging function
 */
function createDebugLogger(moduleName) {
    return function(...args) {
        if (window.WIGTUBE_DEBUG) {
            console.log(`[${moduleName}]`, ...args);
        }
    };
}

// Export to window object
if (typeof window !== 'undefined') {
    window.WigTubeDebug = {
        createDebugLogger
    };
}
