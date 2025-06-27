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

        if (this.app.name.s == "su") sessionStorage.setItem("suActive", true);

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
                event.stopPropagation();
                this.resize.current = true;
                this.resize.direction = dir;
                this.resize.startX = event.clientX;
                this.resize.startY = event.clientY;
                const rect = this.element.getBoundingClientRect();
                this.resize.startWidth = rect.width;
                this.resize.startHeight = rect.height;
                this.resize.startLeft = rect.left;
                this.resize.startTop = rect.top;
                this.element.style.transition = "unset";
                this.iframe.style.pointerEvents = "none";
                this.dragOverlay = document.createElement("div");
                this.dragOverlay.classList.add("drag-overlay");
                this.element.appendChild(this.dragOverlay);
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
            if (dir.includes('e')) newWidth = this.resize.startWidth + dx;
            if (dir.includes('s')) newHeight = this.resize.startHeight + dy;
            if (dir.includes('w')) { newWidth = this.resize.startWidth - dx; newLeft = this.resize.startLeft + dx; }
            if (dir.includes('n')) { newHeight = this.resize.startHeight - dy; newTop = this.resize.startTop + dy; }
            const minW = 350, minH = 225
            if (newWidth < minW) {
                newWidth = minW;
                if (dir.includes('w')) newLeft = this.resize.startLeft + (this.resize.startWidth - minW);
            }
            if (newHeight < minH) {
                newHeight = minH;
                if (dir.includes('n')) newTop = this.resize.startTop + (this.resize.startHeight - minH);
            }
            // Apply
            this.element.style.width = `${newWidth}px`;
            this.element.style.height = `${newHeight}px`;
            this.element.style.left = `${newLeft}px`;
            this.element.style.top = `${newTop}px`;
            // Store
            this.move.storage.w = newWidth;
            this.move.storage.h = newHeight;
            this.move.storage.x = newLeft;
            this.move.storage.y = newTop;
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

        if (this.app.name.s == "su") sessionStorage.removeItem("suActive");

        const iframeWindow = this.iframe?.contentWindow;
        if (!iframeWindow) {
            this.element.remove();
            windows.object[this.index] = null;
            return;
        }

        // Only attempts saving for apps that support it
        if (this.app.save) {

            const channel = new MessageChannel();

            // Handle Save Response
            channel.port1.onmessage = async (event) => {

                if (event.data.status === "success") {

                    console.log("✅ Iframe Confirms Save Request");

                    // Engage in Save Shenanigans
                    if (event.data.saveData) {

                        try {
                            const { db, setDoc, doc } = window.firebaseAPI;
                            const saveData = JSON.stringify(event.data.saveData);

                            console.log("DB Used");

                            if (getUser() != "guest") {

                                // Upload Save Data to DB
                                await setDoc(
                                    doc(db, "game_saves", getUser()), 
                                    { [this.app.name.s]: saveData },
                                    { merge: true }
                                );

                            }
                            else sessionStorage.setItem(`${this.app.name.s}SaveData`, saveData); // Store in SessionStorage
                        }
                        catch (error) {
                            console.warn("Save Failed!");
                            console.warn(error);
                        }

                    }

                    // After save finishes, clean up
                    this.element.remove();
                    windows.object[this.index] = null;

                }
                else console.warn("Save Failed!");
            };

            // Send message and port to iframe
            iframeWindow.postMessage(
                { type: "save" },
                "*",
                [channel.port2] // pass the port for reply
            );

            // Timeout fallback (in case iframe is frozen or doesn't respond)
            setTimeout(() => {
                console.warn("⏱️ Save took too long. Forcing close.");
                this.element.remove();
                windows.object[this.index] = null;
            }, 5000); // 5 second fallback
            
        } else {
            // Close the application
            this.element.remove();
            windows.object[this.index] = null;
        }
    }



    screenChange() {

        if (this.full) {

            this.element.style.left = 0;
            this.element.style.top = 0;
            this.element.style.transform = "unset"

            this.element.style.height = "100%";
            this.element.style.width = "100%";

            this.element.style.borderTopLeftRadius = 0;
            this.element.style.borderTopRightRadius = 0;

        } else {

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


    // If Saving is Enabled, Send Save Data
    if (app.save) {

        window.iframe.onload = async () => {

            if (!window.loaded) {

                // Prep Save Data (Default: Null)
                let saveData = null;

                if (getUser() != "guest" && !localStorage.getItem(`${app.name.s}Data`)) {

                    // Retrieve Save Data from DB
                    try {
                        const { db, getDoc, doc } = lazy();
                        const userDoc = await getDoc(doc(db, "game_saves", getUser()));

                        console.log(userDoc.exists(), userDoc.data()[app.name.s]);
                        console.log("DB Used");

                        // Check if Save Data exists
                        if (userDoc.exists() && userDoc.data()[app.name.s]) {
                            saveData = JSON.parse(userDoc.data()[app.name.s]);
                        }
                    }
                    catch (error) {
                        console.warn("Could not retrieve Save Data");
                        console.warn(error);
                    }

                }
                else if (sessionStorage.getItem(`${app.name.s}SaveData`)) saveData = JSON.parse(sessionStorage.getItem(`${app.name.s}SaveData`));


                // Send Data to App
                window.iframe.contentWindow.postMessage({ type: "load", saveData: saveData }, "*");
                console.log("Save Data Sent");
                window.loaded = true;

            }
        }

    }

    // Store AppWindow
    windows.object.push(window);
    windows.index++;
}
function lazy() { return window.firebaseAPI };

// Failsafe
sessionStorage.removeItem("suActive");
sessionStorage.removeItem("suData");