// Game Utilities
// Shared helper functions for P5.js games

/**
 * Initialize background stars for space-themed games
 * @param {number} count - Number of stars to create (default: 500)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} sizeIndex - Game size index (0 for small, 1 for large)
 * @param {Function} rng - Random number generator function
 * @param {Function} color - P5.js color function
 * @returns {Array} Array of star data objects
 */
function initializeBackgroundStars(count = 500, width, height, sizeIndex, rng, color) {
    const starData = [];
    
    for (let i = 0; i < count; i++) {
        starData.push({
            size   : [rng(2, false)+1, rng(4, false)+2][sizeIndex],
            x_pos  : rng(width, false),
            y_pos  : rng(height, false),
            colour : color(rng(100, true)+150, rng(100, true)+150, rng(100, true)+150),
            opacity: rng(50, true) 
        });
    }
    return starData;
}

// Export to window object for use in games
if (typeof window !== 'undefined') {
    window.GameUtils = {
        initializeBackgroundStars
    };
}
