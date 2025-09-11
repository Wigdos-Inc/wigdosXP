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

        // Minimize Button
        const minBtn = selectBox.appendChild(document.createElement("div"));
        minBtn.classList.add("appMin", "selectBtns");
        minBtn.innerHTML = "<strong>_</strong>";

        minBtn.onclick = () => this.close();
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



        // App Window Main
        const appMain = this.element.appendChild(document.createElement("div"));
        appMain.classList.add("appMain");

        this.iframe = appMain.appendChild(document.createElement("iframe"));
        this.iframe.classList.add("appContent");


        // Focus Functionality
        const overlay = appMain.appendChild(document.createElement("div"));
        overlay.classList.add("appOverlay");
        overlay.style.display = "none";

        document.addEventListener("mousedown", (event) => {

            if (this.element.contains(event.target)) {

                // Focus on Window
                appHeader.classList.remove("headerUnfocus");
                appMain.classList.remove("mainUnfocus");

                // Remove Overlay
                overlay.style.display = "none";

            }
            else {

                // Focus on Window
                appHeader.classList.add("headerUnfocus");
                appMain.classList.add("mainUnfocus");

                // Remove Overlay
                overlay.style.display = "block";

            }
        });



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
        document.addEventListener("mousemove", (event) => {

            if (this.move.current) {

                this.element.style.left = `${event.clientX - this.move.xOffset}px`;
                this.element.style.top = `${event.clientY - this.move.yOffset}px`;

                this.element.style.width = `${this.move.storage.w}px`;
                this.element.style.height = `${this.move.storage.h}px`;

            }
        });
        document.addEventListener("mouseup", () => {

            if (this.move.current) {

                this.move.current = false;
                this.element.style.transition = "all 0.1s";

                const pos = this.element.getBoundingClientRect();
                this.move.storage.x = pos.x;
                this.move.storage.y = pos.y;

                this.iframe.style.pointerEvents = "unset";
                // Remove drag overlay after finishing drag
                if (this.dragOverlay) {
                    this.dragOverlay.remove();
                    this.dragOverlay = null;
                }
                    
            }
        });

        // Focus Logic
        document.addEventListener("mousedown", (event) => this.element.style.zIndex = this.element.contains(event.target) ? 5 : 4);
        this.iframe.addEventListener("mousedown", () => this.element.style.zIndex = 5);

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
        document.addEventListener("mousemove", event => {
            if (!this.resize.current) return;
            const dx = event.clientX - this.resize.startX;
            const dy = event.clientY - this.resize.startY;
            let newLeft = this.resize.startLeft;
            let newTop = this.resize.startTop;
            let newWidth = this.resize.startWidth;
            let newHeight = this.resize.startHeight;
            const dir = this.resize.direction;
            const minW = 350, minH = 225;

            // Horizontal resizing
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
        
            // Vertical resizing
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
        
            // Apply new size
            this.element.style.width = `${newWidth}px`;
            this.element.style.height = `${newHeight}px`;
        
            // Only update left if resizing from the west
            if (dir.includes('w')) {
                this.element.style.left = `${newLeft}px`;
            }
        
            // Only update top if resizing from the north
            if (dir.includes('n')) {
                this.element.style.top = `${newTop}px`;
            }
        
            // Store
            this.move.storage.w = newWidth;
            this.move.storage.h = newHeight;
            if (dir.includes('w')) this.move.storage.x = newLeft;
            if (dir.includes('n')) this.move.storage.y = newTop;
        });
        document.addEventListener("mouseup", () => {
            if (!this.resize.current) return;
            this.resize.current = false;
            this.element.style.transition = "all 0.1s";
            this.iframe.style.pointerEvents = "unset";
            if (this.dragOverlay) { this.dragOverlay.remove(); this.dragOverlay = null; }
        });
    }

    // Close the Application Window
    close() {

        if (this.app.name.s == "su") localStorage.removeItem("suActive");

        // Only attempts saving for apps that support it
        if (this.app.save) {
            // Use new parent-side save system
            pushIframeSaveToFirestore(this.app.name.s)
                .then(saved => {
                    if (saved) {
                        console.log("✅ Game data saved to Firestore");
                    } else {
                        console.log("📝 No save data to upload or guest user");
                    }
                })
                .catch(error => {
                    console.warn("Save Failed!", error);
                })
                .finally(() => {
                    // Always close the window after save attempt
                    this.element.remove();
                    windows.object[this.index] = null;
                });
        } else {
            // Close the application immediately
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
}

// Handle Application Loading
function startApp(app) {

    // Create new Application Window
    const window = new AppWindow(app)
    window.create();
    window.screenChange();

    // Add the App Icon to the App Window Header
    const appImg = window.nameBox.appendChild(document.createElement("img"));
    appImg.classList.add("appIcon"); appImg.src = app.icon.s;

    // Add the App Name to the App Window Header
    const appName = window.nameBox.appendChild(document.createElement("p"));
    appName.classList.add("appName"); appName.innerHTML = app.name.l;

    // Force reload to ensure onload triggers
    window.iframe.src = "";
    setTimeout(() => {
        window.iframe.src = app.path;
    }, 50);


    // If Saving is Enabled, Load Save Data
    if (app.save) {

        window.iframe.onload = async () => {

            if (!window.loaded) {

                // Use new parent-side save system to load data
                try {
                    const loaded = await loadFirestoreToIframe(app.name.s);
                    if (loaded) {
                        console.log("✅ Save data loaded from Firestore into iframe");
                    } else {
                        console.log("📁 No remote save data found or guest user");
                    }
                } catch (error) {
                    console.warn("Could not load save data:", error);
                }

                window.loaded = true;
            }
        }

    }

    // Store AppWindow
    windows.object.push(window);
    windows.index++;
}

// Failsafe
localStorage.removeItem("suActive");
localStorage.removeItem("suData");

// WigdosXP Save System - Parent-side iframe localStorage management
// Reads/writes iframe localStorage directly and syncs with Firebase

// Parent-side: read iframe localStorage and push to Firestore
async function pushIframeSaveToFirestore(gameId) {
    const iframe = document.getElementById('gameIframe') || document.querySelector('iframe.appContent');
    if (!iframe) throw new Error('Game iframe not found');

    let raw;
    
    // Try direct access first (for same-origin iframes)
    try {
        raw = iframe.contentWindow.localStorage.getItem(`${gameId}SaveData`);
    } catch (err) {
        // Cross-origin iframe - use postMessage
        console.log('Cross-origin iframe detected, using postMessage for save operation');
        return await pushSaveViaPostMessage(iframe, gameId);
    }

    if (!raw) return false; // nothing to save

    const data = JSON.parse(raw);
    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') return false; // don't upload guest saves

    // Using WigdosXP's existing Firebase connection
    const api = window.firebaseAPI;
    if (!api || !api.db) return false; // Firebase not available

    await api.setDoc(
        api.doc(api.db, 'game_saves', user),
        { [gameId]: JSON.stringify(data) },
        { merge: true }
    );
    return true;
}

// Handle cross-origin save via postMessage
async function pushSaveViaPostMessage(iframe, gameId) {
    return new Promise((resolve) => {
        const messageId = `save_${gameId}_${Date.now()}`;
        
        // Set up response listener
        const handleResponse = (event) => {
            if (event.data.type === 'saveDataResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);
                
                if (event.data.saveData) {
                    // Upload to Firebase
                    uploadSaveDataToFirebase(gameId, event.data.saveData)
                        .then(success => resolve(success))
                        .catch(() => resolve(false));
                } else {
                    resolve(false); // No save data
                }
            }
        };
        
        window.addEventListener('message', handleResponse);
        
        // Request save data from iframe
        iframe.contentWindow.postMessage({
            type: 'getSaveData',
            gameId: gameId,
            messageId: messageId
        }, '*');
        
        // Timeout after 5 seconds
        setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            resolve(false);
        }, 5000);
    });
}

