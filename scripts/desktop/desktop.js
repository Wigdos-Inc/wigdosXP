/* CLASSES */

// Create the Grid Boxes and Store Them
let dkGridArray = [];
window.dkGridArray = dkGridArray; // Expose globally for drag/drop
class DKGridBox {

    constructor(element, row, col) {
        this.element = element;
        this.filled  = false;
        this.select  = {
            active: false,
            count : 0,
            change: false,
            old   : undefined
        }

        this.pos = {
            row: row,
            col: col
        }

        this.app     = undefined;
        this.content = {
            img : undefined,
            text: undefined
        }
    }

    // Attach Application to the Box
    attach(content) {

        this.filled = true;
        this.element.classList.add("filled");

        this.app = content;
        
        // Display Desktop Icon
        this.content.img = this.element.appendChild(document.createElement("img"));
        this.content.img.src = this.app.icon.l;

        // Display Title
        this.content.text = this.element.appendChild(document.createElement("p"));
        this.content.text.innerHTML = this.app.name.d;

        // Desktop icons use ONLY custom mouse drag system, NOT HTML5 drag
        // (HTML5 drag is only used for Start Menu items)

        // Update Layout
        if (localStorage.getItem("layout") && getUser() != "guest") {

            let layout = JSON.parse(localStorage.getItem("layout"));
            if (!layout.desktopGrid) {
                // Migrate old format to new format
                layout = { desktopGrid: layout, taskbarPinned: layout.taskbarPinned || ['notes', 'files'], initialized: true };
            }
            layout.desktopGrid[this.pos.row][this.pos.col] = this.app.name.s;
            localStorage.setItem("layout", JSON.stringify(layout));
            desktopFill("update");

        }
    }
    
    detach() {

        this.filled = false;
        this.element.classList.remove("filled");
        this.element.classList.remove("activeBox");

        this.app = undefined;

        // Remove Icon Element
        this.content.img.remove();
        this.content.img = undefined;

        // Remove Text Element
        this.content.text.remove();
        this.content.text = undefined;

        // Clear selection state
        if (this.select) {
            this.select.active = false;
            this.select.count = 0;
            this.select.change = false;
        }

        // Update Layout
        if (localStorage.getItem("layout") && getUser() != "guest") {

            let layout = JSON.parse(localStorage.getItem("layout"));
            if (!layout.desktopGrid) {
                // Migrate old format to new format
                layout = { desktopGrid: layout, taskbarPinned: layout.taskbarPinned || ['notes', 'files'], initialized: true };
            }
            layout.desktopGrid[this.pos.row][this.pos.col] = null;
            localStorage.setItem("layout", JSON.stringify(layout));
            desktopFill("update");

        }
    }

    change(type) {

        if (type && !this.select.change && this.select.count > 1) {

            this.select.change = true;

            // Store Previous Name
            this.select.old = this.content.text.innerHTML;
            this.content.text.remove();

            // Create Input Field for Renaming
            let input = this.element.appendChild(document.createElement("input"));
            input.type = "text";
            input.id = "input";
            input.value = this.select.old;
            input.focus();
            input.select();

            // Renaming Finalizes when pressing Enter
            input.addEventListener("keydown", (event) => {
                
                if (event.key === "Enter") this.change(false);
            });

        }
        else if (!type) {

            let input = document.getElementById("input");
            this.app.dName = (input.value == "") ? this.select.old : input.value;

            input.remove();
            this.select.change = false;
            this.select.old = undefined;
            this.select.count = 0;

            // Display Title
            this.content.text = this.element.appendChild(document.createElement("p"));
            this.content.text.innerHTML = this.app.dName;

        }
    }
}





/* STARTUP CODE */

// Create Grid Boxes
for (let r=0; r < 7; r++) {

    // Make/Empty RowArray
    let rowArray = [];

    for (let c=0; c < 11; c++) {

        // Create Grid Box
        let box = document.getElementsByTagName("main")[0].appendChild(document.createElement("div"));
        box.classList.add("dk-grid-box");
        box.id = `${r}-${c}`;

        // Push to Row
        rowArray.push(new DKGridBox(box, r, c));
    }

    // Push Complete Row to dkGridArray
    dkGridArray.push(rowArray);
}

