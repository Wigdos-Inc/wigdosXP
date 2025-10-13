let windows = {
    index : 0,
    object: []
}

class AppWindow {

    constructor(app) {

        // Meta
        this.element = document.getElementsByTagName("main")[0].appendChild(document.createElement("div"));
        this.index   = windows.index;
        this.app     = app;
        this.full    = app.full;
        this.loaded  = false;

        // Inner Elements
        this.header  = undefined; // Replaced by appHeader at line 40
        this.nameBox = undefined;
        this.iframe  = undefined;

        this.move    = {
            current: false,
            xOffset: 0,
            yOffset: 0,
            storage: {
                x: undefined,
                y: undefined,
                h: 600,
                w: 900
            }
        }
    this.minimized = false;
        // Flag to indicate the window is in the process of closing/teardown
        this._closing = false;
    // Token for a pending background removal (cross-origin close)
    this._pendingRemoval = null;

        // Resize state initialization
        this.resize = {
            current: false,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0
        };
        // Drag overlay placeholder to capture pointer events during drag
        this.dragOverlay = null;
        // Named document handlers (populated in create)
        this._onDocumentMouseDown = null;
        this._onDocumentMouseMove = null;
        this._onDocumentMouseUp = null;
        this._onIframeMouseDown = null;
    }

