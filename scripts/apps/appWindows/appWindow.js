// ============================================================================
// WigdosXP Window Management
// ============================================================================

// Import Save System
import { pushIframeSaveToFirestore, loadFirestoreToIframe } from '../saving/saveSystem.js';
// Import Window Sessions
import * as windowSessions from './windowSessions.js';
// Import Applications
import { applications } from '../applications/applications.js';

// Global window registry
let windows = {
    index: 0,
    object: []
};
window.windows = windows;

// ============================================================================
// AppWindow Class
// ============================================================================

class AppWindow {
    constructor(app) {
        // Meta
        this.element = document.getElementsByTagName("main")[0].appendChild(document.createElement("div"));
        this.index = windows.index;
        this.app = app;
        this.full = app.full;
        this.loaded = false;

        // Inner Elements
        this.nameBox = undefined;
        this.iframe = undefined;

        this.move = {
            current: false,
            xOffset: 0,
            yOffset: 0,
            storage: {
                x: undefined,
                y: undefined,
                h: 600,
                w: 900
            }
        };
        
        this.minimized = false;
        this._closing = false;
        this._pendingRemoval = null;
        this._timeouts = [];

        this.resize = {
            current: false,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0,
            direction: null,
            startLeft: 0,
            startTop: 0
        };
        
        this.dragOverlay = null;
        this._onDocumentMouseDown = null;
        this._onDocumentMouseMove = null;
        this._onDocumentMouseUp = null;
        this._onIframeMouseDown = null;
    }

    // Helper: Create drag overlay
    createDragOverlay() {
        if (this.dragOverlay) return;
        this.dragOverlay = UIBuilder.div({ classes: 'drag-overlay' });
        this.element.appendChild(this.dragOverlay);
    }

    // Helper: Remove drag overlay
    removeDragOverlay() {
        if (this.dragOverlay) {
            this.dragOverlay.remove();
            this.dragOverlay = null;
        }
    }