// Update global reference after array is populated
window.dkGridArray = dkGridArray;


// Attach Apps to Desktop
function desktopFill(type, layout) {

    switch (type) {

        case "base":

            let grid = {
                cr: 0,
                cc: 0,
                tr: dkGridArray.length,
                tc: dkGridArray[0].length
            }

            // Prepare Layout - NEW STRUCTURE
            let desktopGrid = [];
            for (let i=0; i < dkGridArray.length; i++) desktopGrid.push([]);

            for (const appKey in applications) {

                if (grid.cr < grid.tr) {
                    desktopGrid[grid.cr][grid.cc] = applications[appKey].name.s; // Store Apps in Layout
                    dkGridArray[grid.cr][grid.cc].attach(applications[appKey]); // Attach App to Desktop
                }

                // Attach App to Desktop
                dkGridArray[grid.cr][grid.cc]

                // Desktop Grid Iteration
                grid.cc++;
                if (grid.cc == grid.tc) {
                    grid.cc = 0;
                    grid.cr++;
                }
            }

            // Save with new structure
            layout = {
                desktopGrid: desktopGrid,
                taskbarPinned: ['notes', 'files'],
                initialized: true
            };
            localStorage.setItem("layout", JSON.stringify(layout));
            // Return the layout object (not a JSON string) so callers can work with object form
            return layout;

        case "load":

            if (layout) {

                // Handle old format migration
                let layoutObj = layout;
                if (Array.isArray(layout)) {
                    // Old format - migrate
                    layoutObj = {
                        desktopGrid: layout,
                        taskbarPinned: ['notes', 'files'],
                        initialized: true
                    };
                }

                // Ensure structure exists
                if (!layoutObj.desktopGrid) {
                    layoutObj.desktopGrid = [];
                    for (let i=0; i < dkGridArray.length; i++) layoutObj.desktopGrid.push([]);
                }
                if (!layoutObj.taskbarPinned) {
                    layoutObj.taskbarPinned = ['notes', 'files'];
                }

                const grid = layoutObj.desktopGrid;

                // Only add new apps if NOT initialized (first time setup)
                if (!layoutObj.initialized) {
                    // Prepare new App Storage
                    let newApps = {
                        i: 0,
                        a: [],

                        gimme: function() {
                            return this.a[this.i];
                        }
                    }

                    // Check if Layout is missing any Apps
                    for (let appKey in applications) {
                        const app = applications[appKey];
                        let included = false;

                        grid.forEach(row => {
                            if (row.includes(app.name.s)) included = true;
                        });

                        if (!included) newApps.a.push(app.name.s);
                    }

                    // Attach Apps to Desktop
                    for (let row=0; row < dkGridArray.length; row++) {

                        for (let col=0; col < dkGridArray[row].length; col++) {

                            const appID = grid[row][col];
                            if (appID) {
                                // Support both application map keys and stored app.name.s strings
                                const appObj = applications[appID] || Object.values(applications).find(a => a && a.name && a.name.s === appID);
                                if (appObj) dkGridArray[row][col].attach(appObj);
                            }
                            else if (newApps.i < newApps.a.length) {

                                // Attach New App
                                dkGridArray[row][col].attach(applications[newApps.gimme()]);
                                newApps.i++;
                                grid[row][col] = newApps.gimme();

                            }
                        }
                    }

                    // Mark as initialized so defaults won't be re-added
                    layoutObj.initialized = true;

                    // Save Layout
                    localStorage.setItem("layout", JSON.stringify(layoutObj));
                    if (newApps.i) desktopFill("update");
                } else {
                    // Already initialized - just load what's saved (even if empty)
                    for (let row=0; row < dkGridArray.length; row++) {
                        for (let col=0; col < dkGridArray[row].length; col++) {
                            const appID = grid[row] && grid[row][col];
                            if (appID) {
                                const appObj = applications[appID] || Object.values(applications).find(a => a && a.name && a.name.s === appID);
                                if (appObj) dkGridArray[row][col].attach(appObj);
                            }
                        }
                    }
                }

            }
            else desktopFill("base");

            break;

        case "update":
            // Layout was updated locally — do NOT push to DB here.
            // Saving to Firestore happens only on autosave interval and on
            // explicit power/logoff actions to avoid excessive writes.
            try {
                window.layoutDirty = true;
            } catch (e) { /* noop */ }
            break;
    }
}

