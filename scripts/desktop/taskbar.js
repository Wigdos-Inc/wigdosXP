// Import Applications
import { applications } from '../apps/applications/applications.js';

/* Global Variables */

const taskbar = document.getElementsByTagName("footer")[0];
const desktop = document.getElementsByTagName("main")[0];

// --- Taskbar App Buttons Container ---
let appButtonsWrapper = document.createElement('div');
appButtonsWrapper.id = 'taskbar-app-buttons-wrapper';
appButtonsWrapper.classList.add('taskbar-app-buttons-wrapper');

let appButtonsContainer = document.createElement('div');
appButtonsContainer.id = 'taskbar-app-buttons';
appButtonsContainer.classList.add('taskbar-app-buttons');
appButtonsWrapper.appendChild(appButtonsContainer);

// Add scroll arrows container (right side)
const arrowsContainer = document.createElement('div');
arrowsContainer.id = 'taskbar-arrows-container';
arrowsContainer.classList.add('taskbar-arrows-container');
arrowsContainer.style.display = 'none'; // Hidden by default

const upArrow = document.createElement('div');
upArrow.id = 'taskbar-scroll-up';
upArrow.classList.add('taskbar-scroll-arrow');
upArrow.innerHTML = '▲';
upArrow.onclick = () => scrollTaskbarRow(-1);

const downArrow = document.createElement('div');
downArrow.id = 'taskbar-scroll-down';
downArrow.classList.add('taskbar-scroll-arrow');
downArrow.innerHTML = '▼';
downArrow.onclick = () => scrollTaskbarRow(1);

arrowsContainer.appendChild(upArrow);
arrowsContainer.appendChild(downArrow);

// Insert wrapper and arrows before the clock
const clockBtn = document.getElementById("ts_btn");
if (clockBtn && clockBtn.parentNode === taskbar) {
    taskbar.insertBefore(appButtonsWrapper, clockBtn);
    taskbar.insertBefore(arrowsContainer, clockBtn);
} else {
    taskbar.appendChild(appButtonsWrapper);
    taskbar.appendChild(arrowsContainer);
}

// Track current visible row
let currentRow = 0;
let totalRows = 1;

// Calculate how many buttons fit per row and organize into rows
function organizeTaskbarRows() {
    const buttons = Array.from(appButtonsContainer.children);
    if (buttons.length === 0) {
        arrowsContainer.style.display = 'none';
        return;
    }

    // Get available width (wrapper width minus padding)
    const wrapperWidth = appButtonsWrapper.offsetWidth - 20; // Account for padding
    
    // Estimate button width (adjust based on your styling)
    const buttonWidth = 180; // Approximate width including margin/gap
    const buttonsPerRow = Math.max(1, Math.floor(wrapperWidth / buttonWidth));
    
    totalRows = Math.ceil(buttons.length / buttonsPerRow);
    
    // Show/hide arrows based on row count
    if (totalRows > 1) {
        arrowsContainer.style.display = 'flex';
    } else {
        arrowsContainer.style.display = 'none';
        currentRow = 0;
    }
    
    // Ensure current row is valid
    if (currentRow >= totalRows) {
        currentRow = totalRows - 1;
    }
    
    // Show/hide buttons based on current row
    buttons.forEach((btn, index) => {
        const btnRow = Math.floor(index / buttonsPerRow);
        if (btnRow === currentRow) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });
    
    // Update arrow states
    updateArrowStates();
}

// Navigate between rows
function scrollTaskbarRow(direction) {
    const newRow = currentRow + direction;
    
    // Bounds check
    if (newRow < 0 || newRow >= totalRows) {
        return; // Can't go beyond first or last row
    }
    
    currentRow = newRow;
    organizeTaskbarRows();
}

// Update arrow button states (disabled appearance when at limits)
function updateArrowStates() {
    if (currentRow === 0) {
        upArrow.classList.add('disabled');
    } else {
        upArrow.classList.remove('disabled');
    }
    
    if (currentRow === totalRows - 1) {
        downArrow.classList.add('disabled');
    } else {
        downArrow.classList.remove('disabled');
    }
}

