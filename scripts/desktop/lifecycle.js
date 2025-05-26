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

        const loader1 = document.body.appendChild(document.createElement("div")); loader1.classList.add("loader1");
        loader1.style.visibility = "unset";


        // Stage 1 of Startup: Display Loading Screen
        setTimeout(() => { document.body.style.backgroundImage = "url(assets/images/background/desktop.jpg)"; }, 500);


        // Stage 2 of Startup: Log/Sign In
        setTimeout(() => {

            // Create Pre-Start Account Screen

            loader1.remove();
        }, 3700);


        // Stage 3 of Startup: Display Desktop
        setTimeout(() => {

            document.getElementsByTagName("main")[0].style.opacity = 1;
            document.getElementsByTagName("footer")[0].style.opacity = 1;

            audio.play();
            loader1.classList.add("loader1-hidden");

            loader1.addEventListener("transitionend", () => loader1.remove());
            sessionStorage.setItem("loaded", true);
        }, 3700); 

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

    stage1 : function(off) {

        this.type = off;

        // Remove Start Menu
        smActive = false;
        if (document.getElementById("smBox")) document.getElementById("smBox").remove();

        // Remove User Agency
        document.body.style.pointerEvents = "none";
        
        // Prepare Overlay
        document.body.appendChild(this.overlay);
        this.overlay.style.width = "100vw"; this.overlay.style.height = "100vh";
        this.overlay.style.position = "absolute"; this.overlay.style.top = 0; this.overlay.style.left = 0;

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
        this.overlay.style.backgroundImage = "linear-gradient(to right, #739be4, #5480da, #5480da)";

        const graphic = this.overlay.appendChild(document.createElement("img")); graphic.id = "sdGraphic";
        graphic.src = "assets/images/background/shutdownGraphic.png";
        
        const topBar = this.overlay.appendChild(document.createElement("div")); topBar.classList.add("sdBar"); topBar.id = "sdTopBar";
        const topBorder = topBar.appendChild(document.createElement("div")); topBorder.id = "sdTopBorder";
        const bottomBar = this.overlay.appendChild(document.createElement("div")); bottomBar.classList.add("sdBar"); bottomBar.id = "sdBottomBar";
        const bottomBorder = bottomBar.appendChild(document.createElement("div")); bottomBorder.id = "sdBottomBorder";


        // Shutdown Sound
        const shutDownSFX = new Audio("assets/sfx/Windows XP Shutdown Sound.mp3");
        shutDownSFX.play();

        shutDownSFX.onended = () => {

            // Remove Shutdown Screen
            topBar.remove();
            topBorder.remove();
            bottomBar.remove();
            bottomBorder.remove();
            graphic.remove();

            // Clear Session Data
            sessionStorage.clear();

            // Shutdown
            this.overlay.style.backgroundImage = "none";
            this.overlay.style.backgroundColor = "black";

            // Make the Cursor Invisible
            this.overlay.style.pointerEvents = "auto";
            this.overlay.style.cursor = "none"

            setTimeout(() => (!this.type ? index() : window.close()), 2000);
        }
    }
}




/* Account Screen */

function accScreen(overlay) {

    
}