    create() {
        if (this.app.name.s === "su") localStorage.setItem("suActive", true);

        this.element.classList.add("appWindow");

        // Element Creation (UIBuilder)
        const appHeader = this.element.appendChild(UIBuilder.div({ classes: 'appHeader' }));                      // App Window Header
        this.nameBox = appHeader.appendChild(UIBuilder.div({ classes: 'appName' }));                              // App Name Box
        const selectBox = appHeader.appendChild(UIBuilder.div({ classes: 'selectBox' }));                         // Window Header Buttons
        const minBtn = selectBox.appendChild(UIBuilder.windowButton('minimize', () => this.minimize()));          // Minimize Button
        const screenBtn = selectBox.appendChild(UIBuilder.windowButton('maximize', () => {                        // Screen Change Button
            this.full = !this.full;
            this.screenChange();
        }));
        const closeBtn = selectBox.appendChild(UIBuilder.windowButton('close', () => this.close()));              // Close Button
        const appMain = this.element.appendChild(UIBuilder.div({ classes: 'appMain' }));                          // App Window Main
        this.iframe = appMain.appendChild(UIBuilder.iframe({                                                      // Create Iframe for Application
            classes: 'appContent',
            attributes: { 'data-app-index': this.index }
        }));

        // Optional sandboxing
        if (this.app && this.app.sandbox) {
            this.iframe.setAttribute('sandbox', 'allow-scripts allow-forms');
            this.iframe.dataset.sandboxed = 'true';
            window.Logger.info('AppWindow', `Iframe for ${this.app.name.s} created with sandboxing`);
        }

        // Focus Functionality
        const overlay = appMain.appendChild(UIBuilder.div({ classes: 'appOverlay' }));                            // Focus overlay
        UIBuilder.hide(overlay);

        this._onDocumentMouseDown = (event) => {
            if (this.element.contains(event.target)) {
                appHeader.classList.remove("headerUnfocus");
                appMain.classList.remove("mainUnfocus");
                UIBuilder.hide(overlay);
                try {
                    if (window.windowManager) window.windowManager.bringToFront(this);
                } catch (e) {
                    window.Logger.error('AppWindow', 'Failed to bring window to front', e);
                }
            } else {
                appHeader.classList.add("headerUnfocus");
                appMain.classList.add("mainUnfocus");
                UIBuilder.show(overlay);
            }
        };
        document.addEventListener("mousedown", this._onDocumentMouseDown);

        // Save initial session metadata
        this.saveSessionData();

        // Dragging Functionality
        appHeader.addEventListener("mousedown", (event) => {
            if (minBtn.contains(event.target) || 
                screenBtn.contains(event.target) || 
                closeBtn.contains(event.target)) {
                return;
            }

            this.move.current = true;
            UIBuilder.setTransition(this.element, 'unset');

            this.createDragOverlay();
            UIBuilder.setPointerEvents(this.iframe, false);

            if (this.full) {
                const headerRect = event.currentTarget.getBoundingClientRect();
                const headerRectFull = appHeader.getBoundingClientRect();
                
                this.full = false;
                this.screenChange();
                this.element.style.transform = "unset";
                
                const offsetX = ((event.clientX - headerRectFull.left) / headerRectFull.width) * this.move.storage.w;
                const offsetY = event.clientY - headerRect.top;
                
                const newLeft = event.clientX - offsetX;
                const newTop = event.clientY - offsetY;
                
                this.move.storage.x = newLeft;
                this.move.storage.y = newTop;
                this.move.xOffset = offsetX;
                this.move.yOffset = offsetY;
            } else {
                this.move.xOffset = event.clientX - this.element.offsetLeft;
                this.move.yOffset = event.clientY - this.element.offsetTop;
            }
        });

        this._onDocumentMouseMove = (event) => {
            if (this.move.current) {
                this.element.style.left = `${event.clientX - this.move.xOffset}px`;
                this.element.style.top = `${event.clientY - this.move.yOffset}px`;
                this.element.style.width = `${this.move.storage.w}px`;
                this.element.style.height = `${this.move.storage.h}px`;
            }
            
            if (this.resize.current) {
                const dx = event.clientX - this.resize.startX;
                const dy = event.clientY - this.resize.startY;
                let newLeft = this.resize.startLeft;
                let newTop = this.resize.startTop;
                let newWidth = this.resize.startWidth;
                let newHeight = this.resize.startHeight;
                const dir = this.resize.direction;
                const minW = 350, minH = 225;

                if (dir.includes('e')) {
                    newWidth = this.resize.startWidth + dx;
                    if (newWidth < minW) newWidth = minW;
                }
                if (dir.includes('w')) {
                    newWidth = this.resize.startWidth - dx;
                    if (newWidth < minW) {
                        newLeft = this.resize.startLeft + (this.resize.startWidth - minW);
                        newWidth = minW;
                    } else {
                        newLeft = this.resize.startLeft + dx;
                    }
                }
                if (dir.includes('s')) {
                    newHeight = this.resize.startHeight + dy;
                    if (newHeight < minH) newHeight = minH;
                }
                if (dir.includes('n')) {
                    newHeight = this.resize.startHeight - dy;
                    if (newHeight < minH) {
                        newTop = this.resize.startTop + (this.resize.startHeight - minH);
                        newHeight = minH;
                    } else {
                        newTop = this.resize.startTop + dy;
                    }
                }

                this.element.style.width = `${newWidth}px`;
                this.element.style.height = `${newHeight}px`;
                if (dir.includes('w')) this.element.style.left = `${newLeft}px`;
                if (dir.includes('n')) this.element.style.top = `${newTop}px`;

                this.move.storage.w = newWidth;
                this.move.storage.h = newHeight;
                if (dir.includes('w')) this.move.storage.x = newLeft;
                if (dir.includes('n')) this.move.storage.y = newTop;
            }
        };

        this._onDocumentMouseUp = () => {
            if (this.move.current) {
                this.move.current = false;
                UIBuilder.setTransition(this.element, 'all 0.1s');
                const pos = this.element.getBoundingClientRect();
                this.move.storage.x = pos.x;
                this.move.storage.y = pos.y;
                UIBuilder.setPointerEvents(this.iframe, true);
                this.removeDragOverlay();
            }
            if (this.resize.current) {
                this.resize.current = false;
                UIBuilder.setTransition(this.element, 'all 0.1s');
                UIBuilder.setPointerEvents(this.iframe, true);
                this.removeDragOverlay();
            }
            
            this.saveSessionData();
        };

        document.addEventListener('mousemove', this._onDocumentMouseMove);
        document.addEventListener('mouseup', this._onDocumentMouseUp);

        this._onIframeMouseDown = () => {
            try {
                if (window.windowManager) window.windowManager.bringToFront(this);
            } catch (e) {
                window.Logger.error('AppWindow', 'Failed to bring window to front from iframe', e);
            }
        };
        this.iframe.addEventListener("mousedown", this._onIframeMouseDown);

        // Resize Handles
        const directions = ["n", "e", "s", "w", "ne", "nw", "se", "sw"];
        directions.forEach(dir => {
            const handle = UIBuilder.div({
                classes: ['resize-handle', dir],
                attributes: { 'data-direction': dir }
            });
            this.element.appendChild(handle);
            handle.addEventListener("mousedown", event => {
                if (!this.full) {
                    const rect = this.element.getBoundingClientRect();
                    if (this.element.style.transform && this.element.style.transform.includes("translate")) {
                        this.element.style.left = `${rect.left}px`;
                        this.element.style.top = `${rect.top}px`;
                        this.element.style.transform = "unset";
                    }
                    event.stopPropagation();
                    this.resize.current = true;
                    this.resize.direction = dir;
                    this.resize.startX = event.clientX;
                    this.resize.startY = event.clientY;
                    this.resize.startWidth = rect.width;
                    this.resize.startHeight = rect.height;
                    this.resize.startLeft = rect.left;
                    this.resize.startTop = rect.top;
                    UIBuilder.setTransition(this.element, 'unset');
                    UIBuilder.setPointerEvents(this.iframe, false);
                    this.createDragOverlay();
                    this.element.style.transform = "unset";
                }
            });
        });
    }