// Helper to create an app button in the taskbar
function createAppTaskbarButton(appWindow) {
    const btn = document.createElement('div');
    btn.classList.add('taskbar-app-btn');
    btn.dataset.appIndex = appWindow.index;

    // App icon
    const icon = document.createElement('img');
    icon.src = appWindow.app.icon.s;
    icon.classList.add('taskbar-app-btn-icon');
    btn.appendChild(icon);

    // App name
    const name = document.createElement('span');
    name.innerText = appWindow.app.name.l;
    name.classList.add('taskbar-app-btn-name');
    btn.appendChild(name);

    // Focus/restore on click
    btn.onclick = () => {
        if (window.windowManager && window.windowManager.bringToFront) {
            window.windowManager.bringToFront(appWindow);
        }
        if (appWindow.minimized && appWindow.restore) {
            appWindow.restore();
        }
    };

    // Check if the window element has the 'focused' class from windowManager
    if (appWindow.element && appWindow.element.classList.contains('focused')) {
        btn.classList.add('focused');
    }

    appButtonsContainer.appendChild(btn);
    appWindow._taskbarBtn = btn;

    // Reorganize rows after adding button
    setTimeout(() => organizeTaskbarRows(), 50);
}

// Remove app button from taskbar
function removeAppTaskbarButton(appWindow) {
    if (appWindow._taskbarBtn && appWindow._taskbarBtn.parentNode) {
        appWindow._taskbarBtn.parentNode.removeChild(appWindow._taskbarBtn);
        appWindow._taskbarBtn = null;
    }

    // Reorganize rows after removing button
    setTimeout(() => organizeTaskbarRows(), 50);
}

// Update all app buttons (e.g. on focus change)
function updateAppTaskbarButtons() {
    if (!window.windows || !window.windows.object) return;
    window.windows.object.forEach(appWin => {
        if (appWin && appWin._taskbarBtn) {
            // Check if the window element has the 'focused' class from windowManager
            const isFocused = appWin.element && appWin.element.classList.contains('focused');
            if (isFocused) {
                appWin._taskbarBtn.classList.add('focused');
            } else {
                appWin._taskbarBtn.classList.remove('focused');
            }
        }
    });
}

// Recalculate on window resize
window.addEventListener('resize', () => {
    organizeTaskbarRows();
});

// Make functions globally accessible so AppWindow can call them
window.taskbarFunctions = {
    createButton: createAppTaskbarButton,
    removeButton: removeAppTaskbarButton,
    updateButtons: updateAppTaskbarButtons
};

console.log('[Taskbar] Functions ready and exported globally');


/* HTML Setup */

// Store Start Menu Button
const smBtnBox = document.getElementById("sm_btn");