// Expose desktopFill globally for lifecycle.js and other modules
window.desktopFill = desktopFill;

// Helper to save layout to Firestore, returns a Promise
async function saveLayoutToDB() {
    try {
        if (!localStorage.getItem("layout") || !(window.getUser && window.getUser() != "guest")) {
            // Nothing to save or guest user
            return;
        }

        if (!window.firebaseAPI) {
            console.warn('[Desktop] saveLayoutToDB: firebaseAPI not available');
            return;
        }

        const { db, setDoc, doc } = window.firebaseAPI;
        await setDoc(
            doc(db, "users", getUser()),
            { layout: localStorage.getItem("layout") },
            { merge: true }
        );
        console.debug('[Desktop] Layout saved to DB');
        try { window.layoutDirty = false; } catch (e) { /* noop */ }
    } catch (error) {
        console.error('[Desktop] saveLayoutToDB error:', error);
    }
}

window.saveLayoutToDB = saveLayoutToDB;

// Function to add an app to the desktop
function addAppToDesktop(app) {
    // Find an empty spot
    for (let r = 0; r < dkGridArray.length; r++) {
        for (let c = 0; c < dkGridArray[r].length; c++) {
            if (!dkGridArray[r][c].filled) {
                dkGridArray[r][c].attach(app);
                
                // Update layout
                if (localStorage.getItem("layout") && getUser() != "guest") {
                    let layout = JSON.parse(localStorage.getItem("layout"));
                    if (!layout.desktopGrid) {
                        layout = { desktopGrid: layout, taskbarPinned: layout.taskbarPinned || ['notes', 'files'], initialized: true };
                    }
                    layout.desktopGrid[r][c] = app.name.s;
                    localStorage.setItem("layout", JSON.stringify(layout));
                    desktopFill("update");
                }
                return true;
            }
        }
    }
    return false; // No empty spot
}

window.addAppToDesktop = addAppToDesktop;





/* EVENT LISTENERS */

// Box x User Interaction
// Use a global userBox so taskbar/startmenu can interact with desktop drag logic
window.userBox = undefined;
let prevClick = {};
let prevBox;
let hoveredBox = null; // Track currently hovered box for Enter key

let selection = {
    box  : null,
    start: { x: 0, y: 0 }
}

function select(box) {

    box.select.active = true;
    box.element.classList.add("activeBox");
    box.select.count++;
}
function deselect(box) {

    if (!box.select.active) box.select.count = 0;
    box.select.active = false;
    box.element.classList.remove("activeBox");
}
function deselectAll(unChange) {

    // Deselect Previous(/all) Box(es)
    dkGridArray.forEach(r => r.forEach(b => {

        deselect(b);

        if (unChange && b.select.change) {
            b.change(false);
            b.select.count = 0;
        }
    }));
}