    saveSessionData() {
        try {
            windowSessions.saveWindow({
                index: this.index,
                appId: this.app.name.s,
                x: this.move.storage.x,
                y: this.move.storage.y,
                w: this.move.storage.w,
                h: this.move.storage.h,
                full: this.full,
                minimized: this.minimized
            });
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to save session data', e);
        }
    }

    close() {
        if (this._closing) return;
        this._closing = true;

        try {
            if (window.taskbarFunctions) {
                window.taskbarFunctions.removeButton(this);
            }
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to remove taskbar button', e);
        }

        if (this.app.name.s === "su") localStorage.removeItem("suActive");

        this.cleanup();

        const isSameOrigin = (() => {
            try {
                const url = new URL(this.app.path, window.location.href);
                return url.origin === window.location.origin;
            } catch (e) {
                return false;
            }
        })();

        if (this.app.save) {
            if (isSameOrigin) {
                this.closeSameOrigin();
            } else {
                this.closeCrossOrigin();
            }
        } else {
            this.closeImmediate();
        }
    }

    closeSameOrigin() {
        pushIframeSaveToFirestore(this.app.name.s, this.iframe)
            .then(saved => {
                if (saved) window.Logger.info('SaveSystem', `Game data saved for ${this.app.name.s}`);
            })
            .catch(err => window.Logger.error('SaveSystem', 'Save failed', err))
            .finally(() => {
                this.finalizeClose();
            });
    }

