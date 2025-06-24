let windows = {
    index : 0,
    object: []
}

class AppWindow {

    constructor(app) {

        // Meta
        this.element = document.getElementsByTagName("main")[0].appendChild(document.createElement("div"));
        this.focus   = false;
        this.index   = windows.index;
        this.app     = app;

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
                h: 400,
                w: 600
            }
        }
    }

    // Create the Application Window
    create() {

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

            this.app.full = !this.app.full;
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



        // Drag Functionality

        appHeader.addEventListener("mousedown", (event) => {

            if (
                minBtn.contains(event.target) ||
                screenBtn.contains(event.target) || 
                closeBtn.contains(event.target)
            ) {return} else {

                this.move.current = true;
                this.element.style.transition = "unset";

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
                    
            }
        });
    }

    // Close the Application Window
    close() {
        const iframeWindow = this.iframe?.contentWindow;
        if (!iframeWindow) {
            this.element.remove();
            windows.object[this.index] = null;
            return;
        }

        // Only attempts saving for apps that support it
        if (this.app.save) {

            window.alert("saving"); // It tries to save, iframe returns positive. But no save data is found/loaded upon restart

            const channel = new MessageChannel();

            channel.port1.onmessage = (event) => {
                if (event.data === "save-complete") {
                    console.log("✅ Save confirmed by iframe");

                    // After save finishes, clean up
                    this.element.remove();
                    windows.object[this.index] = null;
                }
            };

            // Send message and port to iframe
            iframeWindow.postMessage(
                { type: "saveGame" },
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

        if (this.app.full) {

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

function getUser() {
    // Use your existing logic to get the username
    // This assumes you store the username in localStorage after login.
    return localStorage.getItem("username") || "guest";
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

    // If this is Undertale, send username via postMessage after iframe loads
    // Use app.name.s or add an id property for clarity
    if (app.name.s === "ut") {
        window.iframe.onload = () => {
            const username = getUser();

            // Send to the iframe's window
            window.iframe.contentWindow.postMessage({
                type: "setUser",
                username: username
            }, "*");
            console.log("[WigdosXP] Sent setUser postMessage:", username);
        };
    }

    // Store AppWindow
    windows.object.push(window);
    windows.index++;
}