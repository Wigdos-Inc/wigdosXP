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
                    
            }
        });
    }

    // Close the Application Window
    close() {

        this.element.remove();
        windows.object[this.index] = null;
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
            appIcon = ""; // Doesn't exist yet...
            appTitle = "C4 Defusal";
            path = "apps/bombs/c4.html";
    
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

    windows.object.push(application);
    windows.index++;
}