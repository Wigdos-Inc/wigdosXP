let windows = {
    index : 0,
    object: []
}

class AppWindow {

    constructor(cClose, cMove, full) {

        this.element = document.getElementsByTagName("main")[0].appendChild(document.createElement("div"));
        this.focus   = false;
        this.cClose  = cClose;
        this.index   = windows.index;
        this.nameBox = undefined;
        this.full    = full;

        this.header  = undefined;
        this.content = undefined;

        this.move    = {
            able   : cMove,
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


        // Close Button
        const selectBox = appHeader.appendChild(document.createElement("div"));
        selectBox.classList.add("selectBox");


        const minBtn = selectBox.appendChild(document.createElement("div"));
        minBtn.classList.add("appMin", "selectBtns");
        minBtn.innerHTML = "<strong>_</strong>";

        minBtn.onclick = () => this.close();
        minBtn.style.backgroundImage = "linear-gradient(to bottom right, #96B4F9, #6794fa, #4176F5, #2857c6, #225DE5)";


        const screenBtn = selectBox.appendChild(document.createElement("div"));
        screenBtn.classList.add("appScreen", "selectBtns");
        const screenImg = screenBtn.appendChild(document.createElement("img")); screenImg.classList.add("screenImg");
        screenImg.src = "assets/images/icons/16x/screen.png"

        if (this.cClose) {

            screenBtn.onclick = () => {

                this.full = !this.full;
                this.screenChange();
            }
            
            screenBtn.style.backgroundImage = "linear-gradient(to bottom right, #96B4F9, #6794fa, #4176F5, #2857c6, #225DE5)";

        } else screenBtn.style.backgroundColor = "grey";


        const closeBtn = selectBox.appendChild(document.createElement("div"));
        closeBtn.classList.add("appClose", "selectBtns");
        closeBtn.innerHTML = "<strong>X</strong>";

        closeBtn.onclick = () => this.close();



        // App Window Main
        const appMain = this.element.appendChild(document.createElement("div"));
        appMain.classList.add("appMain");


        // Top Bar
        this.header = appMain.appendChild(document.createElement("div"));
        this.header.classList.add("appMainTopBar");

        const os = this.header.appendChild(document.createElement("img"));
        os.classList.add("appOS");
        os.src = "assets/images/icons/16x/creature.png";
        os.onclick = () => creature();


        // Mid Bar (Content Depends on Application)
        this.content = appMain.appendChild(document.createElement("div"));
        this.content.classList.add("appMainMidBar");


        // Bottom Bar
        const bottomBar = appMain.appendChild(document.createElement("div"));
        bottomBar.classList.add("appMainBottomBar");



        // Drag Functionality

        if (this.move.able) {

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
                        const headerRectFull = this.header.getBoundingClientRect();
                        
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
    }

    // Close the Application Window
    close() {

        if (this.cClose) {
            this.element.remove();
            windows.object[this.index] = null;
        }
        else index();
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

            this.move.able = false;

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

            this.move.able = true;

        }
    }
}


// Handle Application Loading
function application(type) {

    let cClose;
    let cMove;
    let full;
    let appTitle;
    let appIcon;

    let appender = document.createElement("div");

    switch (type) {

        case "files": 

            cClose = true;
            cMove = true;
            full = false;
            appIcon = "assets/images/icons/16x/files.png";
            appTitle = "File Explorer";

            appender = files(appender);
        
            break;

        case "browser": 

            cClose = false;
            cMove = false;
            full = true;
            appIcon = "assets/images/icons/16x/wiggleSearch.png";
            appTitle = "WiggleSearch";

            appender = null;
        
        break;

        case "notepad":

            cClose = true;
            cMove = true;
            full = false;
            appIcon = "assets/images/icons/16x/notepad.png";
            appTitle = "Notepad";

            appender = notes(appender);

            break;

        case "bin":
    
            cClose = true;
            cMove = true;
            full = false;
            appIcon = "assets/images/icons/16x/recycle.png";
            appTitle = "Recycling Bin";

            appender = bin(appender);
    
            break;


        case "c4":
    
            cClose = false;
            cMove = false;
            full = true;
            appIcon = "";
            appTitle = "C4 Defusal";

            appender = null;
    
            break;

        default: return;
    }
    
    const application = new AppWindow(cClose, cMove, full)
    application.create();
    application.screenChange();

    const appImg = application.nameBox.appendChild(document.createElement("img"));
    appImg.classList.add("appIcon"); appImg.src = appIcon;

    const appName = application.nameBox.appendChild(document.createElement("p"));
    appName.classList.add("appName"); appName.innerHTML = appTitle;

    if (appender) {
        appender.classList.add("appender");
        application.content.appendChild(appender);
    }

    windows.object.push(application);
    windows.index++;
}