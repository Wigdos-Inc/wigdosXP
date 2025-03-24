let windows = {
    index : 0,
    object: []
}

class AppWindow {

    constructor() {

        this.element = document.getElementsByTagName("main")[0].appendChild(document.createElement("div"));
        this.focus   = false;
        this.cClose  = undefined;
        this.index   = windows.index;
        this.nameBox = undefined;
        this.cMove   = undefined;
        this.full    = false;
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


        const screenBtn = selectBox.appendChild(document.createElement("div"));
        screenBtn.classList.add("appScreen", "selectBtns");
        screenBtn.innerHTML = "<strong>W</strong>";

        screenBtn.onclick = () => {
            
            this.full = !this.full;
            this.screenChange();
        }


        const closeBtn = selectBox.appendChild(document.createElement("div"));
        closeBtn.classList.add("appClose", "selectBtns");
        closeBtn.innerHTML = "<strong>X</strong>";

        closeBtn.onclick = () => this.close();



        // App Window Main
        const appMain = this.element.appendChild(document.createElement("div"));
        appMain.classList.add("appMain");


        // Top Bar (Content Depends on Application)
        const topBar = appMain.appendChild(document.createElement("div"));
        topBar.classList.add("appMainTopBar");


        // Mid Bar (Content Depends on Application)
        const midBar = appMain.appendChild(document.createElement("div"));
        midBar.classList.add("appMainMidBar");


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

            this.element.style.height = "100%";
            this.element.style.width = "100%";

        } else {

            this.element.style.left = "50%";
            this.element.style.top = "50%";
            this.element.style.transform = 

            this.element.style.height = "400px";
            this.element.style.width = "600px";

        }
    }
}


// Handle Application Loading
function application(type) {

    const application = new AppWindow();
    let appTitle;

    switch (type) {

        case "files": 
        
            application.cClose = true;
            application.cMove = true;
            application.full = false;

            appTitle = "File Explorer";
            
            break;
    }
    
    application.create();
    application.nameBox.innerHTML = appTitle;

    application.screenChange();

    windows.object.push(application);
    windows.index++;
}