    // Create the Application Window
    create() {

        if (this.app.name.s == "su") localStorage.setItem("suActive", true);

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

    // Save/Load UI intentionally removed for external UX; saving still available for same-origin apps

        // Minimize Button
        const minBtn = selectBox.appendChild(document.createElement("div"));
        minBtn.classList.add("appMin", "selectBtns");
        minBtn.innerHTML = "<strong>_</strong>";

    minBtn.onclick = () => this.minimize();
        minBtn.style.backgroundImage = "linear-gradient(to bottom right, #96B4F9, #6794fa, #4176F5, #2857c6, #225DE5)";

        // Screen Change Button
        const screenBtn = selectBox.appendChild(document.createElement("div"));
        screenBtn.classList.add("appScreen", "selectBtns");
        const screenImg = screenBtn.appendChild(document.createElement("img")); screenImg.classList.add("screenImg");
        screenImg.src = "assets/images/icons/16x/screen.png"

        screenBtn.onclick = () => {

            this.full = !this.full;
            this.screenChange();
        }
            
        screenBtn.style.backgroundImage = "linear-gradient(to bottom right, #96B4F9, #6794fa, #4176F5, #2857c6, #225DE5)";

        // Close Button
        const closeBtn = selectBox.appendChild(document.createElement("div"));
        closeBtn.classList.add("appClose", "selectBtns");
        closeBtn.innerHTML = "<strong>X</strong>";

        closeBtn.onclick = () => this.close();

        // (removed)



        // App Window Main
        const appMain = this.element.appendChild(document.createElement("div"));
        appMain.classList.add("appMain");

        this.iframe = appMain.appendChild(document.createElement("iframe"));
        this.iframe.classList.add("appContent");
    // Tag iframe with app index for easier targeting/debugging
    this.iframe.dataset.appIndex = this.index;


        // Focus Functionality
        const overlay = appMain.appendChild(document.createElement("div"));
        overlay.classList.add("appOverlay");
        overlay.style.display = "none";

        // Create and register named document handlers so they can be removed when the window closes
        this._onDocumentMouseDown = (event) => {
            if (this.element.contains(event.target)) {
                // Focus on Window
                appHeader.classList.remove("headerUnfocus");
                appMain.classList.remove("mainUnfocus");
                overlay.style.display = "none";
                // Bring window to front via manager
                try { if (window.windowManager) window.windowManager.bringToFront(this); } catch (e) {}
            } else {
                // Unfocused
                appHeader.classList.add("headerUnfocus");
                appMain.classList.add("mainUnfocus");
                overlay.style.display = "block";
            }
            // zIndex management handled by windowManager on focus
        };
        document.addEventListener("mousedown", this._onDocumentMouseDown);

        // Save initial session metadata
        try {
            if (window.windowSessions) {
                window.windowSessions.saveWindow({
                    index: this.index,
                    appId: this.app.name.s,
                    x: this.move.storage.x,
                    y: this.move.storage.y,
                    w: this.move.storage.w,
                    h: this.move.storage.h,
                    full: this.full
                });
            }
        } catch (e) { /* noop */ }



    // Dragging Functionality
        appHeader.addEventListener("mousedown", (event) => {

            if (
                minBtn.contains(event.target) ||
                screenBtn.contains(event.target) || 
                closeBtn.contains(event.target)
            ) { return } else {

                this.move.current = true;
                this.element.style.transition = "unset";

                // Create transparent overlay to capture all pointer events while dragging
                this.dragOverlay = document.createElement("div");
                this.dragOverlay.classList.add("drag-overlay");
                this.element.appendChild(this.dragOverlay);

                // Turn off Iframe Detection
                this.iframe.style.pointerEvents = "none";

                if (this.full) { 
                        
                    // Use the event's currentTarget (appHeader) for measurement.
                    const headerRect = event.currentTarget.getBoundingClientRect();
                    const headerRectFull = appHeader.getBoundingClientRect();
                        
                    // Exit full screen.
                    this.full = false;
                    this.screenChange();
                    this.element.style.transform = "unset";
                        
                    const offsetX = ((event.clientX - headerRectFull.left) / headerRectFull.width) * this.move.storage.w;
                    const offsetY = event.clientY - headerRect.top;
                        
                    // (Optional) If you expect the header size to change in windowed mode,
                    // you can re-measure. In many cases the draggable area remains the same.
                    // Here we simply re-use the same offsets.
                    const newLeft = event.clientX - offsetX;
                    const newTop  = event.clientY - offsetY;
                        
                    // Update stored positions and offsets.
                    this.move.storage.x = newLeft;
                    this.move.storage.y = newTop;
                    this.move.xOffset = offsetX;
                    this.move.yOffset = offsetY;

                } else {

                    // Dragging Logic
                    this.move.xOffset = event.clientX - this.element.offsetLeft;
                    this.move.yOffset = event.clientY - this.element.offsetTop;

                }

            }
        });
        // Document-level move/up handlers handle both dragging and resizing
        this._onDocumentMouseMove = (event) => {
            if (this.move.current) {
                this.element.style.left = `${event.clientX - this.move.xOffset}px`;
                this.element.style.top = `${event.clientY - this.move.yOffset}px`;
                this.element.style.width = `${this.move.storage.w}px`;
                this.element.style.height = `${this.move.storage.h}px`;
            }
            // Resize behavior handled below in the resize-specific code (also sets this.resize.current)
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
                if (this.dragOverlay) { this.dragOverlay.remove(); this.dragOverlay = null; }
            }
            if (this.resize.current) {
                this.resize.current = false;
                this.element.style.transition = "all 0.1s";
                this.iframe.style.pointerEvents = "unset";
                if (this.dragOverlay) { this.dragOverlay.remove(); this.dragOverlay = null; }
            }
            // Persist position/size after move/resize
            try {
                if (window.windowSessions) {
                    window.windowSessions.saveWindow({
                        index: this.index,
                        appId: this.app.name.s,
                        x: this.move.storage.x,
                        y: this.move.storage.y,
                        w: this.move.storage.w,
                        h: this.move.storage.h,
                        full: this.full
                    });
                }
            } catch (e) { /* noop */ }
        };
        document.addEventListener('mousemove', this._onDocumentMouseMove);
        document.addEventListener('mouseup', this._onDocumentMouseUp);

    // Focus Logic: iframe click should bring window to front — keep named handler for removal
    this._onIframeMouseDown = () => { try { if (window.windowManager) window.windowManager.bringToFront(this); } catch (e) {} };
    this.iframe.addEventListener("mousedown", this._onIframeMouseDown);

