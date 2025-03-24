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
        this.cMove   = cMove;
        this.full    = full;

        this.header  = undefined;
        this.content = undefined;
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


        // Top Bar (Content Depends on Application)
        this.header = appMain.appendChild(document.createElement("div"));
        this.header.classList.add("appMainTopBar");


        // Mid Bar (Content Depends on Application)
        this.content = appMain.appendChild(document.createElement("div"));
        this.content.classList.add("appMainMidBar");


        // Bottom Bar
        const bottomBar = appMain.appendChild(document.createElement("div"));
        bottomBar.classList.add("appMainBottomBar");
    }

    // Close the Application Window
    close() {

        if (this.cClose) {
            this.element.remove();
            windows.object[this.index] = null;
        }
        else location.href = "../../index.html";
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

            this.element.style.left = "50%";
            this.element.style.top = "50%";
            this.element.style.transform = "translate(-50%, -50%)";

            this.element.style.height = "400px";
            this.element.style.width = "600px";

            this.element.style.borderTopLeftRadius = "5px";
            this.element.style.borderTopRightRadius = "5px";

        }
    }
}


// Handle Application Loading
function application(type) {

    let cClose;
    let cMove;
    let full;
    let appTitle;

    switch (type) {

        case "files": 

            app = new AppWindow(true, true, false);
            cClose = true;
            cMove = true;
            full = false;
        
            appTitle = "File Explorer";
        
            break;

        case "browser": 

            cClose = false;
            cMove = false;
            full = true;

            appTitle = "WiggleSearch";
        
        break;

        case "notepad":

            cClose = true;
            cMove = true;
            full = false;

            appTitle = "Notepad"

            break;
    }
    
    const application = new AppWindow(cClose, cMove, full)
    application.create();
    application.nameBox.innerHTML = appTitle;

    application.screenChange();

    windows.object.push(application);
    windows.index++;
}