dkGridArray.forEach(row => row.forEach(box => {

    // Track hover state for Enter key functionality
    box.element.addEventListener("mouseenter", () => {
        if (box.filled) {
            hoveredBox = box;
        }
    });

    box.element.addEventListener("mouseleave", () => {
        if (hoveredBox === box) {
            hoveredBox = null;
        }
    });

    box.element.addEventListener("mousedown", (event) => {

        // Reset all Boxes
        deselectAll((event.target.tagName !== "INPUT") ? true : false);

        if (box.filled) {

            // Select the new Box
            select(box);
            window.userBox = box;

        }
        else if (event.button === 0) {

            // User Selection Box
            selection.start = { x: event.clientX, y: event.clientY };

            // Create the selection box element
            selection.box = document.body.appendChild(document.createElement('div'));
            selection.box.style.position = 'absolute';
            selection.box.style.border = '1px dashed #000';
            selection.box.style.backgroundColor = 'rgba(0, 0, 255, 0.2)';

        }
    });

    // Move an Entry to a different Box
    box.element.addEventListener("mouseup", () => {

        if (window.userBox !== undefined && window.userBox != box && !box.filled) {

            box.attach(window.userBox.app);
            if (window.userBox && typeof window.userBox.detach === 'function') window.userBox.detach();
            window.userBox = undefined;

            deselectAll(true);
            select(box);

        }
    });


    // Allow Renaming and Activation
    box.element.addEventListener("click", (event) => {

        if (event.target.tagName == "P") box.change(true);

        // Double Click Logic (AI)
        if (box.filled) {

            const cTime = Date.now();
            const pTime = prevClick[box.id];
            
            if (pTime && (cTime - pTime) < 500 && event.target !== box.content.text && event.target === prevBox) startApp(box.app);
        
            // Update the last click time
            prevClick[box.id] = cTime;
            prevBox = event.target;
            
        }
    });
}));

// Track Mouse Movement for Selection Box
document.addEventListener("mousemove", (event) => {

    if (selection.box) {

        // Update the Size and Position of the Selection Box
        const width = event.clientX - selection.start.x;
        let height = event.clientY - selection.start.y;


        // Stop the Selection Box from Intersecting the Footer
        const footerBorders = document.getElementsByTagName('footer')[0].getBoundingClientRect();
        const maxY = footerBorders.top;

        if (selection.start.y + height > maxY) {
            height = maxY - selection.start.y;
        }


        // Draw Selection Box
        selection.box.style.left = `${Math.min(event.clientX, selection.start.x)}px`;
        selection.box.style.top = `${Math.min(event.clientY, selection.start.y)}px`;
        selection.box.style.width = `${Math.abs(width)}px`;
        selection.box.style.height = `${Math.abs(height)}px`;


        // Select Highlighted Boxes (AI)
        dkGridArray.forEach(row => row.forEach(box => {

            const boxBorders = box.element.getBoundingClientRect();

            const centerX = (boxBorders.left + boxBorders.right) / 2;
            const centerY = (boxBorders.top + boxBorders.bottom) / 2;

            // Detection for if Box Center is in User Selection
            if (
                centerX >= Math.min(event.clientX, selection.start.x) &&
                centerX <= Math.max(event.clientX, selection.start.x) &&
                centerY >= Math.min(event.clientY, selection.start.y) &&
                centerY <= Math.max(event.clientY, selection.start.y) &&
                box.filled
            ) {
                select(box);
            }
            else deselect(box);
        }));

    }
});

// Remove selection box on mouseup
document.addEventListener("mouseup", () => {

    if (selection.box) {
        selection.box.remove();
        selection.box = null;
    }
})

