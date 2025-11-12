// ============================================================================
// UIBuilder - Centralized UI Element Creation and Style Management
// ============================================================================

const UIBuilder = (function() {
    
    // ========================================================================
    // Predefined Button Gradients (commonly used styles)
    // ========================================================================
    const GRADIENTS = {
        blue: 'linear-gradient(to bottom right, #96B4F9, #6794fa, #4176F5, #2857c6, #225DE5)',
        red: 'linear-gradient(to bottom right, #F99696, #fa6767, #F54141, #c62828, #E52222)',
        green: 'linear-gradient(to bottom right, #96F9A4, #67fa7a, #41F557, #28c644, #22E53a)',
        default: 'linear-gradient(to bottom right, #96B4F9, #6794fa, #4176F5, #2857c6, #225DE5)'
    };

    // ========================================================================
    // Core Element Creation
    // ========================================================================
    
    /**
     * Create a generic DOM element with properties
     * @param {string} tag - Element tag name
     * @param {Object} options - Configuration options
     * @param {string|string[]} options.classes - CSS class(es) to add
     * @param {Object} options.styles - CSS styles as key-value pairs
     * @param {Object} options.attributes - HTML attributes to set
     * @param {string} options.id - Element ID
     * @param {string} options.innerHTML - Inner HTML content
     * @param {string} options.textContent - Text content
     * @returns {HTMLElement}
     */
    function create(tag, options = {}) {
        const element = document.createElement(tag);
        
        // Add classes
        if (options.classes) {
            const classes = Array.isArray(options.classes) ? options.classes : [options.classes];
            classes.forEach(cls => element.classList.add(cls));
        }
        
        // Apply styles
        if (options.styles) {
            Object.entries(options.styles).forEach(([key, value]) => {
                element.style[key] = value;
            });
        }
        
        // Set attributes
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        // Set ID
        if (options.id) {
            element.id = options.id;
        }
        
        // Set content
        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        } else if (options.textContent) {
            element.textContent = options.textContent;
        }
        
        return element;
    }

    /**
     * Create a div element with options
     */
    function div(options = {}) {
        return create('div', options);
    }

    /**
     * Create an image element
     */
    function img(src, options = {}) {
        const element = create('img', options);
        element.src = src;
        return element;
    }

    /**
     * Create a paragraph element
     */
    function p(text, options = {}) {
        const element = create('p', options);
        element.textContent = text;
        return element;
    }

    // ========================================================================
    // Button Creation
    // ========================================================================
    
    /**
     * Create a styled button
     * @param {Object} options
     * @param {string} options.text - Button text (can be HTML)
     * @param {string} options.icon - Icon path (optional)
     * @param {string|string[]} options.classes - CSS classes
     * @param {string} options.gradient - Gradient name ('blue', 'red', 'green') or custom CSS gradient
     * @param {Function} options.onClick - Click handler
     * @param {Object} options.styles - Additional CSS styles
     * @returns {HTMLElement}
     */
    function button(options = {}) {
        const btn = create('div', {
            classes: options.classes || [],
            styles: options.styles || {}
        });
        
        // Apply gradient
        if (options.gradient) {
            const gradient = GRADIENTS[options.gradient] || options.gradient;
            btn.style.backgroundImage = gradient;
        }
        
        // Add icon if provided
        if (options.icon) {
            const icon = img(options.icon, { classes: ['btn-icon'] });
            btn.appendChild(icon);
        }
        
        // Add text/HTML content
        if (options.text) {
            if (options.text.includes('<')) {
                btn.innerHTML = options.text;
            } else {
                btn.textContent = options.text;
            }
        }
        
        // Attach click handler
        if (options.onClick) {
            btn.onclick = options.onClick;
        }
        
        return btn;
    }

    /**
     * Create a window control button (minimize, maximize, close)
     */
    function windowButton(type, onClick) {
        const configs = {
            minimize: {
                text: '<strong>_</strong>',
                classes: ['appMin', 'selectBtns'],
                gradient: 'blue'
            },
            maximize: {
                icon: 'assets/images/icons/16x/screen.png',
                classes: ['appScreen', 'selectBtns'],
                gradient: 'blue'
            },
            close: {
                text: '<strong>X</strong>',
                classes: ['appClose', 'selectBtns'],
                gradient: 'red'
            }
        };
        
        const config = configs[type];
        if (!config) {
            window.Logger.error('UIBuilder', `Unknown window button type: ${type}`);
            return create('div');
        }
        
        return button({
            ...config,
            onClick
        });
    }

    // ========================================================================
    // Iframe Creation
    // ========================================================================
    
    /**
     * Create an iframe element
     */
    function iframe(options = {}) {
        const frame = create('iframe', options);
        
        // Apply sandbox if specified
        if (options.sandbox) {
            frame.setAttribute('sandbox', options.sandbox);
        }
        
        return frame;
    }

    // ========================================================================
    // Style Utilities
    // ========================================================================
    
    /**
     * Set CSS transition on element
     */
    function setTransition(element, value) {
        if (element && element.style) {
            element.style.transition = value;
        }
    }

    /**
     * Set pointer events on element
     */
    function setPointerEvents(element, interactive) {
        if (element && element.style) {
            element.style.pointerEvents = interactive ? 'unset' : 'none';
        }
    }

    /**
     * Set display property
     */
    function setDisplay(element, value) {
        if (element && element.style) {
            element.style.display = value;
        }
    }

    /**
     * Show element
     */
    function show(element) {
        setDisplay(element, '');
    }

    /**
     * Hide element
     */
    function hide(element) {
        setDisplay(element, 'none');
    }

    /**
     * Apply multiple styles at once
     */
    function applyStyles(element, styles) {
        if (element && element.style && styles) {
            Object.entries(styles).forEach(([key, value]) => {
                element.style[key] = value;
            });
        }
    }

    // ========================================================================
    // Public API
    // ========================================================================
    
    return {
        // Element creation
        create,
        div,
        img,
        p,
        button,
        windowButton,
        iframe,
        
        // Style utilities
        setTransition,
        setPointerEvents,
        setDisplay,
        show,
        hide,
        applyStyles,
        
        // Constants
        GRADIENTS
    };
})();

// Expose globally
window.UIBuilder = window.UIBuilder || UIBuilder;
