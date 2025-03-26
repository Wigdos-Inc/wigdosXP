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
        restartBtn.onclick = () => power(false);
        powerBtn.onclick = () => power(true);

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
function power(off) {

    if (!document.title.includes("Desktop")) {
        sessionStorage.setItem("shutdown", off);
        location.href
    }

    // Remove Start Menu
    smActive = false;
    document.getElementById("smBox").remove();

    // Remove User Agency
    document.body.style.pointerEvents = "none";

    // Prepare Overlay
    const overlay = document.body.appendChild(document.createElement("div"));
    overlay.style.width = "100vw"; overlay.style.width = "100vh";


    // Stage 2 (Flash & Remove UI)
    setTimeout(() => {

        document.getElementsByTagName("main")[0].remove();
    }, 500);

}

if (sessionStorage.getItem("shutdown")) power(sessionStorage.getItem("shutdown"));