// Detach Box from User and handle drop zones
document.addEventListener("mouseup", (event) => {
    // Check if dragging from desktop (userBox.filled) or Start Menu/Taskbar (userBox.app with source)
    const isDragging = window.userBox && (window.userBox.filled || (window.userBox.app && (window.userBox.source === 'startMenu' || window.userBox.source === 'taskbarPinned')));
    if (isDragging) console.debug('[Desktop] mousemove isDragging:', (window.userBox && window.userBox.source) || 'unknown', 'app:', (window.userBox && window.userBox.app && window.userBox.app.name && window.userBox.app.name.s) || 'unknown');
    const app = window.userBox && (window.userBox.app || (window.userBox.filled ? window.userBox.app : null));
    if (isDragging) console.debug('[Desktop] mouseup isDragging, app:', (app && app.name && app.name.s) ? app.name.s : app && app.name || 'unknown', 'coords:', event.clientX, event.clientY);
    
    if (isDragging && app) {
        // Check if dropping on Start Menu (if open) first
        const startMenu = document.getElementById('smBox');
        if (startMenu) {
            const smRect = startMenu.getBoundingClientRect();
            if (event.clientX >= smRect.left && event.clientX <= smRect.right &&
                event.clientY >= smRect.top && event.clientY <= smRect.bottom) {
                // Pin to Start Menu
                console.debug(`[Desktop] Pinning ${app.name.d} to Start Menu`);
                if (window.setStartMenuPinned && window.getStartMenuPinned) {
                    const pinned = window.getStartMenuPinned();
                    if (!pinned.includes(app.name.s)) {
                        pinned.push(app.name.s);
                        window.setStartMenuPinned(pinned);
                        console.debug(`[Desktop] Successfully pinned ${app.name.d} to Start Menu`);
                    }
                }
                window.userBox = undefined;
                if (dropIndicator) {
                    dropIndicator.remove();
                    dropIndicator = null;
                }
                if (desktopDragPreview) {
                    desktopDragPreview.remove();
                    desktopDragPreview = null;
                }
                return; // Don't add to desktop if dropping on Start Menu
            }
        }

        // Check if dropping anywhere on the taskbar (footer), excluding Start Menu Button
        const taskbarEl = document.getElementsByTagName('footer')[0];
        const smBtnEl = document.getElementById('sm_btn');
        if (taskbarEl) {
            const taskbarRect = taskbarEl.getBoundingClientRect();
            const overFooter = event.clientX >= taskbarRect.left && event.clientX <= taskbarRect.right && event.clientY >= taskbarRect.top && event.clientY <= taskbarRect.bottom;
            let overStartBtn = false;
            if (smBtnEl) {
                const smBtnRect = smBtnEl.getBoundingClientRect();
                overStartBtn = event.clientX >= smBtnRect.left && event.clientX <= smBtnRect.right && event.clientY >= smBtnRect.top && event.clientY <= smBtnRect.bottom;
            }
            if (overFooter && !overStartBtn) {
                // Pin to taskbar
                console.debug(`[Desktop] Pinning ${app.name.d} to taskbar (footer)`);
                if (window.setPinnedApps && window.getPinnedApps) {
                    const pinned = window.getPinnedApps();
                    if (!pinned.includes(app.name.s)) {
                        pinned.push(app.name.s);
                        window.setPinnedApps(pinned);
                        console.debug(`[Desktop] Successfully pinned ${app.name.d} to taskbar`);
                    }
                }
                window.userBox = undefined;
                if (dropIndicator) {
                    dropIndicator.remove();
                    dropIndicator = null;
                }
                if (desktopDragPreview) {
                    desktopDragPreview.remove();
                    desktopDragPreview = null;
                }
                return; // Don't add to desktop if dropping on taskbar
            }
        }
        
        // If dragging from Start Menu or Taskbar and not dropping on taskbar/Start Menu, add to desktop
        if (window.userBox && (window.userBox.source === 'startMenu' || window.userBox.source === 'taskbarPinned')) {
            console.debug(`[Desktop] Adding ${app.name.d} from ${window.userBox.source} to desktop`);
            if (window.addAppToDesktop && typeof window.addAppToDesktop === 'function') {
                window.addAppToDesktop(app);
                console.debug(`[Desktop] Successfully added ${app.name.d} to desktop`);
            }
        }
    }
    
    window.userBox = undefined;
    // Remove drag preview if it exists
    const preview = document.getElementById('desktop-drag-preview');
    if (preview) preview.remove();
});

// Drag preview functionality for desktop icon repositioning
let desktopDragPreview = null;
let dropIndicator = null;

