// ============================================================================
// Global Logging System
// ============================================================================

const Logger = {
    levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
    currentLevel: 2,
    
    log(level, context, message, data) {
        if (this.levels[level] <= this.currentLevel) {
            const timestamp = new Date().toISOString();
            const logFn = console[level.toLowerCase()] || console.log;
            if (data !== undefined) {
                logFn(`[${timestamp}] [${context}]`, message, data);
            } else {
                logFn(`[${timestamp}] [${context}]`, message);
            }
        }
    },
    
    error(context, message, data) { this.log('ERROR', context, message, data); },
    warn(context, message, data) { this.log('WARN', context, message, data); },
    info(context, message, data) { this.log('INFO', context, message, data); },
    debug(context, message, data) { this.log('DEBUG', context, message, data); }
};

// Expose globally
window.Logger = window.Logger || Logger;
