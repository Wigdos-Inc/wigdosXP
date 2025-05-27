/* Startup */

window.onload = () => {

    if (sessionStorage.getItem("loaded")) load();
    else {

        // Create Power Button UI
        const powerOn = document.body.appendChild(document.createElement("div")); powerOn.classList.add("powerOn");
        const powerOnBtn = powerOn.appendChild(document.createElement("img")); powerOnBtn.classList.add("powerOptionBox"); powerOnBtn.id = "powerOnBtn";
        powerOnBtn.src = "assets/images/icons/32x/power.png";

        // Create background Creature
        const creature = powerOn.appendChild(document.createElement("img"));
        creature.src = "assets/images/icons/48x/creature.png";
        creature.style.position = "absolute";
        creature.style.width = "80%";
        creature.style.opacity = "0.05";
        creature.style.pointerEvents = "none";

        // Move on if User clicks Power Button
        powerOnBtn.onclick = () => {
            
            creature.remove();
            powerOn.remove();
            
            load();
        }

    }
    
}

/* Loading */

function load() {

    // If the User has loaded before
    if (!sessionStorage.getItem("loaded")) {

        const loader = document.body.appendChild(document.createElement("div")); loader.classList.add("loader");
        loader.style.visibility = "unset";


        // Stage 1 of Startup: Display Loading Screen
        setTimeout(() => { document.body.style.backgroundImage = "url(assets/images/background/desktop.jpg)"; }, 500);


        // Stage 2 of Startup: Log/Sign In
        setTimeout(() => {

            // Create Account Screen
            const accBox = document.body.appendChild(document.createElement("div")); accBox.classList.add("accBox");
            accScreen(accBox);

            const contentBox   = accBox.appendChild(document.createElement("div")); contentBox.id = "contentBox";
            const contentLeft  = contentBox.appendChild(document.createElement("div")); contentLeft.id = "contentLeft";
            const contentMid   = contentBox.appendChild(document.createElement("div")); contentMid.id = "contentMid";
            const contentRight = contentBox.appendChild(document.createElement("div")); contentRight.id = "contentRight";
            contentLeft.classList.add("accBox_content"); contentRight.classList.add("accBox_content");

            contentLeft.innerHTML = "<i><strong>welcome</strong></i>";
            fill(contentRight, "login");            

            // Remove Loader
            loader.remove();
        }, 3700);


        /*/ Stage 3 of Startup: Display Desktop
        setTimeout(() => {

            document.getElementsByTagName("main")[0].style.opacity = 1;
            document.getElementsByTagName("footer")[0].style.opacity = 1;

            audio.play();
            loader.classList.add("loader-hidden");

            loader.addEventListener("transitionend", () => loader.remove());
            //sessionStorage.setItem("loaded", true);
        }, 3700); */

    }
    else {

        document.body.style.backgroundImage = "url(assets/images/background/desktop.jpg)";
        document.getElementsByTagName("main")[0].style.opacity = 1;
        document.getElementsByTagName("footer")[0].style.opacity = 1;

    }
};




/* Shutdown */

let power = {
    type   : undefined,
    overlay: document.createElement("div"),
    accBox : document.createElement("div"),

    stage1 : function(off) {

        this.type = off;

        // Remove Start Menu
        smActive = false;
        if (document.getElementById("smBox")) document.getElementById("smBox").remove();

        // Remove User Agency
        document.body.style.pointerEvents = "none";
        
        // Prepare Overlay
        document.body.appendChild(this.overlay); 
        this.overlay.classList.add("overlay");

        // Cursor Change
        document.body.style.cursor = "wait";

        setTimeout(() => this.stage2(), 1000);
    },

    stage2: function() {

        // Remove Desktop Icons
        taskbar.style.position = "absolute";
        taskbar.style.bottom = 0;
        desktop.remove();

        // Shutdown Effects (1st Flash)
        this.overlay.style.backgroundColor = "#080c14";

        setTimeout(() => {

            // Shutdown Effects (2nd Flash)
            this.overlay.style.backgroundColor = "#466bc2";

            setTimeout(() => {

                // Make Overlay Transparent
                this.overlay.style.backgroundColor = "transparent";

                setTimeout(() => {

                    // Remove Taskbar
                    taskbar.remove();

                    setTimeout(() => this.stage3(), 1500);
                }, 500);
            }, 50);
        }, 50);
    },

    stage3: function() {

        // Shutdown Screen
        document.body.style.backgroundImage = "none";
        this.overlay.appendChild(this.accBox);
        this.accBox.classList.add("accBox");
        accScreen(this.accBox);

        const graphic = this.accBox.appendChild(document.createElement("img")); graphic.id = "sdGraphic";
        graphic.src = "assets/images/background/shutdownGraphic_noBG.png";


        // Shutdown Sound
        const shutDownSFX = new Audio("assets/sfx/Windows XP Shutdown Sound.mp3");
        shutDownSFX.play();

        shutDownSFX.onended = () => {

            // Remove Shutdown Screen
            this.accBox.remove();

            // Clear Session Data
            sessionStorage.clear();

            // Shutdown
            this.overlay.style.backgroundImage = "none";
            this.overlay.style.backgroundColor = "black";

            // Make the Cursor Invisible
            this.overlay.style.pointerEvents = "auto";
            this.overlay.style.cursor = "none"

            setTimeout(() => (!this.type ? location.reload() : window.close()), 2000);
        }
    }
}