// Quick Access Icon Functionality
document.getElementById("qa_icon1").onclick = () => startApp(applications.notes);
document.getElementById("qa_icon2").onclick = () => startApp(applications.files);

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
        headerImg.src = "assets/images/icons/user/guest.png";

        const headerText = smHeader.appendChild(document.createElement("p"));
        headerText.innerHTML = `<strong>${getUser()}</strong>`;

        // Search Bar
        const searchContainer = startMenu.appendChild(document.createElement("div"));
        searchContainer.id = "smSearchContainer";
        searchContainer.style.cssText = `
            padding: 6px 12px;
            background: linear-gradient(180deg, #fff 0%, #f0f0f0 100%);
            border-bottom: 2px solid #0055aa;
            position: relative;
        `;

        const searchInput = searchContainer.appendChild(document.createElement("input"));
        searchInput.type = "text";
        searchInput.id = "smSearchInput";
        searchInput.placeholder = "Search programs...";
        searchInput.style.cssText = `
            width: 100%;
            padding: 4px 8px;
            border: 2px inset #ddd;
            font-family: 'Tahoma', sans-serif;
            font-size: 11px;
            box-sizing: border-box;
            background: white;
        `;

        // Search results dropdown - append to search container instead
        const searchResults = searchContainer.appendChild(document.createElement("div"));
        searchResults.id = "smSearchResults";
        searchResults.style.cssText = `
            display: none;
            max-height: 120px;
            overflow-y: auto;
            background: white;
            border: 2px solid #0055aa;
            border-top: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 10000;
            box-shadow: 2px 2px 4px rgba(255, 255, 255, 1);
        `;

        // Search functionality
        const searchableApps = [
            { name: "WiggleSearch", displayName: "WiggleSearch", app: applications.rBrowser, keywords: ["wigglesearch", "search", "browser", "wiggle"] },
            { name: "Wiglefari", displayName: "Wiglefari", app: applications.fBrowser, keywords: ["wiglefari", "browser", "safari"] },
            { name: "File Explorer", displayName: "File Explorer", app: applications.files, keywords: ["file", "explorer", "files"] },
            { name: "GameSpot", displayName: "GameSpot", app: applications.gspot, keywords: ["gamespot", "games"] },
            { name: "Recycling Bin", displayName: "Recycling Bin", app: applications.bin, keywords: ["bin", "recycle", "trash"] },
            { name: "Singular Upgrading", displayName: "Singular Upgrading", app: applications.su, keywords: ["su", "singular", "upgrading"] },
        ];

        searchInput.addEventListener("input", function() {
            const query = this.value.toLowerCase().trim();
            
            if (query.length === 0) {
                searchResults.style.display = "none";
                searchResults.innerHTML = "";
                return;
            }

            const matches = searchableApps.filter(appItem => {
                return appItem.name.toLowerCase().includes(query) ||
                       appItem.displayName.toLowerCase().includes(query) ||
                       appItem.keywords.some(keyword => keyword.includes(query));
            });

            if (matches.length === 0) {
                searchResults.style.display = "none";
                searchResults.innerHTML = "";
                return;
            }

            searchResults.innerHTML = "";
            searchResults.style.display = "block";

            matches.forEach(match => {
                const resultItem = searchResults.appendChild(document.createElement("div"));
                resultItem.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    color: white;
                `;

                if (match.app) {
                    const icon = resultItem.appendChild(document.createElement("img"));
                    icon.src = match.app.icon.s;
                    icon.style.cssText = "width: 16px; height: 16px;";
                }

                const text = resultItem.appendChild(document.createElement("span"));
                text.textContent = match.displayName;
                text.style.cssText = "font-size: 12px; font-family: 'Tahoma', sans-serif; color: inherit;";

                resultItem.addEventListener("mouseenter", function() {
                    this.style.background = "#0055aa";
                    this.style.color = "white";
                });

                resultItem.addEventListener("mouseleave", function() {
                    this.style.background = "white";
                    this.style.color = "white";
                });

                resultItem.addEventListener("click", function() {
                    if (match.app) {
                        startApp(match.app);
                        smActive = false;
                        document.getElementById("smBox").remove();
                    } else {
                        alert(`${match.displayName} is coming soon!`);
                    }
                });
            });
        });

        // Clear search when clicking outside
        searchInput.addEventListener("blur", function() {
            setTimeout(() => {
                searchResults.style.display = "none";
            }, 200);
        });


        // Main
        const smMain = startMenu.appendChild(document.createElement("div")); smMain.id = "smMain";

        const smLeftHalf = {
            element: smMain.appendChild(document.createElement("div")),
            images : 
            [
                "assets/images/icons/32x/rBrowser.png",
                "assets/images/icons/32x/fBrowser.png"
            ],
            titles : ["WiggleSearch", "Wiglefari"],
            actions:
            [
                () => startApp(applications.rBrowser),
                () => startApp(applications.fBrowser)
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
                "assets/images/icons/32x/notes.png"
            ],
            titles : ["File Explorer", "Notepad"],
            actions:
            [
                () => startApp(applications.notes),
                () => startApp(applications.files)
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