document.addEventListener("mousemove", (event) => {
    // Check if dragging from desktop (userBox.filled) or Start Menu/Taskbar (userBox.app with source)
    const isDragging = window.userBox && (window.userBox.filled || (window.userBox.app && (window.userBox.source === 'startMenu' || window.userBox.source === 'taskbarPinned')));
    
    if (isDragging) {
        const app = window.userBox.app || (window.userBox.filled ? window.userBox.app : null);
        // Create or update drag preview
        if (!desktopDragPreview) {
            desktopDragPreview = document.createElement('div');
            desktopDragPreview.id = 'desktop-drag-preview';
            desktopDragPreview.style.position = 'fixed';
            desktopDragPreview.style.pointerEvents = 'none';
            desktopDragPreview.style.zIndex = '10000';
            desktopDragPreview.style.opacity = '0.8';
            desktopDragPreview.style.display = 'flex';
            desktopDragPreview.style.flexDirection = 'column';
            desktopDragPreview.style.alignItems = 'center';
            desktopDragPreview.style.gap = '4px';
            desktopDragPreview.style.width = '70px';
            
            // Add icon
            const icon = document.createElement('img');
            icon.src = app.icon.l;
            icon.style.width = '48px';
            icon.style.height = '48px';
            icon.style.filter = 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))';
            desktopDragPreview.appendChild(icon);
            
            // Add label
            const label = document.createElement('div');
            label.textContent = app.name.d;
            label.style.fontSize = '11px';
            label.style.color = 'white';
            label.style.textAlign = 'center';
            label.style.textShadow = '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black';
            label.style.wordWrap = 'break-word';
            label.style.maxWidth = '70px';
            desktopDragPreview.appendChild(label);
            
            document.body.appendChild(desktopDragPreview);
        }
        
        // Update position to follow cursor (offset slightly so cursor is visible)
        desktopDragPreview.style.left = (event.clientX + 10) + 'px';
        desktopDragPreview.style.top = (event.clientY + 10) + 'px';
        
        // Show drop indicator when over taskbar (footer)
        const taskbarEl = document.getElementsByTagName('footer')[0];
        const smBtnEl = document.getElementById('sm_btn');
        if (taskbarEl) {
            const tRect = taskbarEl.getBoundingClientRect();
            const overFooter = event.clientX >= tRect.left && event.clientX <= tRect.right &&
                                  event.clientY >= tRect.top && event.clientY <= tRect.bottom;
            let overStartBtn = false;
            if (smBtnEl) {
                const smBtnRect = smBtnEl.getBoundingClientRect();
                overStartBtn = event.clientX >= smBtnRect.left && event.clientX <= smBtnRect.right && event.clientY >= smBtnRect.top && event.clientY <= smBtnRect.bottom;
            }
            const isOverTaskbar = overFooter && !overStartBtn;
            
            if (isOverTaskbar && !dropIndicator) {
                dropIndicator = document.createElement('div');
                dropIndicator.style.position = 'fixed';
                dropIndicator.style.left = tRect.left + 'px';
                dropIndicator.style.top = tRect.top + 'px';
                dropIndicator.style.width = tRect.width + 'px';
                dropIndicator.style.height = tRect.height + 'px';
                dropIndicator.style.backgroundColor = 'rgba(0, 84, 229, 0.3)';
                dropIndicator.style.border = '2px dashed #0054e5';
                dropIndicator.style.pointerEvents = 'none';
                dropIndicator.style.zIndex = '99999';
                document.body.appendChild(dropIndicator);
            } else if (!isOverTaskbar && dropIndicator) {
                dropIndicator.remove();
                dropIndicator = null;
            }
        }
        
        // Auto-open Start Menu when hovering over Start button while dragging
        const startButton = document.getElementById('sm_btn');
        if (startButton) {
            const btnRect = startButton.getBoundingClientRect();
            const isOverStartButton = event.clientX >= btnRect.left && event.clientX <= btnRect.right &&
                                     event.clientY >= btnRect.top && event.clientY <= btnRect.bottom;
            
            if (isOverStartButton && window.smActive === false) {
                console.debug('[Desktop] Auto-opening Start Menu while dragging');
                if (window.createStartMenu) {
                    window.smActive = true;
                    window.createStartMenu();
                }
            }
        }
        
        // Show indicator when over Start Menu
        const startMenu = document.getElementById('smBox');
        if (startMenu && !dropIndicator) {
            const smRect = startMenu.getBoundingClientRect();
            const leftHalf = document.getElementById('smLeftHalf');
            if (leftHalf) {
                const leftRect = leftHalf.getBoundingClientRect();
                const isOverStartMenu = event.clientX >= leftRect.left && event.clientX <= leftRect.right &&
                                       event.clientY >= leftRect.top && event.clientY <= leftRect.bottom;
                
                if (isOverStartMenu) {
                    dropIndicator = document.createElement('div');
                    dropIndicator.style.position = 'fixed';
                    dropIndicator.style.left = leftRect.left + 'px';
                    dropIndicator.style.top = leftRect.top + 'px';
                    dropIndicator.style.width = leftRect.width + 'px';
                    dropIndicator.style.height = leftRect.height + 'px';
                    dropIndicator.style.backgroundColor = 'rgba(0, 84, 229, 0.2)';
                    dropIndicator.style.border = '2px dashed #0054e5';
                    dropIndicator.style.pointerEvents = 'none';
                    dropIndicator.style.zIndex = '99999';
                    document.body.appendChild(dropIndicator);
                }
            }
        }
        
    } else {
        // Remove preview and indicator if no longer dragging
        if (desktopDragPreview) {
            desktopDragPreview.remove();
            desktopDragPreview = null;
        }
        if (dropIndicator) {
            dropIndicator.remove();
            dropIndicator = null;
        }
    }
});


