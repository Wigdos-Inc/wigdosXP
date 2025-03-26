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
        screenBtn.innerHTML = "<strong>W</strong>";

        if (this.cClose) {

            screenBtn.onclick = () => {

                this.full = !this.full;
                this.screenChange();
                screenBtn.style.backgroundImage = "linear-gradient(to bottom right, #96B4F9, #6794fa, #4176F5, #2857c6, #225DE5)";
            }

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
        os.src = "../../assets/images/icons/16x/creature.png";


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

                        // Normal dragging.
                        this.move.xOffset = event.clientX - this.element.offsetLeft;
                        this.move.yOffset = event.clientY - this.element.offsetTop;

                    }


                }
            });

            document.addEventListener("mousemove", (event) => {

                if (this.move.current) {

                    this.element.style.left = `${event.clientX - this.move.xOffset}px`;
                    this.element.style.top = `${event.clientY - this.move.yOffset}px`;

                    // Requires Debugging
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
            appIcon = "../../assets/images/icons/16x/files.png";
            appTitle = "File Explorer";

            appender = files(appender);
        
            break;

        case "browser": 

            cClose = false;
            cMove = false;
            full = true;
            appIcon = "../../assets/images/icons/16x/wiggleSearch.png";
            appTitle = "WiggleSearch";

            appender = null;
        
        break;

        case "notepad":

            cClose = true;
            cMove = true;
            full = false;
            appIcon = "../../assets/images/icons/16x/notepad.png";
            appTitle = "Notepad";

            appender = notes(appender);

            break;

        case "bin":
    
            cClose = true;
            cMove = true;
            full = false;
            appIcon = "../../assets/images/icons/16x/recycle.png";
            appTitle = "Recycling Bin";

            appender = bin(appender);
    
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



function files(appContentBox) {

    appContentBox.classList.add("filesBox");

    // Store Box Content
    const itemInfo = {
        images: 
        [
            "../../assets/images/icons/32x/creature.png",
            "../../assets/images/icons/32x/files.png",
            "../../assets/images/icons/32x/files.png"
        ],

        text  :
        [
            "Let's Play A Game.exe",
            "Bomb Instructions",
            "Credits"
        ],

        action:
        [
            () => creature(),
            () => console.log("click"),
            () => console.log("click")
        ]
    }


    let filesItems = [];
    let prevItem;
    for (let i=0; i < 3; i++) {

        const filesItem = appContentBox.appendChild(document.createElement("div"));
        filesItem.classList.add("filesItem");

        // Create and Assign Content to Box
        let item = {
            parent: filesItem,
            image : filesItem.appendChild(document.createElement("img")),
            text  : filesItem.appendChild(document.createElement("p")),
            action: itemInfo.action[i],
            index : i,

            select: {
                count : 0,
                change: false,
                old   : undefined
            },

            change: function(type) {

                if (type && !this.select.change && this.select.count > 1) {

                    this.select.change = true;

                    // Store Previous Name
                    this.select.old = this.text.innerHTML;
                    this.text.remove();

                    // Create Input Field for Renaming
                    this.text = filesItem.appendChild(document.createElement("input"));
                    this.text.type = "text";
                    this.text.class = "appInput";
                    this.text.value = this.select.old;

                    // Renaming Finalizes when Pressing Enter
                    this.text.addEventListener("keydown", (event) => {

                        if (event.key === "Enter") this.change(false);
                    });

                }
                else if (!type && this.select.change) {

                    let value = (this.text.value == "") ? this.select.old : this.text.value;

                    this.text.remove();
                    this.select.change = false;
                    this.select.old = undefined;
                    this.select.count = 0;

                    this.text = filesItem.appendChild(document.createElement("p"));
                    this.text.innerHTML = value;

                }
            }
        }
        item.image.src = itemInfo.images[i];
        item.text.innerHTML = itemInfo.text[i];

        
        // Renaming and Activation Detection
        let prevClick = {};
        filesItem.addEventListener("click", (event) => {

            if (prevItem && !prevItem.parent.contains(event.target)) {
                prevItem.select.count = 0;
                prevItem.parent.classList.remove("filesItemSelected");
            }
            
            filesItem.classList.add("filesItemSelected");
            prevItem = item;

            // Renaming
            item.select.count++;
            if (event.target.tagName == "P") item.change(true);

            // Activation
            const cTime = Date.now();
            const pTime = prevClick[i];

            if (pTime && (cTime - pTime) < 500 && event.target !== item.text) item.action();

            prevClick[i] = cTime;
        });

        document.addEventListener("mousedown", (event) => {

            if (event.target !== item.text) item.change(false);
            if (prevItem && event.target !== prevItem.parent) prevItem.parent.classList.remove("filesItemSelected"); 
        });

        document.addEventListener("keydown", (event) => {

            if (event.key === "Enter") item.change(false);
        });

        filesItems.push(item);
    }

    return appContentBox;
}

function notes() {

    return null;
}
function bin() {

    return null;
}