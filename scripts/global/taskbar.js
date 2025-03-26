/* Global Variables */

const taskbar = document.getElementsByTagName("footer")[0];
const desktop = document.getElementsByTagName("main")[0];



/* Icons */

document.getElementById("tbIcon1").onclick = () => application("notepad");
document.getElementById("tbIcon2").onclick = () => application("files");



/* Time Stuff */

const timeBox = document.getElementById("tbTimeBox");
const baseClock = setInterval(() => update("tbClock"), 1000);

function update(type) {

    // Store the Current Time
    const cDate = new Date;
    const cTime = {
        hours  : (cDate.getHours() < 10 ? "0" : "") + cDate.getHours(),
        minutes: (cDate.getMinutes() < 10 ? "0" : "") + cDate.getMinutes()
    }

    // Display the Current Time
    if (type == "tbClock") timeBox.innerHTML = `${cTime.hours}:${cTime.minutes}`;
}
update("tbClock");


timeBox.addEventListener("click", () => {

    // Expanded Time Stuff
});



/* Start Menu */
let smActive;
document.getElementById("smButton").addEventListener("click", (event) => {

    if (!smActive) {
        
        smActive = true;

        const startMenu = document.getElementsByTagName("main")[0].appendChild(document.createElement("div"));
        startMenu.id = "smBox";
        startMenu.style.opacity = 1;


        // Header
        const smHeader = startMenu.appendChild(document.createElement("div")); smHeader.id = "smHeader";

        const headerImg = smHeader.appendChild(document.createElement("img"));
        headerImg.src = "../../assets/images/icons/32x/creature.png";

        const headerText = smHeader.appendChild(document.createElement("p"));
        headerText.innerHTML = "<strong>Creature Name</strong>";


        // Main
        const smMain = startMenu.appendChild(document.createElement("div")); smMain.id = "smMain";


        // Footer
        const smFooter = startMenu.appendChild(document.createElement("div")); smFooter.id = "smFooter";

        smFooter.appendChild(document.createElement("div"));
        const smFooterRight = smFooter.appendChild(document.createElement("div")); smFooterRight.id = "smFooterRight";

        const restartBox = smFooterRight.appendChild(document.createElement("div")); restartBox.classList.add("powerOptionBox");
        const restartBtn = restartBox.appendChild(document.createElement("img")); restartBtn.id = "restartBtn";
        restartBtn.src = "../../assets/images/icons/32x/restart.png";
        const restartText = restartBox.appendChild(document.createElement("p"));
        restartText.innerHTML = "Restart"

        const powerBox = smFooterRight.appendChild(document.createElement("div")); powerBox.classList.add("powerOptionBox");
        const powerBtn = powerBox.appendChild(document.createElement("img")); powerBtn.id = "powerBtn";
        powerBtn.src = "../../assets/images/icons/32x/power.png";
        const powerText = powerBox.appendChild(document.createElement("p"));
        powerText.innerHTML = "Power Off"

        // Functions
        restartBtn.onclick = () => power.stage1(false);
        powerBtn.onclick = () => power.stage1(true);

    }
    else if (smActive && document.getElementById("smButton").contains(event.target)) {
        smActive = false;
        document.getElementById("smBox").remove();
    }
    else if (smActive && document.getElementById("restartBtn").contains(event.target)) power(false);
    else if (smActive && document.getElementById("powerBtn").contains(event.target)) power(true);
});

document.addEventListener("mousedown", (event) => {

    if (smActive && !document.getElementById("smBox").contains(event.target) && !document.getElementById("smButton").contains(event.target)) {

        smActive = false;
        document.getElementById("smBox").remove();

    }
});



/* Power Options */
let power = {
    type   : undefined,
    overlay: document.createElement("div"),

    stage1 : function(off) {

        // Redirect to Desktop for Shutdown
        if (!document.title.includes("Desktop")) {

            sessionStorage.setItem("shutdown", off);
            index();

            return;

        }

        this.type = sessionStorage.getItem("shutdown") ? sessionStorage.getItem("shutdown") : off;

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
        document.getElementsByTagName("main")[0].remove();

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
        
        const topBar = this.overlay.appendChild(document.createElement("div")); topBar.classList.add("sdBar"); topBar.id = "sdTopBar";
        const topBorder = topBar.appendChild(document.createElement("div")); topBorder.id = "sdTopBorder";
        const bottomBar = this.overlay.appendChild(document.createElement("div")); bottomBar.classList.add("sdBar"); bottomBar.id = "sdBottomBar";
        const bottomBorder = bottomBar.appendChild(document.createElement("div")); bottomBorder.id = "sdBottomBorder";


        // Shutdown Sound
        const shutDownSFX = new Audio("../../assets/sfx/Windows XP Shutdown Sound.mp3");
        shutDownSFX.play();

        shutDownSFX.onended = () => {

            // Remove Shutdown Screen
            topBar.remove();
            topBorder.remove();
            bottomBar.remove();
            bottomBorder.remove();

            // Clear Session Data
            sessionStorage.clear();

            // Shutdown
            this.overlay.style.backgroundImage = "none";
            this.overlay.style.backgroundColor = "black";

            // Make the Cursor Invisible
            this.overlay.style.pointerEvents = "auto";
            this.overlay.style.cursor = "none"

            setTimeout(() => (this.type === "true" ? window.close() : index()), 2000);
        }
    }
}

if (sessionStorage.getItem("shutdown")) power.stage1(sessionStorage.getItem("shutdown"));


/* Wayyyy too funny
const shutDownSFX = new Audio("../../assets/sfx/Windows XP Shutdown Sound.mp3");
shutDownSFX.play();

shutDownSFX.onended = () => {

playerrorSound();
}
*/