        // Resize Handles (edges and corners)
        const directions = ["n","e","s","w","ne","nw","se","sw"];
        directions.forEach(dir => {
            const handle = document.createElement("div");
            handle.classList.add("resize-handle", dir);
            handle.dataset.direction = dir;
            this.element.appendChild(handle);
            handle.addEventListener("mousedown", event => {
                if (!this.full) {
                    // Always remove transform when starting resize
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
                    // Remove centering transform when resizing
                    this.element.style.transform = "unset";
                }
            });
        });
        // Resize handles are already wired to set this.resize.*; the unified document handlers above take care of updates and finalization
    }

    // Close the Application Window
    close() {

        if (this.app.name.s == "su") localStorage.removeItem("suActive");

    // Mark closing to prevent restore/minimize races
    this._closing = true;
        // Remove instance document handlers to prevent leaks
        if (this._onDocumentMouseDown) document.removeEventListener('mousedown', this._onDocumentMouseDown);
        if (this._onDocumentMouseMove) document.removeEventListener('mousemove', this._onDocumentMouseMove);
        if (this._onDocumentMouseUp) document.removeEventListener('mouseup', this._onDocumentMouseUp);
        if (this._onIframeMouseDown) this.iframe.removeEventListener('mousedown', this._onIframeMouseDown);

        // Attempt to save for apps that support it. For same-origin we wait for the save attempt to finish
        // so the data is guaranteed to be uploaded. For cross-origin apps we start a background save and
        // hide the window immediately so closing is instant; the DOM element is removed when the save
        // attempt completes or times out.
        const isSameOrigin = (() => {
            try {
                const url = new URL(this.app.path, window.location.href);
                return url.origin === window.location.origin;
            } catch (e) { return false; }
        })();

        if (this.app.save) {
            if (isSameOrigin) {
                // Wait for save then remove
                pushIframeSaveToFirestore(this.app.name.s, this.iframe)
                    .then(saved => { if (saved) console.log("✅ Game data saved to Firestore"); })
                    .catch(err => console.warn('Save failed', err))
                    .finally(() => {
                        try { if (window.windowManager) window.windowManager.unregister(this); } catch (e) {}
                        try { if (window.windowSessions) window.windowSessions.removeWindow(this.index); } catch (e) {}
                        this.element.remove();
                        windows.object[this.index] = null;
                    });
            } else {
                // Cross-origin: start background save but close UI immediately
                // Create a pendingRemoval token so a quick restore can cancel actual DOM removal
                this._pendingRemoval = { cancelled: false };

                try { if (window.windowManager) window.windowManager.unregister(this); } catch (e) {}
                try { if (window.windowSessions) window.windowSessions.removeWindow(this.index); } catch (e) {}

                // Hide the window immediately so it appears closed
                try { this.element.style.display = 'none'; } catch (e) {}

                // Start background save; remove DOM when it completes/timeout
                pushIframeSaveToFirestore(this.app.name.s, this.iframe)
                    .then(saved => { if (saved) console.log("✅ Cross-origin game data saved (background)"); })
                    .catch(err => console.warn('Background save failed', err))
                    .finally(() => {
                        // If a restore cancelled the pending removal, keep the element
                        if (this._pendingRemoval && this._pendingRemoval.cancelled) {
                            // Clear pending flag and leave the window visible; re-register if needed
                            this._pendingRemoval = null;
                            this._closing = false;
                            try { if (window.windowManager) window.windowManager.register(this); } catch (e) {}
                            try { if (window.windowSessions) window.windowSessions.saveWindow({ index: this.index, appId: this.app.name.s, minimized: false, x: this.move.storage.x, y: this.move.storage.y, w: this.move.storage.w, h: this.move.storage.h, full: this.full }); } catch (e) {}
                            return;
                        }

                        try { this.element.remove(); } catch (e) {}
                        windows.object[this.index] = null;
                        this._pendingRemoval = null;
                    });
            }
        } else {
            // Non-saving apps: close immediately
            try { if (window.windowManager) window.windowManager.unregister(this); } catch (e) {}
            try { if (window.windowSessions) window.windowSessions.removeWindow(this.index); } catch (e) {}
            this.element.remove();
            windows.object[this.index] = null;
        }
    }



    screenChange() {

        if (this.full) {

            this.element.classList.add("fullscreen");

            this.element.style.left = 0;
            this.element.style.top = 0;
            this.element.style.transform = "unset"

            this.element.style.height = "100%";
            this.element.style.width = "100%";

            this.element.style.borderTopLeftRadius = 0;
            this.element.style.borderTopRightRadius = 0;

        } else {

            this.element.classList.remove("fullscreen");

            if (this.move.storage.x) {

                this.element.style.left = `${this.move.storage.x}px`;
                this.element.style.top  = `${this.move.storage.y}px`;

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

    // Minimize and restore helpers used by WindowManager UI
    minimize() {
        // Ignore minimize requests while closing
        if (this._closing) return;
        if (this.minimized) return;
        // Ensure the window is registered with the windowManager so it can be tracked
        try { if (window.windowManager && window.windowManager.register) window.windowManager.register(this); } catch (e) {}

        this.minimized = true;
        // Hide the element but keep it in the DOM so restore can work
        try { this.element.style.display = 'none'; } catch (e) {}

        // Notify the windowManager to render minimized UI
        try { if (window.windowManager && window.windowManager.addMinimized) window.windowManager.addMinimized(this); } catch (e) {}

        // Persist minimized state
        try { if (window.windowSessions) window.windowSessions.saveWindow(Object.assign({}, { index: this.index, appId: this.app.name.s, minimized: true, x: this.move.storage.x, y: this.move.storage.y, w: this.move.storage.w, h: this.move.storage.h, full: this.full })); } catch (e) {}
     }

     restore() {
        // Ignore restore requests while closing
        // If a background close/save started a pending removal, cancel it and keep the window
        if (this._pendingRemoval) {
            try { this._pendingRemoval.cancelled = true; } catch (e) {}
            this._pendingRemoval = null;
            this._closing = false;
        }

        if (this._closing) return;
        if (!this.minimized) return;
        // If the element was removed from the DOM (e.g., due to an earlier close race), reattach it
        try {
            if (!this.element.parentNode) {
                const main = document.getElementsByTagName('main')[0];
                if (main) main.appendChild(this.element);
            }
        } catch (e) {}

        this.minimized = false;
        try { this.element.style.display = ''; } catch (e) {}

        // Ensure we're registered and bring to front
        try { if (window.windowManager && window.windowManager.register) window.windowManager.register(this); } catch (e) {}
        try { if (window.windowManager) window.windowManager.bringToFront(this); } catch (e) {}

        // Remove from minimized UI and persist state
        try { if (window.windowManager && window.windowManager.removeMinimized) window.windowManager.removeMinimized(this); } catch (e) {}
        try { if (window.windowSessions) window.windowSessions.saveWindow(Object.assign({}, { index: this.index, appId: this.app.name.s, minimized: false, x: this.move.storage.x, y: this.move.storage.y, w: this.move.storage.w, h: this.move.storage.h, full: this.full })); } catch (e) {}
     }
}

// Handle Application Loading
function startApp(app, session) {

    // Create new Application Window
    const appWindow = new AppWindow(app);
    appWindow.create();

    // If a session object was provided, restore stored geometry/state
    if (session) {
        try {
            if (typeof session.w === 'number') appWindow.move.storage.w = session.w;
            if (typeof session.h === 'number') appWindow.move.storage.h = session.h;
            if (typeof session.x === 'number') appWindow.move.storage.x = session.x;
            if (typeof session.y === 'number') appWindow.move.storage.y = session.y;
            if (typeof session.full === 'boolean') appWindow.full = session.full;
        } catch (e) { /* noop */ }
    }

    appWindow.screenChange();

    // Add the App Icon to the App Window Header
    const appImg = appWindow.nameBox.appendChild(document.createElement("img"));
    appImg.classList.add("appIcon"); appImg.src = app.icon.s;

    // Add the App Name to the App Window Header
    const appName = appWindow.nameBox.appendChild(document.createElement("p"));
    appName.classList.add("appName"); appName.innerHTML = app.name.l;

    // Force reload to ensure onload triggers
    appWindow.iframe.src = "";
    setTimeout(() => {
        appWindow.iframe.src = app.path;
    }, 50);

    // If session requested minimized state, apply after creation
    if (session && session.minimized) {
        setTimeout(() => {
            try { appWindow.minimize(); } catch (e) { /* noop */ }
        }, 120);
    }


    // If Saving is Enabled, Load Save Data
            if (app.save) {

        appWindow.iframe.onload = async () => {

            if (!appWindow.loaded) {

                // Use new parent-side save system to load data
                try {
                    const loaded = await loadFirestoreToIframe(app.name.s, appWindow.iframe);
                    if (loaded) {
                        console.log("✅ Save data loaded from Firestore into iframe");
                    } else {
                        console.log("📁 No remote save data found or guest user");
                    }
                } catch (error) {
                    console.warn("Could not load save data:", error);
                }

                appWindow.loaded = true;
            }
        }

    }

    // Store AppWindow
    windows.object.push(appWindow);
    windows.index++;
    // Register with central WindowManager
    try { if (window.windowManager) window.windowManager.register(appWindow); } catch (e) {}
}

// Failsafe
localStorage.removeItem("suActive");
localStorage.removeItem("suData");

// WigdosXP Save System - Parent-side iframe localStorage management
// Reads/writes iframe localStorage directly and syncs with Firebase

// Parent-side: read entire iframe localStorage and push to Firestore
async function pushIframeSaveToFirestore(gameId, iframe) {
    // Allow explicit iframe to be passed; fall back to legacy selector
    iframe = iframe || document.getElementById('gameIframe') || document.querySelector('iframe.appContent');
    if (!iframe) throw new Error('Game iframe not found');

    let allLocalStorageData;
    
    // Try direct access first (for same-origin iframes)
    try {
        const iframeStorage = iframe.contentWindow.localStorage;
        allLocalStorageData = {};
        
        // Copy all localStorage keys and values
        for (let i = 0; i < iframeStorage.length; i++) {
            const key = iframeStorage.key(i);
            allLocalStorageData[key] = iframeStorage.getItem(key);
        }
    } catch (err) {
    // Cross-origin iframe - use postMessage
    console.log('Cross-origin iframe detected, using postMessage for save operation');
    return await pushSaveViaPostMessage(iframe, gameId);
    }

    // Check if there's any data to save
    if (Object.keys(allLocalStorageData).length === 0) return false;

    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') return false; // don't upload guest saves

    // Using WigdosXP's existing Firebase connection
    const api = window.firebaseAPI;
    if (!api || !api.db) return false; // Firebase not available

    await api.setDoc(
        api.doc(api.db, 'game_saves', user),
        { [gameId]: JSON.stringify(allLocalStorageData) },
        { merge: true }
    );
    return true;
}

// Handle cross-origin save via postMessage
async function pushSaveViaPostMessage(iframe, gameId) {
    return new Promise((resolve) => {
        const messageId = `save_${gameId}_${Date.now()}`;
        // Determine iframe origin to use as postMessage targetOrigin and for validation
        let iframeOrigin = '*';
        try { iframeOrigin = new URL(iframe.src).origin; } catch (e) { iframeOrigin = '*'; }

        console.log(`💾 Attempting cross-origin save for ${gameId}`, {
            messageId,
            iframeSrc: iframe.src,
            iframeOrigin
        });
        
        // Set up response listener
        const handleResponse = (event) => {
            // Ignore messages that don't come from the iframe origin (when known)
            if (iframeOrigin !== '*' && event.origin !== iframeOrigin) return;
            console.log(`📨 Received save response for ${gameId} (origin: ${event.origin}):`, event.data);
            if (event.data && event.data.type === 'saveDataResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);

                if (event.data.allLocalStorageData && Object.keys(event.data.allLocalStorageData).length > 0) {
                    console.log(`✅ Save data received for ${gameId}, uploading to Firebase...`);
                    // Upload to Firebase
                    uploadSaveDataToFirebase(gameId, event.data.allLocalStorageData)
                        .then(success => {
                            console.log(`🔥 Firebase upload ${success ? 'successful' : 'failed'} for ${gameId}`);
                            resolve(success);
                        })
                        .catch((err) => {
                            console.error(`❌ Firebase upload error for ${gameId}:`, err);
                            resolve(false);
                        });
                } else {
                    console.log(`📭 No save data received for ${gameId}`);
                    resolve(false); // No save data
                }
            }
        };
        
        window.addEventListener('message', handleResponse);
        
        // Request all localStorage data from iframe (targeting the iframe's origin)
        console.log(`📤 Sending getAllLocalStorageData to ${gameId} iframe (targetOrigin=${iframeOrigin})...`);
        try {
            iframe.contentWindow.postMessage({
                type: 'getAllLocalStorageData',
                gameId: gameId,
                messageId: messageId
            }, iframeOrigin);
        } catch (err) {
            console.warn('postMessage to iframe failed, falling back to "*" targetOrigin', err);
            try { iframe.contentWindow.postMessage({ type: 'getAllLocalStorageData', gameId: gameId, messageId: messageId }, '*'); } catch (e) {}
        }
        
        // Timeout after 5 seconds
        setTimeout(() => {
            console.warn(`⏰ Cross-origin save timeout for ${gameId} - game may not have integration script`);
            window.removeEventListener('message', handleResponse);
            resolve(false);
        }, 5000);
    });
}

// Helper function to upload save data to Firebase
async function uploadSaveDataToFirebase(gameId, allLocalStorageData) {
    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') return false;

    const api = window.firebaseAPI;
    if (!api || !api.db) return false;

    try {
        await api.setDoc(
            api.doc(api.db, 'game_saves', user),
            { [gameId]: JSON.stringify(allLocalStorageData) },
            { merge: true }
        );
        return true;
    } catch (err) {
        console.error('Firebase save error:', err);
        return false;
    }
}

// Parent-side: load from Firestore and restore entire iframe localStorage
async function loadFirestoreToIframe(gameId, iframe) {
    // Allow passing explicit iframe, otherwise fallback to legacy selector
    iframe = iframe || document.getElementById('gameIframe') || document.querySelector('iframe.appContent');
    if (!iframe) throw new Error('Game iframe not found');

    console.log(`🎮 Loading save data for ${gameId}`, {
        iframeOrigin: iframe.src,
        sameOrigin: iframe.src.startsWith(window.location.origin)
    });

    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') {
        console.log(`👤 Guest user detected, skipping save load for ${gameId}`);
        return false; // no remote saves for guests
    }

    const api = window.firebaseAPI;
    if (!api || !api.db) {
        console.warn(`🔥 Firebase not available for ${gameId}`);
        return false; // Firebase not available
    }

    try {
        console.log(`🔍 Fetching save data from Firebase for ${gameId}...`);
        const userDoc = await api.getDoc(api.doc(api.db, 'game_saves', user));
        if (userDoc.exists() && userDoc.data()[gameId]) {
            const allLocalStorageData = JSON.parse(userDoc.data()[gameId]);
            console.log(`📦 Save data found for ${gameId}:`, Object.keys(allLocalStorageData));
            
            // Try direct access first (for same-origin iframes)
            try {
                const iframeStorage = iframe.contentWindow.localStorage;
                
                console.log(`🔓 Same-origin access successful for ${gameId}, restoring directly...`);
                // Clear existing localStorage and restore all saved data
                iframeStorage.clear();
                Object.keys(allLocalStorageData).forEach(key => {
                    iframeStorage.setItem(key, allLocalStorageData[key]);
                });
                
                console.log(`✅ Direct localStorage restore completed for ${gameId}`);
                return true;
            } catch (err) {
                // Cross-origin iframe - use postMessage
                console.log(`🌐 Cross-origin iframe detected for ${gameId}, using postMessage...`);
                return await loadSaveViaPostMessage(iframe, gameId, allLocalStorageData);
            }
        } else {
            console.log(`📭 No save data found for ${gameId}`);
        }
    } catch (err) {
        console.error(`❌ Load error for ${gameId}:`, err);
        return false;
    }
    
    return false;
}

// Handle cross-origin load via postMessage
async function loadSaveViaPostMessage(iframe, gameId, allLocalStorageData) {
    return new Promise((resolve) => {
        const messageId = `load_${gameId}_${Date.now()}`;
        // Determine iframe origin to use as postMessage targetOrigin and for validation
        let iframeOrigin = '*';
        try { iframeOrigin = new URL(iframe.src).origin; } catch (e) { iframeOrigin = '*'; }

        console.log(`🔄 Attempting cross-origin load for ${gameId}`, {
            messageId,
            dataKeys: Object.keys(allLocalStorageData),
            iframeSrc: iframe.src,
            iframeOrigin
        });
        
        // Set up response listener
        const handleResponse = (event) => {
            // Ignore messages that don't come from the iframe origin (when known)
            if (iframeOrigin !== '*' && event.origin !== iframeOrigin) return;
            console.log(`📨 Received response for ${gameId} (origin: ${event.origin}):`, event.data);
            if (event.data && event.data.type === 'loadDataResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);
                console.log(`✅ Load ${event.data.success ? 'successful' : 'failed'} for ${gameId}`);
                resolve(event.data.success === true);
            }
        };
        
        window.addEventListener('message', handleResponse);
        
        // Send all localStorage data to iframe
        console.log(`📤 Sending setAllLocalStorageData to ${gameId} iframe (targetOrigin=${iframeOrigin})...`);
        try {
            iframe.contentWindow.postMessage({
                type: 'setAllLocalStorageData',
                gameId: gameId,
                allLocalStorageData: allLocalStorageData,
                messageId: messageId
            }, iframeOrigin);
        } catch (err) {
            console.warn('postMessage to iframe failed, falling back to "*" targetOrigin', err);
            try { iframe.contentWindow.postMessage({ type: 'setAllLocalStorageData', gameId: gameId, allLocalStorageData: allLocalStorageData, messageId: messageId }, '*'); } catch (e) {}
        }
        
        // Timeout after 5 seconds
        setTimeout(() => {
            console.warn(`⏰ Cross-origin load timeout for ${gameId} - game may not have integration script`);
            window.removeEventListener('message', handleResponse);
            resolve(false);
        }, 5000);
    });
}

// Enhanced integration: Handle requests from iframes for initial save data
window.addEventListener('message', function(event) {
    // Validate message structure
    if (!event.data || !event.data.type) return;
    
    // Handle initial save data request from newly loaded games
    if (event.data.type === 'getInitialSaveData') {
        console.log(`🎮 Game requesting initial save data:`, event.data);
        handleInitialSaveDataRequest(event);
    }
    
    // Handle integration ready signals
    if (event.data.type === 'wigdosxp-integration-ready') {
        console.log(`✅ Game integration ready:`, event.data.gameId);
    }
});

// Handle initial save data request from iframe
async function handleInitialSaveDataRequest(event) {
    const gameId = event.data.gameId;
    const messageId = event.data.messageId;
    
    console.log(`📦 Processing initial save data request for ${gameId}`);
    
    try {
        const user = localStorage.getItem('username') || 'guest';
        if (user === 'guest') {
            console.log(`👤 Guest user - no save data to provide for ${gameId}`);
            event.source.postMessage({
                type: 'initialSaveDataResponse',
                messageId: messageId,
                allLocalStorageData: {}
            }, event.origin);
            return;
        }

        const api = window.firebaseAPI;
        if (!api || !api.db) {
            console.warn(`🔥 Firebase not available for ${gameId}`);
            event.source.postMessage({
                type: 'initialSaveDataResponse',
                messageId: messageId,
                allLocalStorageData: {}
            }, event.origin);
            return;
        }

        console.log(`🔍 Fetching save data from Firebase for ${gameId}...`);
        const userDoc = await api.getDoc(api.doc(api.db, 'game_saves', user));
        
        let allLocalStorageData = {};
        if (userDoc.exists() && userDoc.data()[gameId]) {
            allLocalStorageData = JSON.parse(userDoc.data()[gameId]);
            console.log(`📦 Found save data for ${gameId}:`, Object.keys(allLocalStorageData));
        } else {
            console.log(`📭 No save data found for ${gameId}`);
        }

        // Send the save data back to the iframe
        event.source.postMessage({
            type: 'initialSaveDataResponse',
            messageId: messageId,
            allLocalStorageData: allLocalStorageData
        }, event.origin);
        
        console.log(`📤 Initial save data response sent for ${gameId}`);
        
    } catch (error) {
        console.error(`❌ Error handling initial save data request for ${gameId}:`, error);
        event.source.postMessage({
            type: 'initialSaveDataResponse',
            messageId: messageId,
            allLocalStorageData: {},
            error: error.message
        }, event.origin);
    }
}