    closeCrossOrigin() {
        this._pendingRemoval = { cancelled: false };

        try {
            if (window.windowManager) window.windowManager.unregister(this);
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to unregister window', e);
        }
        try {
            windowSessions.removeWindow(this.index);
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to remove window session', e);
        }

        try {
            this.element.style.display = 'none';
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to hide element', e);
        }

        pushIframeSaveToFirestore(this.app.name.s, this.iframe)
            .then(saved => {
                if (saved) window.Logger.info('SaveSystem', `Cross-origin game data saved for ${this.app.name.s}`);
            })
            .catch(err => window.Logger.error('SaveSystem', 'Background save failed', err))
            .finally(() => {
                if (this._pendingRemoval && this._pendingRemoval.cancelled) {
                    this._pendingRemoval = null;
                    this._closing = false;
                    try {
                        if (window.windowManager) window.windowManager.register(this);
                    } catch (e) {
                        window.Logger.error('AppWindow', 'Failed to re-register window', e);
                    }
                    this.saveSessionData();
                    return;
                }

                try {
                    this.element.remove();
                } catch (e) {
                    window.Logger.error('AppWindow', 'Failed to remove element', e);
                }
                windows.object[this.index] = null;
                this._pendingRemoval = null;
            });
    }

    closeImmediate() {
        this.finalizeClose();
    }

    finalizeClose() {
        try {
            if (window.windowManager) window.windowManager.unregister(this);
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to unregister window', e);
        }
        try {
            windowSessions.removeWindow(this.index);
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to remove window session', e);
        }
        try {
            this.element.remove();
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to remove element', e);
        }
        windows.object[this.index] = null;
    }

    cleanup() {
        const listeners = [
            ['mousedown', this._onDocumentMouseDown],
            ['mousemove', this._onDocumentMouseMove],
            ['mouseup', this._onDocumentMouseUp]
        ];
        
        listeners.forEach(([event, handler]) => {
            if (handler) document.removeEventListener(event, handler);
        });
        
        if (this._onIframeMouseDown && this.iframe) {
            this.iframe.removeEventListener('mousedown', this._onIframeMouseDown);
        }
        
        this.removeDragOverlay();

        this._timeouts.forEach(id => clearTimeout(id));
        this._timeouts = [];
    }

    screenChange() {
        if (this.full) {

            this.element.classList.add("fullscreen");
            this.element.style.left = 0;
            this.element.style.top = 0;
            this.element.style.transform = "unset";
            this.element.style.height = "100%";
            this.element.style.width = "100%";
            this.element.style.borderTopLeftRadius = 0;
            this.element.style.borderTopRightRadius = 0;

        } else {

            this.element.classList.remove("fullscreen");

            if (this.move.storage.x !== undefined) {
                this.element.style.left = `${this.move.storage.x}px`;
                this.element.style.top = `${this.move.storage.y}px`;
            } else {
                this.element.style.left = "50%";
                this.element.style.top = "50%";
                this.element.style.transform = "translate(-50%, -50%)";
            }

            this.element.style.height = `${this.move.storage.h}px`;
            this.element.style.width = `${this.move.storage.w}px`;
            this.element.style.borderTopLeftRadius = "5px";
            this.element.style.borderTopRightRadius = "5px";

        }
    }

    minimize() {

        if (this._closing || this.minimized) return;

        try {
            if (window.windowManager && window.windowManager.register) {
                window.windowManager.register(this);
            }
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to register window on minimize', e);
        }

        this.minimized = true;

        try {
            this.element.style.display = 'none';
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to hide element on minimize', e);
        }

        try {
            if (window.windowManager && window.windowManager.addMinimized) {
                window.windowManager.addMinimized(this);
            }
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to add minimized window', e);
        }

        this.saveSessionData();
    }

