/* CLASSES */

// Create the Grid Boxes and Store Them
let dkGridArray = [];
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


        // Update Layout
        if (localStorage.getItem("layout") && getUser() != "guest") {

            let layout = JSON.parse(localStorage.getItem("layout"));
            layout[this.pos.row][this.pos.col] = this.app.name.s;
            localStorage.setItem("layout", JSON.stringify(layout));
            desktopFill("update");

        }
    }
    
    detach() {

        this.filled = false;
        this.element.classList.remove("filled");

        this.app = undefined;

        // Remove Icon Element
        this.content.img.remove();
        this.content.img = undefined;

        // Remove Text Element
        this.content.text.remove();
        this.content.text = undefined;


        // Update Layout
        if (localStorage.getItem("layout") && getUser() != "guest") {

            let layout = JSON.parse(localStorage.getItem("layout"));
            layout[this.pos.row][this.pos.col] = null;
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

            // Prepare Layout
            layout = [];
            for (let i=0; i < dkGridArray.length; i++) layout.push([]);

            for (const appKey in applications) {

                if (grid.cr < grid.tr) {
                    layout[grid.cr][grid.cc] = applications[appKey].name.s; // Store Apps in Layout
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

            // Save and Return Layout
            localStorage.setItem("layout", JSON.stringify(layout));
            return JSON.stringify(layout);

        case "load":

            if (layout) {

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

                    layout.forEach(row => {
                        if (row.includes(app.name.s)) included = true;
                    });

                    if (!included) newApps.a.push(app.name.s);
                }

                // Attach Apps to Desktop
                for (let row=0; row < dkGridArray.length; row++) {

                    for (let col=0; col < dkGridArray[row].length; col++) {

                        const appID = layout[row][col];
                        if (appID) dkGridArray[row][col].attach(applications[appID]);
                        else if (newApps.i < newApps.a.length) {

                            // Attach New App
                            dkGridArray[row][col].attach(applications[newApps.gimme()]);
                            newApps.i++;
                            layout[row][col] = newApps.gimme();

                        }
                    }
                }

                // Save Layout
                localStorage.setItem("layout", JSON.stringify(layout));
                if (newApps.i) desktopFill("update");

            }
            else desktopFill("base");

            break;

        case "update":

            // Overwrite old Document
            (async () => {
                try {
                    const { db, setDoc, doc } = window.firebaseAPI;
                    await setDoc (
                        doc(db, "users", getUser()),
                        { layout: localStorage.getItem("layout") },
                        { merge: true }
                    );
                } catch (error) {
                    console.error("Error saving layout:", error);
                    window.alert(error);
                }
            })();
            break;
    }
}





/* EVENT LISTENERS */

// Box x User Interaction
let userBox;
let prevClick = {};
let prevBox;

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

    box.element.addEventListener("mousedown", (event) => {

        // Reset all Boxes
        deselectAll((event.target.tagName !== "INPUT") ? true : false);

        if (box.filled) {

            // Select the new Box
            select(box);
            userBox = box;

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

        if (userBox !== undefined && userBox != box && !box.filled) {

            box.attach(userBox.app);
            userBox.detach();
            userBox = undefined;

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

// Detach Box from User
document.addEventListener("mouseup", () => userBox = undefined);