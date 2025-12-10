// ============================================================================
// WigdosXP Window Management & Save System
// Enhanced version with improved error handling, logging, and flexibility
// ============================================================================

// Global window registry
let windows = {
    index: 0,
    object: []
};
window.windows = windows;

// ============================================================================
// Configuration & Constants
// ============================================================================

const SAVE_CONFIG = {
    timeout: 5000,
    retryAttempts: 1,
    retryDelay: 1000,
    version: '1.0',
    maxBackups: 5
};

const ALLOWED_ORIGINS = [
    window.location.origin,
    'https://wigdos-inc.github.io',
    '*',
    "https://danie-glr.github.io"
];

// ============================================================================
// Logging System
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

// ============================================================================
// Utility Functions
// ============================================================================

function validateOrigin(origin) {
    return ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');
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
        version: SAVE_CONFIG.version,
        gameId: gameId,
        timestamp: Date.now(),
        data: data,
        checksum: generateChecksum(data)
    };
}

function unwrapSaveData(wrapped) {
    // If it's not wrapped (old data or plain object), return as-is
    if (!wrapped || !wrapped.version || !wrapped.data) {
        Logger.debug('SaveSystem', 'Save data is not wrapped format, returning as-is');
        return wrapped;
    }
    
    // Validate checksum
    if (!validateChecksum(wrapped.data, wrapped.checksum)) {
        Logger.warn('SaveSystem', 'Save data checksum validation failed, returning inner data anyway');
    }
    
    return wrapped.data;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Attempt to delete all IndexedDB databases accessible from a given window
async function clearIndexedDBInWindow(win) {
    try {
        const idb = win.indexedDB;
        if (!idb) return false;

        // If the browser supports listing databases, use it to delete each one
        if (typeof idb.databases === 'function') {
            const dbs = await idb.databases();
            await Promise.all(dbs.map(dbInfo => {
                if (!dbInfo || !dbInfo.name) return Promise.resolve(false);
                return new Promise((resolve) => {
                    try {
                        const req = idb.deleteDatabase(dbInfo.name);
                        req.onsuccess = () => resolve(true);
                        req.onerror = () => resolve(false);
                        req.onblocked = () => resolve(false);
                    } catch (e) {
                        resolve(false);
                    }
                });
            }));
            return true;
        }

        // Fallback: try deleting a couple of likely database names
        const guesses = ['files', 'game_data', 'wigdosxp', 'wigtube'];
        await Promise.all(guesses.map(name => new Promise((resolve) => {
            try {
                const req = idb.deleteDatabase(name);
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
                req.onblocked = () => resolve(false);
            } catch (e) {
                resolve(false);
            }
        })));

        return true;
    } catch (e) {
        Logger.warn('SaveSystem', 'IndexedDB clear failed', e);
        return false;
    }
}

// Clear iframe storage: tries direct access for same-origin, otherwise uses postMessage
async function clearIframeStorageBeforeClose(iframe, gameId) {
    if (!iframe) return false;

    let iframeOrigin = '*';
    try {
        iframeOrigin = new URL(iframe.src).origin;
    } catch (e) {
        iframeOrigin = '*';
    }

    const isSameOrigin = (() => {
        try {
            return iframeOrigin === window.location.origin;
        } catch (e) {
            return false;
        }
    })();

    if (isSameOrigin) {
        try {
            try {
                if (iframe.contentWindow && iframe.contentWindow.localStorage) {
                    iframe.contentWindow.localStorage.clear();
                    Logger.debug('SaveSystem', `Cleared localStorage for ${gameId}`);
                }
            } catch (e) {
                Logger.warn('SaveSystem', 'Failed to clear iframe localStorage', e);
            }

            // Attempt to clear IndexedDB from the iframe's window context
            const cleared = await clearIndexedDBInWindow(iframe.contentWindow);
            Logger.debug('SaveSystem', `IndexedDB clear ${cleared ? 'attempted' : 'skipped'} for ${gameId}`);
            return true;
        } catch (e) {
            Logger.warn('SaveSystem', `Failed to clear same-origin storage for ${gameId}`, e);
            return false;
        }
    }

    // Cross-origin: send a postMessage request and wait for a response
    return new Promise((resolve) => {
        const messageId = `clear_${gameId}_${Date.now()}`;

        const handleResponse = (event) => {
            // allow wildcard origins if iframeOrigin is '*'
            if (iframeOrigin !== '*' && event.origin !== iframeOrigin) return;

            if (event.data && event.data.type === 'clearAllStorageResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);
                Logger.debug('SaveSystem', `Clear storage response received for ${gameId}`, event.data);
                resolve(event.data.success === true);
            }
        };

        window.addEventListener('message', handleResponse);

        try {
            iframe.contentWindow.postMessage({
                type: 'clearAllStorageRequest',
                gameId: gameId,
                messageId: messageId
            }, iframeOrigin);
        } catch (err) {
            Logger.warn('SaveSystem', 'postMessage clear request failed, falling back to "*"', err);
            try {
                iframe.contentWindow.postMessage({
                    type: 'clearAllStorageRequest',
                    gameId: gameId,
                    messageId: messageId
                }, '*');
            } catch (e) {
                Logger.error('SaveSystem', 'All postMessage clear attempts failed', e);
                window.removeEventListener('message', handleResponse);
                resolve(false);
            }
        }

        setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            Logger.warn('SaveSystem', `Clear storage timeout for ${gameId}`);
            resolve(false);
        }, SAVE_CONFIG.timeout);
    });
}

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
        this.header = undefined;
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

    create() {
        if (this.app.name.s === "su") localStorage.setItem("suActive", true);

        this.element.classList.add("appWindow");
        this.focus = true;

        // App Window Header
        const appHeader = this.element.appendChild(document.createElement("div"));
        appHeader.classList.add("appHeader");

        // Name Box
        this.nameBox = appHeader.appendChild(document.createElement("div"));
        this.nameBox.classList.add("appName");

        // Header Buttons
        const selectBox = appHeader.appendChild(document.createElement("div"));
        selectBox.classList.add("selectBox");

        // Minimize Button
        const minBtn = selectBox.appendChild(document.createElement("div"));
        minBtn.classList.add("appMin", "selectBtns");
        minBtn.innerHTML = "<strong>_</strong>";
        minBtn.onclick = () => this.minimize();
        minBtn.style.backgroundImage = "linear-gradient(to bottom right, #96B4F9, #6794fa, #4176F5, #2857c6, #225DE5)";

        // Screen Change Button
        const screenBtn = selectBox.appendChild(document.createElement("div"));
        screenBtn.classList.add("appScreen", "selectBtns");
        const screenImg = screenBtn.appendChild(document.createElement("img"));
        screenImg.classList.add("screenImg");
        screenImg.src = "assets/images/icons/16x/screen.png";
        screenBtn.onclick = () => {
            this.full = !this.full;
            this.screenChange();
        };
        screenBtn.style.backgroundImage = "linear-gradient(to bottom right, #96B4F9, #6794fa, #4176F5, #2857c6, #225DE5)";

        // Close Button
        const closeBtn = selectBox.appendChild(document.createElement("div"));
        closeBtn.classList.add("appClose", "selectBtns");
        closeBtn.innerHTML = "<strong>X</strong>";
        closeBtn.onclick = () => this.close();

        // App Window Main
        const appMain = this.element.appendChild(document.createElement("div"));
        appMain.classList.add("appMain");

        this.iframe = appMain.appendChild(document.createElement("iframe"));
        this.iframe.classList.add("appContent");
        this.iframe.dataset.appIndex = this.index;

        // Optional sandboxing
        if (this.app && this.app.sandbox) {
            this.iframe.setAttribute('sandbox', 'allow-scripts allow-forms');
            this.iframe.dataset.sandboxed = 'true';
            Logger.debug('AppWindow', `Iframe for ${this.app.name.s} created with sandboxing`);
        }

        // Focus Functionality
        const overlay = appMain.appendChild(document.createElement("div"));
        overlay.classList.add("appOverlay");
        overlay.style.display = "none";

        this._onDocumentMouseDown = (event) => {
            if (this.element.contains(event.target)) {
                appHeader.classList.remove("headerUnfocus");
                appMain.classList.remove("mainUnfocus");
                overlay.style.display = "none";
                try {
                    if (window.windowManager) window.windowManager.bringToFront(this);
                } catch (e) {
                    Logger.error('AppWindow', 'Failed to bring window to front', e);
                }
            } else {
                appHeader.classList.add("headerUnfocus");
                appMain.classList.add("mainUnfocus");
                overlay.style.display = "block";
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
            this.element.style.transition = "unset";

            this.dragOverlay = document.createElement("div");
            this.dragOverlay.classList.add("drag-overlay");
            this.element.appendChild(this.dragOverlay);

            this.iframe.style.pointerEvents = "none";

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
                this.element.style.transition = "all 0.1s";
                const pos = this.element.getBoundingClientRect();
                this.move.storage.x = pos.x;
                this.move.storage.y = pos.y;
                this.iframe.style.pointerEvents = "unset";
                if (this.dragOverlay) {
                    this.dragOverlay.remove();
                    this.dragOverlay = null;
                }
            }
            if (this.resize.current) {
                this.resize.current = false;
                this.element.style.transition = "all 0.1s";
                this.iframe.style.pointerEvents = "unset";
                if (this.dragOverlay) {
                    this.dragOverlay.remove();
                    this.dragOverlay = null;
                }
            }
            
            this.saveSessionData();
        };

        document.addEventListener('mousemove', this._onDocumentMouseMove);
        document.addEventListener('mouseup', this._onDocumentMouseUp);

        this._onIframeMouseDown = () => {
            try {
                if (window.windowManager) window.windowManager.bringToFront(this);
            } catch (e) {
                Logger.error('AppWindow', 'Failed to bring window to front from iframe', e);
            }
        };
        this.iframe.addEventListener("mousedown", this._onIframeMouseDown);

        // Resize Handles
        const directions = ["n", "e", "s", "w", "ne", "nw", "se", "sw"];
        directions.forEach(dir => {
            const handle = document.createElement("div");
            handle.classList.add("resize-handle", dir);
            handle.dataset.direction = dir;
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
                    this.element.style.transition = "unset";
                    this.iframe.style.pointerEvents = "none";
                    this.dragOverlay = document.createElement("div");
                    this.dragOverlay.classList.add("drag-overlay");
                    this.element.appendChild(this.dragOverlay);
                    this.element.style.transform = "unset";
                }
            });
        });
    }

    saveSessionData() {
        try {
            if (window.windowSessions) {
                window.windowSessions.saveWindow({
                    index: this.index,
                    appId: this.app.name.s,
                    x: this.move.storage.x,
                    y: this.move.storage.y,
                    w: this.move.storage.w,
                    h: this.move.storage.h,
                    full: this.full,
                    minimized: this.minimized
                });
            }
        } catch (e) {
            Logger.error('AppWindow', 'Failed to save session data', e);
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
            Logger.error('AppWindow', 'Failed to remove taskbar button', e);
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
            .then(async (saved) => {
                if (saved) {
                    Logger.debug('SaveSystem', `Game data saved for ${this.app.name.s}`);
                    try {
                        const cleared = await clearIframeStorageBeforeClose(this.iframe, this.app.name.s);
                        Logger.debug('SaveSystem', `Cleared storage before close for ${this.app.name.s}: ${cleared}`);
                    } catch (e) {
                        Logger.warn('SaveSystem', `Failed to clear storage before close for ${this.app.name.s}`, e);
                    }
                }
            })
            .catch(err => Logger.error('SaveSystem', 'Save failed', err))
            .finally(() => {
                this.finalizeClose();
            });
    }

    closeCrossOrigin() {
        this._pendingRemoval = { cancelled: false };

        try {
            if (window.windowManager) window.windowManager.unregister(this);
        } catch (e) {
            Logger.error('AppWindow', 'Failed to unregister window', e);
        }
        try {
            if (window.windowSessions) window.windowSessions.removeWindow(this.index);
        } catch (e) {
            Logger.error('AppWindow', 'Failed to remove window session', e);
        }

        try {
            this.element.style.display = 'none';
        } catch (e) {
            Logger.error('AppWindow', 'Failed to hide element', e);
        }

        pushIframeSaveToFirestore(this.app.name.s, this.iframe)
            .then(async (saved) => {
                if (saved) {
                    Logger.debug('SaveSystem', `Cross-origin game data saved for ${this.app.name.s}`);
                    try {
                        const cleared = await clearIframeStorageBeforeClose(this.iframe, this.app.name.s);
                        Logger.debug('SaveSystem', `Cleared storage before close for ${this.app.name.s}: ${cleared}`);
                    } catch (e) {
                        Logger.warn('SaveSystem', `Failed to clear storage before close for ${this.app.name.s}`, e);
                    }
                }
            })
            .catch(err => Logger.error('SaveSystem', 'Background save failed', err))
            .finally(() => {
                if (this._pendingRemoval && this._pendingRemoval.cancelled) {
                    this._pendingRemoval = null;
                    this._closing = false;
                    try {
                        if (window.windowManager) window.windowManager.register(this);
                    } catch (e) {
                        Logger.error('AppWindow', 'Failed to re-register window', e);
                    }
                    this.saveSessionData();
                    return;
                }

                try {
                    this.element.remove();
                } catch (e) {
                    Logger.error('AppWindow', 'Failed to remove element', e);
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
            Logger.error('AppWindow', 'Failed to unregister window', e);
        }
        try {
            if (window.windowSessions) window.windowSessions.removeWindow(this.index);
        } catch (e) {
            Logger.error('AppWindow', 'Failed to remove window session', e);
        }
        try {
            this.element.remove();
        } catch (e) {
            Logger.error('AppWindow', 'Failed to remove element', e);
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
        
        if (this.dragOverlay) {
            this.dragOverlay.remove();
            this.dragOverlay = null;
        }

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
            Logger.error('AppWindow', 'Failed to register window on minimize', e);
        }

        this.minimized = true;

        try {
            this.element.style.display = 'none';
        } catch (e) {
            Logger.error('AppWindow', 'Failed to hide element on minimize', e);
        }

        try {
            if (window.windowManager && window.windowManager.addMinimized) {
                window.windowManager.addMinimized(this);
            }
        } catch (e) {
            Logger.error('AppWindow', 'Failed to add minimized window', e);
        }

        this.saveSessionData();
    }

    restore() {
        if (this._pendingRemoval) {
            try {
                this._pendingRemoval.cancelled = true;
            } catch (e) {
                Logger.error('AppWindow', 'Failed to cancel pending removal', e);
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
            Logger.error('AppWindow', 'Failed to reattach element', e);
        }

        this.minimized = false;

        try {
            this.element.style.display = '';
        } catch (e) {
            Logger.error('AppWindow', 'Failed to show element on restore', e);
        }

        try {
            if (window.windowManager && window.windowManager.register) {
                window.windowManager.register(this);
            }
        } catch (e) {
            Logger.error('AppWindow', 'Failed to register window on restore', e);
        }

        try {
            if (window.windowManager) window.windowManager.bringToFront(this);
        } catch (e) {
            Logger.error('AppWindow', 'Failed to bring window to front', e);
        }

        try {
            if (window.windowManager && window.windowManager.removeMinimized) {
                window.windowManager.removeMinimized(this);
            }
        } catch (e) {
            Logger.error('AppWindow', 'Failed to remove from minimized list', e);
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

    // Track as recent app
    if (app && app.name && app.name.s && window.addRecentApp) {
        try {
            window.addRecentApp(app.name.s);
        } catch(e) {
            console.error('[StartApp] Failed to track recent app', e);
        }
    }

    if (session) {
        try {
            if (typeof session.w === 'number') appWindow.move.storage.w = session.w;
            if (typeof session.h === 'number') appWindow.move.storage.h = session.h;
            if (typeof session.x === 'number') appWindow.move.storage.x = session.x;
            if (typeof session.y === 'number') appWindow.move.storage.y = session.y;
            if (typeof session.full === 'boolean') appWindow.full = session.full;
        } catch (e) {
            Logger.error('StartApp', 'Failed to restore session data', e);
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
                Logger.error('StartApp', 'Failed to minimize window', e);
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
                        Logger.debug('SaveSystem', `Save data loaded for ${app.name.s}`);
                    } else {
                        Logger.debug('SaveSystem', `No remote save data found for ${app.name.s}`);
                    }
                } catch (error) {
                    Logger.error('SaveSystem', `Could not load save data for ${app.name.s}`, error);
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
        Logger.error('StartApp', 'Failed to register window', e);
    }

    const taskbarTimeoutId = setTimeout(() => {
        try {
            if (window.taskbarFunctions) {
                window.taskbarFunctions.createButton(appWindow);
            }
        } catch (e) {
            Logger.error('StartApp', 'Could not create taskbar button', e);
        }
    }, 50);
    appWindow.addTimeout(taskbarTimeoutId);
}

// ============================================================================
// Save System - Core Functions
// ============================================================================

async function pushIframeSaveToFirestore(gameId, iframe) {
    iframe = iframe || document.getElementById('gameIframe') || document.querySelector('iframe.appContent');
    if (!iframe) {
        Logger.error('SaveSystem', 'Game iframe not found');
        throw new Error('Game iframe not found');
    }

    let allLocalStorageData;
    
    try {
        const iframeStorage = iframe.contentWindow.localStorage;
        allLocalStorageData = {};
        
        for (let i = 0; i < iframeStorage.length; i++) {
            const key = iframeStorage.key(i);
            allLocalStorageData[key] = iframeStorage.getItem(key);
        }
        
        Logger.debug('SaveSystem', `Retrieved ${Object.keys(allLocalStorageData).length} localStorage items`);
    } catch (err) {
        Logger.debug('SaveSystem', 'Cross-origin iframe detected, using postMessage');
        return await pushSaveViaPostMessageWithRetry(iframe, gameId);
    }

    if (Object.keys(allLocalStorageData).length === 0) {
        Logger.debug('SaveSystem', 'No data to save');
        return false;
    }

    return await uploadSaveDataToFirebase(gameId, allLocalStorageData);
}

async function pushSaveViaPostMessageWithRetry(iframe, gameId, attempts = SAVE_CONFIG.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
            try {
            Logger.debug('SaveSystem', `Save attempt ${i + 1}/${attempts} for ${gameId}`);
            const result = await pushSaveViaPostMessage(iframe, gameId);
            if (result) return true;
        } catch (e) {
            Logger.warn('SaveSystem', `Save attempt ${i + 1} failed for ${gameId}`, e);
            if (i < attempts - 1) {
                await sleep(SAVE_CONFIG.retryDelay);
            }
        }
    }
    Logger.error('SaveSystem', `All save attempts failed for ${gameId}`);
    return false;
}

async function pushSaveViaPostMessage(iframe, gameId) {
    return new Promise((resolve) => {
        const messageId = `save_${gameId}_${Date.now()}`;
        let iframeOrigin = '*';
        
        try {
            iframeOrigin = new URL(iframe.src).origin;
        } catch (e) {
            iframeOrigin = '*';
        }

        Logger.debug('SaveSystem', `Attempting cross-origin save for ${gameId}`, {
            messageId,
            iframeSrc: iframe.src,
            iframeOrigin
        });
        
        const handleResponse = (event) => {
            if (iframeOrigin !== '*' && event.origin !== iframeOrigin) return;
            
            if (event.data && event.data.type === 'saveDataResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);

                    if (event.data.allLocalStorageData && Object.keys(event.data.allLocalStorageData).length > 0) {
                    Logger.debug('SaveSystem', `Save data received for ${gameId}, uploading to Firebase`);
                    uploadSaveDataToFirebase(gameId, event.data.allLocalStorageData)
                        .then(success => {
                            Logger.debug('SaveSystem', `Firebase upload ${success ? 'successful' : 'failed'} for ${gameId}`);
                            resolve(success);
                        })
                        .catch((err) => {
                            Logger.error('SaveSystem', `Firebase upload error for ${gameId}`, err);
                            resolve(false);
                        });
                } else {
                    Logger.debug('SaveSystem', `No save data received for ${gameId}`);
                    resolve(false);
                }
            }
        };
        
        window.addEventListener('message', handleResponse);
        
        Logger.debug('SaveSystem', `Sending getAllLocalStorageData to ${gameId} iframe`);
        try {
            iframe.contentWindow.postMessage({
                type: 'getAllLocalStorageData',
                gameId: gameId,
                messageId: messageId
            }, iframeOrigin);
        } catch (err) {
            Logger.warn('SaveSystem', 'postMessage to iframe failed, falling back to "*" targetOrigin', err);
            try {
                iframe.contentWindow.postMessage({
                    type: 'getAllLocalStorageData',
                    gameId: gameId,
                    messageId: messageId
                }, '*');
            } catch (e) {
                Logger.error('SaveSystem', 'All postMessage attempts failed', e);
            }
        }
        
        setTimeout(() => {
            Logger.warn('SaveSystem', `Cross-origin save timeout for ${gameId}`);
            window.removeEventListener('message', handleResponse);
            resolve(false);
        }, SAVE_CONFIG.timeout);
    });
}

async function uploadSaveDataToFirebase(gameId, allLocalStorageData) {
    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') {
        Logger.debug('SaveSystem', 'Guest user, skipping Firebase upload');
        return false;
    }

    const api = window.firebaseAPI;
    if (!api || !api.db) {
        Logger.warn('SaveSystem', 'Firebase not available');
        return false;
    }

    try {
        const wrappedData = wrapSaveData(gameId, allLocalStorageData);

        // Save only the wrapped format (no legacy system)
        const docPatch = {
            [gameId]: JSON.stringify(wrappedData)
        };

        await api.setDoc(
            api.doc(api.db, 'game_saves', user),
            docPatch,
            { merge: true }
        );
        
        Logger.debug('SaveSystem', `Successfully uploaded save data for ${gameId}`);
        
        // Backup management
        await manageBackups(gameId, wrappedData);
        
        return true;
    } catch (err) {
        Logger.error('SaveSystem', 'Firebase save error', err);
        return false;
    }
}

async function manageBackups(gameId, wrappedData) {
    try {
        const user = localStorage.getItem('username') || 'guest';
        if (user === 'guest') return;

        const api = window.firebaseAPI;
        if (!api || !api.db) return;

        const backupsRef = api.doc(api.db, 'game_saves_backups', user);
        const backupsDoc = await api.getDoc(backupsRef);
        
        let backups = {};
        if (backupsDoc.exists()) {
            backups = backupsDoc.data();
        }

        if (!backups[gameId]) {
            backups[gameId] = [];
        }

        backups[gameId].push({
            timestamp: wrappedData.timestamp,
            data: wrappedData
        });

        // Keep only the last N backups
        if (backups[gameId].length > SAVE_CONFIG.maxBackups) {
            backups[gameId] = backups[gameId]
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, SAVE_CONFIG.maxBackups);
        }

        await api.setDoc(backupsRef, backups);
        Logger.debug('SaveSystem', `Backup saved for ${gameId}`);
    } catch (err) {
        Logger.warn('SaveSystem', 'Backup management failed', err);
    }
}

async function loadFirestoreToIframe(gameId, iframe) {
    iframe = iframe || document.getElementById('gameIframe') || document.querySelector('iframe.appContent');
    if (!iframe) {
        Logger.error('SaveSystem', 'Game iframe not found');
        throw new Error('Game iframe not found');
    }

    Logger.debug('SaveSystem', `Loading save data for ${gameId}`);

    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') {
        Logger.debug('SaveSystem', 'Guest user, skipping save load');
        return false;
    }

    const api = window.firebaseAPI;
    if (!api || !api.db) {
        Logger.warn('SaveSystem', 'Firebase not available');
        return false;
    }

    try {
        Logger.debug('SaveSystem', `Fetching save data from Firebase for ${gameId}`);
        const userDoc = await api.getDoc(api.doc(api.db, 'game_saves', user));
        
        if (!userDoc.exists()) {
            Logger.debug('SaveSystem', `No save document found for ${gameId}`);
            return false;
        }

        const docData = userDoc.data();
        
        if (!docData[gameId]) {
            Logger.debug('SaveSystem', `No save data found for ${gameId}`);
            return false;
        }

        let allLocalStorageData = null;
        
        try {
            const raw = JSON.parse(docData[gameId]);
            allLocalStorageData = unwrapSaveData(raw);
            Logger.debug('SaveSystem', `Save data found for ${gameId}`, {
                keys: Object.keys(allLocalStorageData).length
            });
        } catch (e) {
            Logger.error('SaveSystem', 'Failed to parse save data', e);
            return false;
        }

        if (allLocalStorageData && Object.keys(allLocalStorageData).length > 0) {
            // Always use postMessage to restore save data
            try {
                return await loadSaveViaPostMessage(iframe, gameId, allLocalStorageData);
            } catch (err) {
                Logger.error('SaveSystem', `Failed to load save via postMessage for ${gameId}`, err);
                return false;
            }
        } else {
            Logger.debug('SaveSystem', `No save data to load for ${gameId}`);
        }
    } catch (err) {
        Logger.error('SaveSystem', `Load error for ${gameId}`, err);
        return false;
    }
    
    return false;
}

async function loadSaveViaPostMessage(iframe, gameId, allLocalStorageData) {
    return new Promise((resolve) => {
        const messageId = `load_${gameId}_${Date.now()}`;
        let iframeOrigin = '*';
        
        try {
            iframeOrigin = new URL(iframe.src).origin;
        } catch (e) {
            iframeOrigin = '*';
        }

        Logger.debug('SaveSystem', `Attempting cross-origin load for ${gameId}`, {
            messageId,
            dataKeys: Object.keys(allLocalStorageData).length,
            iframeOrigin
        });
        
        const handleResponse = (event) => {
            if (iframeOrigin !== '*' && event.origin !== iframeOrigin) return;
            
            if (event.data && event.data.type === 'loadDataResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);
                Logger.debug('SaveSystem', `Load ${event.data.success ? 'successful' : 'failed'} for ${gameId}`);
                resolve(event.data.success === true);
            }
        };
        
        window.addEventListener('message', handleResponse);
        
        Logger.debug('SaveSystem', `Sending setAllLocalStorageData to ${gameId} iframe`);
        try {
            iframe.contentWindow.postMessage({
                type: 'setAllLocalStorageData',
                gameId: gameId,
                allLocalStorageData: allLocalStorageData,
                messageId: messageId
            }, iframeOrigin);
        } catch (err) {
            Logger.warn('SaveSystem', 'postMessage to iframe failed, falling back to "*" targetOrigin', err);
            try {
                iframe.contentWindow.postMessage({
                    type: 'setAllLocalStorageData',
                    gameId: gameId,
                    allLocalStorageData: allLocalStorageData,
                    messageId: messageId
                }, '*');
            } catch (e) {
                Logger.error('SaveSystem', 'All postMessage attempts failed', e);
            }
        }
        
        setTimeout(() => {
            Logger.warn('SaveSystem', `Cross-origin load timeout for ${gameId}`);
            window.removeEventListener('message', handleResponse);
            resolve(false);
        }, SAVE_CONFIG.timeout);
    });
}

// ============================================================================
// Message Handler - Initial Save Data Requests
// ============================================================================

window.addEventListener('message', function(event) {
    if (!validateOrigin(event.origin)) {
        Logger.warn('SaveSystem', 'Rejected message from untrusted origin', event.origin);
        return;
    }
    
    if (!event.data) return;
    
    // Handle closeWindow action from iframe
    if (event.data.action === 'closeWindow') {
        Logger.info('WindowManager', 'Close window request from iframe');
        // Find the iframe that sent the message
        const iframe = Array.from(document.querySelectorAll('iframe.appContent')).find(
            frame => frame.contentWindow === event.source
        );
        if (iframe) {
            const appIndex = iframe.dataset.appIndex;
            Logger.debug('WindowManager', `Found iframe with appIndex: ${appIndex}`);
            const windowObj = windows.object.find(w => w && w.index != null && w.index == appIndex);
            if (windowObj && typeof windowObj.close === 'function') {
                Logger.info('WindowManager', `Closing window ${appIndex}`);
                windowObj.close();
            } else {
                Logger.warn('WindowManager', `Window object not found or invalid for appIndex ${appIndex}`);
            }
        } else {
            Logger.warn('WindowManager', 'Could not find iframe that sent close request');
        }
        return;
    }
    
    if (!event.data.type) return;
    
    if (event.data.type === 'getInitialSaveData') {
        Logger.debug('SaveSystem', 'Game requesting initial save data', event.data);
        handleInitialSaveDataRequest(event);
    }
    
    if (event.data.type === 'wigdosxp-integration-ready') {
        Logger.debug('SaveSystem', 'Game integration ready', event.data.gameId);
    }
    
    if (event.data && event.data.type === 'admin_get_all_saves') {
        const messageId = event.data.messageId;
        (async () => {
            try {
                const user = localStorage.getItem('username') || 'guest';
                const api = window.firebaseAPI;
                if (user === 'guest' || !api || !api.db) {
                    event.source.postMessage({
                        type: 'admin_all_saves',
                        messageId,
                        user,
                        savesDoc: {}
                    }, event.origin);
                    return;
                }

                const userDoc = await api.getDoc(api.doc(api.db, 'game_saves', user));
                const savesDoc = userDoc.exists() ? userDoc.data() : {};
                event.source.postMessage({
                    type: 'admin_all_saves',
                    messageId,
                    user,
                    savesDoc
                }, event.origin);
            } catch (err) {
                event.source.postMessage({
                    type: 'admin_all_saves',
                    messageId,
                    user: localStorage.getItem('username') || 'guest',
                    savesDoc: {},
                    error: err && err.message ? err.message : String(err)
                }, event.origin);
            }
        })();
        return;
    }

    if (event.data && event.data.type === 'admin_set_wrapped_save') {
        const messageId = event.data.messageId;
        const { gameId, wrappedString } = event.data || {};
        (async () => {
            try {
                const user = localStorage.getItem('username') || 'guest';
                const api = window.firebaseAPI;
                if (user === 'guest' || !api || !api.db) {
                    event.source.postMessage({
                        type: 'admin_set_wrapped_save_response',
                        messageId,
                        success: false,
                        error: 'unauthorized or firebase unavailable'
                    }, event.origin);
                    return;
                }

                if (!gameId || typeof wrappedString !== 'string') {
                    event.source.postMessage({
                        type: 'admin_set_wrapped_save_response',
                        messageId,
                        success: false,
                        error: 'missing gameId or wrappedString'
                    }, event.origin);
                    return;
                }

                await api.setDoc(api.doc(api.db, 'game_saves', user), { [gameId]: wrappedString }, { merge: true });

                event.source.postMessage({
                    type: 'admin_set_wrapped_save_response',
                    messageId,
                    success: true
                }, event.origin);
            } catch (err) {
                event.source.postMessage({
                    type: 'admin_set_wrapped_save_response',
                    messageId,
                    success: false,
                    error: err && err.message ? err.message : String(err)
                }, event.origin);
            }
        })();
        return;
    }

});

async function handleInitialSaveDataRequest(event) {
    const gameId = event.data.gameId;
    const messageId = event.data.messageId;
    
    Logger.debug('SaveSystem', `Processing initial save data request for ${gameId}`);
    
    try {
        const user = localStorage.getItem('username') || 'guest';
        if (user === 'guest') {
            Logger.debug('SaveSystem', `Guest user - no save data for ${gameId}`);
            event.source.postMessage({
                type: 'initialSaveDataResponse',
                messageId: messageId,
                allLocalStorageData: {}
            }, event.origin);
            return;
        }

        const api = window.firebaseAPI;
        if (!api || !api.db) {
            Logger.warn('SaveSystem', `Firebase not available for ${gameId}`);
            event.source.postMessage({
                type: 'initialSaveDataResponse',
                messageId: messageId,
                allLocalStorageData: {}
            }, event.origin);
            return;
        }

        Logger.debug('SaveSystem', `Fetching save data from Firebase for ${gameId}`);
        const userDoc = await api.getDoc(api.doc(api.db, 'game_saves', user));

        let allLocalStorageData = {};
        
        if (userDoc.exists()) {
            const docData = userDoc.data();
            
            if (docData[gameId]) {
                try {
                    const raw = JSON.parse(docData[gameId]);
                    allLocalStorageData = unwrapSaveData(raw);
                    Logger.debug('SaveSystem', `Found save data for ${gameId}`, { 
                        keys: Object.keys(allLocalStorageData).length 
                    });
                } catch (e) {
                    Logger.warn('SaveSystem', 'Failed to parse save data', e);
                    allLocalStorageData = {};
                }
            } else {
                Logger.debug('SaveSystem', `No save data found for ${gameId}`);
            }
        }

        event.source.postMessage({
            type: 'initialSaveDataResponse',
            messageId: messageId,
            allLocalStorageData: allLocalStorageData
        }, event.origin);
        
        Logger.debug('SaveSystem', `Initial save data response sent for ${gameId}`);
        
    } catch (error) {
        Logger.error('SaveSystem', `Error handling initial save data request for ${gameId}`, error);
        event.source.postMessage({
            type: 'initialSaveDataResponse',
            messageId: messageId,
            allLocalStorageData: {},
            error: error.message
        }, event.origin);
    }
}