    restore() {

        if (this._pendingRemoval) {

            try {
                this._pendingRemoval.cancelled = true;
            } catch (e) {
                window.Logger.error('AppWindow', 'Failed to cancel pending removal', e);
            }
            this._pendingRemoval = null;
            this._closing = false;
            
        }

        if (this._closing || !this.minimized) return;

        try {
            if (!this.element.parentNode) {
                const main = document.getElementsByTagName('main')[0];
                if (main) main.appendChild(this.element);
            }
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to reattach element', e);
        }

        this.minimized = false;

        try {
            this.element.style.display = '';
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to show element on restore', e);
        }

        try {
            if (window.windowManager && window.windowManager.register) {
                window.windowManager.register(this);
            }
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to register window on restore', e);
        }

        try {
            if (window.windowManager) window.windowManager.bringToFront(this);
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to bring window to front', e);
        }

        try {
            if (window.windowManager && window.windowManager.removeMinimized) {
                window.windowManager.removeMinimized(this);
            }
        } catch (e) {
            window.Logger.error('AppWindow', 'Failed to remove from minimized list', e);
        }

        this.saveSessionData();
    }

    addTimeout(timeoutId) {
        this._timeouts.push(timeoutId);
    }
}

// ============================================================================
// Application Loading
// ============================================================================

function startApp(app, session) {
    const appWindow = new AppWindow(app);
    appWindow.create();

    if (session) {
        try {
            if (typeof session.w === 'number') appWindow.move.storage.w = session.w;
            if (typeof session.h === 'number') appWindow.move.storage.h = session.h;
            if (typeof session.x === 'number') appWindow.move.storage.x = session.x;
            if (typeof session.y === 'number') appWindow.move.storage.y = session.y;
            if (typeof session.full === 'boolean') appWindow.full = session.full;
        } catch (e) {
            window.Logger.error('StartApp', 'Failed to restore session data', e);
        }
    }

    appWindow.screenChange();

    const appImg = appWindow.nameBox.appendChild(document.createElement("img"));
    appImg.classList.add("appIcon");
    appImg.src = app.icon.s;

    const appName = appWindow.nameBox.appendChild(document.createElement("p"));
    appName.classList.add("appName");
    appName.innerHTML = app.name.l;

    appWindow.iframe.src = "";
    const timeoutId = setTimeout(() => {
        appWindow.iframe.src = app.path;
    }, 50);
    appWindow.addTimeout(timeoutId);

    if (session && session.minimized) {
        const minimizeTimeoutId = setTimeout(() => {
            try {
                appWindow.minimize();
            } catch (e) {
                window.Logger.error('StartApp', 'Failed to minimize window', e);
            }
        }, 120);
        appWindow.addTimeout(minimizeTimeoutId);
    }

    if (app.save) {
        appWindow.iframe.onload = async () => {
            if (!appWindow.loaded) {
                try {
                    const loaded = await loadFirestoreToIframe(app.name.s, appWindow.iframe);
                    if (loaded) {
                        window.Logger.info('SaveSystem', `Save data loaded for ${app.name.s}`);
                    } else {
                        window.Logger.info('SaveSystem', `No remote save data found for ${app.name.s}`);
                    }
                } catch (error) {
                    window.Logger.error('SaveSystem', `Could not load save data for ${app.name.s}`, error);
                }

                appWindow.loaded = true;
            }
        };
    }

    windows.object.push(appWindow);
    windows.index++;

    try {
        if (window.windowManager) window.windowManager.register(appWindow);
    } catch (e) {
        window.Logger.error('StartApp', 'Failed to register window', e);
    }

    const taskbarTimeoutId = setTimeout(() => {
        try {
            if (window.taskbarFunctions) {
                window.taskbarFunctions.createButton(appWindow);
            }
        } catch (e) {
            window.Logger.error('StartApp', 'Could not create taskbar button', e);
        }
    }, 50);
    appWindow.addTimeout(taskbarTimeoutId);
}

// Export startApp for Modules
export { startApp };

// Make Global for Non-Modules
window.startApp = startApp;