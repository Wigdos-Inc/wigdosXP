let windows = {
    index : 0,
    object: []
}

class AppWindow {

    constructor(full) {

        this.element = document.getElementsByTagName("main")[0].appendChild(document.createElement("div"));
        this.focus   = false;
        this.index   = windows.index;
        this.nameBox = undefined;
        this.full    = full;

        this.header  = undefined; // Replaced by appHeader at line 40
        this.iframe = undefined;

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
                        
                    // ALL THIS IS FULLY AI, though I had to re-arrange some of it because it got confused.
                    // I justify copying AI here because it is a niche QoL feature that would not have been worth the time investment
                    // In a professional setting I would not have done this.

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

        // Use MessageChannel to wait for reply from iframe
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
        }, 1000); // 1 second fallback
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
function application(type) {

    let full;
    let appTitle;
    let appIcon;
    let path;

    let offset = [0, 0];

    switch (type) {

        case "files": 

            full = false;
            appIcon = "assets/images/icons/16x/files.png";
            appTitle = "File Explorer";
            path = "apps/files.html";
        
            break;

        case "browser": 

            full = true;
            appIcon = "assets/images/icons/16x/wiggleSearch.png";
            appTitle = "WiggleSearch";
            path = "apps/browser/fuzzy.html";
        
        break;

        case "notes":

            full = false;
            appIcon = "assets/images/icons/16x/notepad.png";
            appTitle = "Notepad";
            path = "apps/notes.html";

            break;

        case "bin":
    
            full = false;
            appIcon = "assets/images/icons/16x/recycle.png";
            appTitle = "Recycling Bin";
            path = "apps/bin.html";
    
            break;


        case "c4":
    
            full = true;
            appIcon = "assets/images/bombs/c4.png"; // placeholder...
            appTitle = "C4 Defusal";
            path = "apps/bombs/c4.html";
    
            break;

        case "feddy1": // TEMPLATE YOU FOOKIN DONKEY

            full = true;
            appIcon = "assets/images/icons/games/fnaf/feddy1.png";
            appTitle = "FNAF 1";
            path = "https://danie-glr.github.io/wigdos_games/1/";

            break;

        case "feddy2": // TEMPLATE YOU FOOKIN DONKEY

            full = true;
            appIcon = "assets/images/icons/games/fnaf/feddy2.png";
            appTitle = "FNAF 2";
            path = "https://danie-glr.github.io/wigdos_games/2/";

            break;

        case "feddy3": // TEMPLATE YOU FOOKIN DONKEY

            full = true;
            appIcon = "assets/images/icons/games/fnaf/feddy3.png";
            appTitle = "FNAF 3";
            path = "https://danie-glr.github.io/wigdos_games/3/";

            break;

        case "feddy4": // TEMPLATE YOU FOOKIN DONKEY

            full = true;
            appIcon = "assets/images/icons/games/fnaf/feddy4.png";
            appTitle = "FNAF 4";
            path = "https://danie-glr.github.io/wigdos_games/4/";

            break;

        case "feddyW": // TEMPLATE YOU FOOKIN DONKEY

            full = true;
            appIcon = "assets/images/icons/games/fnaf/";
            appTitle = "FNAF 4";
            path = "https://danie-glr.github.io/wigdos_games/4/";

            break;

        case "sm64": // TEMPLATE YOU FOOKIN DONKEY

            full = true;
            appIcon = "assets/images/icons/games/other/mayro.png";
            appTitle = "Supra Mayro Bors 96";
            path = "https://danie-glr.github.io/wigdos_mayro/sm64/mario.html";

            break;

        case "undertale": // TEMPLATE YOU FOOKIN DONKEY

            full = true;
            appIcon = "assets/images/icons/games/other/favicon.ico";
            appTitle = "Undertale";
            path = "https://michaeld1b.github.io/Undertale-HTML/";

            break;
        default: return;
    }

    
    // Create new Application Window
    const application = new AppWindow(full)
    application.create();
    application.screenChange();


    // Add the App Icon to the App Window Header
    const appImg = application.nameBox.appendChild(document.createElement("img"));
    appImg.classList.add("appIcon"); appImg.src = appIcon;

    // Add the App Name to the App Window Header
    const appName = application.nameBox.appendChild(document.createElement("p"));
    appName.classList.add("appName"); appName.innerHTML = appTitle;

    
    // Display Application Content through iframe
    application.iframe.src = path;
    // If this is Undertale, send username via postMessage after iframe loads
    if (type === "undertale") {
        application.iframe.onload = () => {
            const username = sessionStorage.getItem("username") || "guest";

            // Send to the iframe's window
            application.iframe.contentWindow.postMessage({
                type: "setUser",
                username: username
            }, "*"); // Replace '*' with Undertale domain to secure it if desired
        };
    }


    windows.object.push(application);
    windows.index++;
}