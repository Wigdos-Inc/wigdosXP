/* Global Variables */

const taskbar = document.getElementsByTagName("footer")[0];
const desktop = document.getElementsByTagName("main")[0];


/* HTML Setup */

// Store Start Menu Button
const smBtnBox = document.getElementById("sm_btn");

// Quick Access Icon Functionality
document.getElementById("qa_icon1").onclick = () => application("notes");
document.getElementById("qa_icon2").onclick = () => application("files");

const tsBtn = document.getElementById("ts_btn");



/* Time Stuff */

const baseClock = setInterval(() => update("tbClock"), 1000);

function update(type) {

    // Store the Current Time
    const cDate = new Date;
    const cTime = {
        hours  : (cDate.getHours() < 10 ? "0" : "") + cDate.getHours(),
        minutes: (cDate.getMinutes() < 10 ? "0" : "") + cDate.getMinutes()
    }

    // Display the Current Time
    if (type == "tbClock") tsBtn.innerHTML = `${cTime.hours}:${cTime.minutes}`;
}
update("tbClock");


tsBtn.addEventListener("click", () => {

    // Expanded Time Stuff
});



/* Start Menu */
let smActive;
smBtnBox.addEventListener("click", (event) => {

    if (!smActive) {
        
        smActive = true;

        const startMenu = desktop.appendChild(document.createElement("div"));
        startMenu.id = "smBox";
        startMenu.style.opacity = 1;


        // Header
        const smHeader = startMenu.appendChild(document.createElement("div")); smHeader.id = "smHeader";

        const headerImg = smHeader.appendChild(document.createElement("img"));
        headerImg.src = "assets/images/icons/32x/creature.png";

        const headerText = smHeader.appendChild(document.createElement("p"));
        headerText.innerHTML = "<strong>Creature Name</strong>";


        // Main
        const smMain = startMenu.appendChild(document.createElement("div")); smMain.id = "smMain";

        const smLeftHalf = {
            element: smMain.appendChild(document.createElement("div")),
            images : 
            [
                "assets/images/icons/32x/wiggleSearch.png",
                "assets/images/icons/32x/wiglefari.png"
            ],
            titles : ["WiggleSearch", "Wiglefari"],
            actions:
            [
                () => application("browser"),
                () => application("browser")
            ]
        }
        smLeftHalf.element.classList.add("smHalf"); smLeftHalf.element.id = "smLeftHalf";
        for (let i=0; i < 2; i++) {

            const item = smLeftHalf.element.appendChild(document.createElement("div")); item.classList.add("smLeftItem");
            const itemImg = item.appendChild(document.createElement("img")); itemImg.classList.add("smItemImg");
            itemImg.src = smLeftHalf.images[i];
            
            const itemText = item.appendChild(document.createElement("p")); itemText.classList.add("smItmText");
            itemText.innerHTML = smLeftHalf.titles[i];

            item.onclick = smLeftHalf.actions[i];
        }

        
        const smRightHalf = {
            element: smMain.appendChild(document.createElement("div")),
            images : 
            [
                "assets/images/icons/32x/files.png",
                "assets/images/icons/32x/notepad.png"
            ],
            titles : ["File Explorer", "Notepad"],
            actions:
            [
                () => application("files"),
                () => application("notes")
            ]
        }
        smRightHalf.element.classList.add("smHalf"); smRightHalf.element.id = "smRightHalf";
        for (let i=0; i < 2; i++) {

            const item = smRightHalf.element.appendChild(document.createElement("div")); item.classList.add("smRightItem");
            const itemImg = item.appendChild(document.createElement("img")); itemImg.classList.add("smItemImg");
            itemImg.src = smRightHalf.images[i];
            
            const itemText = item.appendChild(document.createElement("p")); itemText.classList.add("smItmText");
            itemText.innerHTML = smRightHalf.titles[i];

            item.onclick = smRightHalf.actions[i];
        }


        // Footer
        const smFooter = startMenu.appendChild(document.createElement("div")); smFooter.id = "smFooter";

        smFooter.appendChild(document.createElement("div"));
        const smFooterRight = smFooter.appendChild(document.createElement("div")); smFooterRight.id = "smFooterRight";

        const restartBox = smFooterRight.appendChild(document.createElement("div")); restartBox.classList.add("powerOptionBox");
        const restartBtn = restartBox.appendChild(document.createElement("img")); restartBtn.id = "restartBtn";
        restartBtn.src = "assets/images/icons/32x/restart.png";
        const restartText = restartBox.appendChild(document.createElement("p"));
        restartText.innerHTML = "Restart"

        const powerBox = smFooterRight.appendChild(document.createElement("div")); powerBox.classList.add("powerOptionBox");
        const powerBtn = powerBox.appendChild(document.createElement("img")); powerBtn.id = "powerBtn";
        powerBtn.src = "assets/images/icons/32x/power.png";
        const powerText = powerBox.appendChild(document.createElement("p"));
        powerText.innerHTML = "Power Off"

        // Functions
        restartBtn.onclick = () => power.stage1(false);
        powerBtn.onclick = () => power.stage1(true);

    }
    else if (smActive && smBtnBox.contains(event.target)) {
        smActive = false;
        document.getElementById("smBox").remove();
    }
    else if (smActive && document.getElementById("restartBtn").contains(event.target)) power(false);
    else if (smActive && document.getElementById("powerBtn").contains(event.target)) power(true);
});

document.addEventListener("mousedown", (event) => {

    if (smActive && !document.getElementById("smBox").contains(event.target) && !smBtnBox.contains(event.target)) {

        smActive = false;
        document.getElementById("smBox").remove();

    }
});