// Delete key to remove selected apps from desktop
// Enter key to start hovered app
document.addEventListener('keydown', (event) => {
    // Check if Delete key is pressed
    if (event.key === 'Delete' || event.key === 'Del') {
        // Don't delete if user is typing in an input field (renaming)
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
            return;
        }
        
        // Find all selected boxes
        let deletedCount = 0;
        dkGridArray.forEach(row => row.forEach(box => {
            if (box.select.active && box.filled && !box.select.change) {
                box.detach();
                deletedCount++;
            }
        }));
        
        if (deletedCount > 0) {
            console.debug(`[Desktop] Deleted ${deletedCount} app(s) from desktop`);
        }
    }
    
    // Check if Enter key is pressed
    if (event.key === 'Enter') {
        // Don't trigger if user is typing in an input field
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
            return;
        }
        
        // Start the hovered app
        if (hoveredBox && hoveredBox.filled && hoveredBox.app) {
            console.debug(`[Desktop] Starting app '${hoveredBox.app.name.s}' via Enter key`);
            startApp(hoveredBox.app);
        }
    }
});


// Auto-restore saved windows on startup if the user opted-in
document.addEventListener('DOMContentLoaded', () => {
    try {
        const enabled = localStorage.getItem('wigdos_restore_on_start') === 'true';
        if (!enabled) return;
        if (!window.windowSessions || !window.windowSessions.getSessions) return;

        const sessions = window.windowSessions.getSessions();
        if (!sessions || !sessions.length) return;

        // Delay a tick so the app environment is ready (applications should be defined)
        setTimeout(() => {
            sessions.forEach(s => {
                try {
                    if (applications && applications[s.appId]) {
                        startApp(applications[s.appId], s);
                    }
                } catch (e) { /* noop */ }
            });
        }, 50);
    } catch (e) { /* noop */ }
});

// Autosave layout every 5 minutes (300000ms)
setInterval(() => {
    try {
        // Only save if user is signed-in and layoutDirty is true
        if (window.getUser && window.getUser() !== 'guest' && window.saveLayoutToDB && window.layoutDirty) {
            window.saveLayoutToDB();
        }
    } catch (e) {
        console.error('[Desktop] Autosave layout error:', e);
    }
}, 300000);