// Helper function to upload save data to Firebase
async function uploadSaveDataToFirebase(gameId, saveData) {
    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') return false;

    const api = window.firebaseAPI;
    if (!api || !api.db) return false;

    try {
        await api.setDoc(
            api.doc(api.db, 'game_saves', user),
            { [gameId]: JSON.stringify(saveData) },
            { merge: true }
        );
        return true;
    } catch (err) {
        console.error('Firebase save error:', err);
        return false;
    }
}

// Parent-side: load from Firestore and put into iframe localStorage
async function loadFirestoreToIframe(gameId) {
    const iframe = document.getElementById('gameIframe') || document.querySelector('iframe.appContent');
    if (!iframe) throw new Error('Game iframe not found');

    const user = localStorage.getItem('username') || 'guest';
    if (user === 'guest') return false; // no remote saves for guests

    const api = window.firebaseAPI;
    if (!api || !api.db) return false; // Firebase not available

    try {
        const userDoc = await api.getDoc(api.doc(api.db, 'game_saves', user));
        if (userDoc.exists() && userDoc.data()[gameId]) {
            const data = userDoc.data()[gameId];
            
            // Try direct access first (for same-origin iframes)
            try {
                iframe.contentWindow.localStorage.setItem(`${gameId}SaveData`, data);
                return true;
            } catch (err) {
                // Cross-origin iframe - use postMessage
                console.log('Cross-origin iframe detected, using postMessage for load operation');
                return await loadSaveViaPostMessage(iframe, gameId, data);
            }
        }
    } catch (err) {
        console.error('Load error:', err);
        return false;
    }
    
    return false;
}

// Handle cross-origin load via postMessage
async function loadSaveViaPostMessage(iframe, gameId, saveData) {
    return new Promise((resolve) => {
        const messageId = `load_${gameId}_${Date.now()}`;
        
        // Set up response listener
        const handleResponse = (event) => {
            if (event.data.type === 'loadDataResponse' && event.data.messageId === messageId) {
                window.removeEventListener('message', handleResponse);
                resolve(event.data.success === true);
            }
        };
        
        window.addEventListener('message', handleResponse);
        
        // Send save data to iframe
        iframe.contentWindow.postMessage({
            type: 'loadSaveData',
            gameId: gameId,
            saveData: JSON.parse(saveData), // Parse the JSON string
            messageId: messageId
        }, '*');
        
        // Timeout after 5 seconds
        setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            resolve(false);
        }, 5000);
    });
}