/* Account Screen */

function accScreen(container) {

    // Create Background
    container.style.backgroundColor = "#466bc2";
    const topBar = container.appendChild(document.createElement("div")); topBar.classList.add("sdBar"); topBar.id = "sdTopBar";
    const topBorder = topBar.appendChild(document.createElement("div")); topBorder.id = "sdTopBorder";
    const bottomBar = container.appendChild(document.createElement("div")); bottomBar.classList.add("sdBar"); bottomBar.id = "sdBottomBar";
    const bottomBorder = bottomBar.appendChild(document.createElement("div")); bottomBorder.id = "sdBottomBorder";
    const lightSource = container.appendChild(document.createElement("div")); lightSource.id = "light";
}

function fill(parent, type) {

    // Remove former iteration if it exists
    if (document.getElementById("accBoxInner")) document.getElementById("accBoxInner").remove();

    // Remove 
    const accBoxInner = parent.appendChild(document.createElement("div")); accBoxInner.id = "accBoxInner";

    if (type == "login") {

        const form = accBoxInner.appendChild(document.createElement("form"));
        form.action = ""

        const login = {
            user: {
                label: document.createElement("label"),
                input: document.createElement("input")
            },
            pass: {
                label: document.createElement("label"),
                input: document.createElement("input")
            },
            btn : document.createElement("input"),
            output: document.createElement("p")
        }

        // Setup
        login.user.input.type = "text"; login.user.input.name = "username"; login.user.input.maxLength = 12; login.user.input.id = "username";
        login.user.label.for = "username"; login.user.label.innerHTML = "Username:";
        
        login.pass.input.type = "password"; login.pass.input.name = "password"; login.pass.input.maxLength = 15; login.pass.input.id = "password";
        login.pass.label.for = "password"; login.pass.label.innerHTML = "Password:";

        login.btn.type = "button"; login.btn.value = "Log In"; login.btn.onclick = () => logIn(login.user.input, login.pass.input);

        login.output.id = "accOutput";

        // Append Them
        form.appendChild(login.user.label);
        form.appendChild(document.createElement("br"));
        form.appendChild(login.user.input);

        form.appendChild(document.createElement("br"));
        form.appendChild(document.createElement("br"));

        form.appendChild(login.pass.label);
        form.appendChild(document.createElement("br"));
        form.appendChild(login.pass.input);

        form.appendChild(document.createElement("br"));
        form.appendChild(document.createElement("br"));

        form.appendChild(login.btn);

        form.appendChild(document.createElement("br"));
        form.appendChild(document.createElement("br"));

        form.appendChild(login.output);

    }
    else if (type == "signin") {}
    else {

        const boxInnerLeft = accBoxInner.appendChild(document.createElement("div")); boxInnerLeft.id = "boxInnerLeft";
        const boxInnerRight = accBoxInner.appendChild(document.createElement("div")); boxInnerRight.id = "boxInnerRight";

    }
}

function logIn(uField, pField) {

    // Store Input
    const input = {
        u: uField.value,
        p: pField.value
    }

    if (!input.u || !input.p) {

        document.getElementById("accOutput").innerHTML = "Please fill in all fields!";

    }
}

function signIn() {}