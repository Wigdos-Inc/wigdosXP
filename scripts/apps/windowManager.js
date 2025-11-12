// Simple WindowManager
// Responsibilities:
// - Register and unregister AppWindow instances
// - Manage stacking order (z-index) centrally
// - Provide bringToFront API

const windowManager = (function(){
    const windows = [];
    let topZ = 10;
    const snapThreshold = 16; // px

    function register(appWindow) {
        if (!appWindow || typeof appWindow.index === 'undefined') return;
        // Avoid duplicate registration
        if (windows.find(w => w && w.index === appWindow.index)) return;
        windows.push(appWindow);
        // Ensure newly registered window is on top
        bringToFront(appWindow);
    }

    function unregister(appWindow) {
        const idx = windows.findIndex(w => w === appWindow || (w && w.index === appWindow.index));
        if (idx !== -1) windows.splice(idx, 1);
    }

    function bringToFront(appWindow) {
        topZ++;
        if (appWindow && appWindow.element) appWindow.element.style.zIndex = topZ;
        // Mark focused state for convenience
        windows.forEach(w => {
            if (!w || !w.element) return;
            if (w === appWindow) w.element.classList.add('focused');
            else w.element.classList.remove('focused');
        });
        
        // Update taskbar button focus states
        try {
            if (window.taskbarFunctions) {
                window.taskbarFunctions.updateButtons();
            }
        } catch (e) {}
    }

    function getWindows() { return windows.slice(); }

    // Basic placeholder for global shortcuts integration
    function initGlobalShortcuts() {
        // Example: Alt+1..9 jump to app windows
        document.addEventListener('keydown', (e) => {
            // Alt+Number to focus nth window
            if (e.altKey) {
                const k = parseInt(e.key, 10);
                if (!isNaN(k)) {
                    const w = windows[k-1];
                    if (w) bringToFront(w);
                    return;
                }
            }

            // Arrow keys to nudge focused window (when not typing into an input)
            const tag = (document.activeElement && document.activeElement.tagName) || '';
            if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;

            const focused = windows.find(w => w && w.element && w.element.classList.contains('focused'));
            if (!focused) return;

            const step = e.shiftKey ? 50 : 10;
            if (e.key === 'ArrowLeft') { nudgeWindow(focused, -step, 0); e.preventDefault(); }
            if (e.key === 'ArrowRight') { nudgeWindow(focused, step, 0); e.preventDefault(); }
            if (e.key === 'ArrowUp') { nudgeWindow(focused, 0, -step); e.preventDefault(); }
            if (e.key === 'ArrowDown') { nudgeWindow(focused, 0, step); e.preventDefault(); }
        });
    }

    function nudgeWindow(appWindow, dx, dy) {
        if (!appWindow || !appWindow.element) return;
        try {
            const rect = appWindow.element.getBoundingClientRect();
            const curLeft = rect.left;
            const curTop = rect.top;
            const newLeft = Math.max(0, curLeft + dx);
            const newTop = Math.max(0, curTop + dy);
            appWindow.element.style.left = `${newLeft}px`;
            appWindow.element.style.top = `${newTop}px`;
            // Update stored geometry
            appWindow.move.storage.x = newLeft;
            appWindow.move.storage.y = newTop;
        } catch (e) { /* noop */ }
    }

    function maybeSnap(appWindow) {
        if (!appWindow || !appWindow.element) return;
        try {
            const rect = appWindow.element.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            let snapped = false;

            // Helper function to handle snap logic
            function snapEdge(condition, axis, value) {
                if (condition) {
                    appWindow.element.style[axis] = `${value}px`;
                    appWindow.move.storage[axis === 'left' ? 'x' : 'y'] = value;
                    return true;
                }
                return false;
            }

            // Left
            snapped = snapEdge(rect.left <= snapThreshold, 'left', 0) || snapped;
            
            // Top
            snapped = snapEdge(rect.top <= snapThreshold, 'top', 0) || snapped;
            
            // Right
            snapped = snapEdge(
                vw - (rect.left + rect.width) <= snapThreshold, 
                'left', 
                Math.max(0, vw - rect.width)
            ) || snapped;
            
            // Bottom
            snapped = snapEdge(
                vh - (rect.top + rect.height) <= snapThreshold, 
                'top', 
                Math.max(0, vh - rect.height)
            ) || snapped;

            return snapped;
        } catch (e) { return false; }
    }

    // Delegate to MinimizedBar module
    function addMinimized(appWindow) {
        if (window.MinimizedBar) {
            window.MinimizedBar.addMinimized(appWindow);
        }
    }

    function removeMinimized(appWindow) {
        if (window.MinimizedBar) {
            window.MinimizedBar.removeMinimized(appWindow);
        }
    }

    // Auto-init shortcuts
    initGlobalShortcuts();

    return { register, unregister, bringToFront, getWindows, maybeSnap, addMinimized, removeMinimized };
})();

window.windowManager = window.windowManager || windowManager;