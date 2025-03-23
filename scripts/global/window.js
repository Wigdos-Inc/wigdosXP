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
        this.nameBox = undefined
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

        const closeBtn = selectBox.appendChild(document.createElement("div"));
        closeBtn.classList.add("appClose");
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
}


// Handle Application Loading
function application(type) {

    switch (type) {

        case "files": 
        
            const files = new AppWindow();
            files.cClose = true;
            files.create();

            files.nameBox.innerHTML = "File Explorer";

            windows.object.push(files);
            
            break;
    }

    windows.index++;
}