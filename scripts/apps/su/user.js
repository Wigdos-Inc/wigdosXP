/* Global Variables */
const elements = {
    stats: {
        name: document.getElementById("uName"),
        lvl : document.getElementById("uLVL"),
        xp  : {
            bar: document.getElementById("xpBar"),
            blocks: [],

            ini: function() {

                // Load XP Blocks
                for (let i=0; i < 20; i++) {

                    this.blocks.push(this.bar.appendChild(document.createElement("div")));
                    this.blocks[i].classList.add("xpBlock", "block");
                }
            }
        },
        time: document.getElementById("uTime"),
        gold: document.getElementById("uGold"),

        display: function(type) {

            // Colour XP Blocks
            if (type.xp) {

                const limit = Math.round((window.suData.xp / 100) * this.xp.blocks.length);
                let rest = 0;
                for (let i=0; i < limit; i++) {

                    this.xp.blocks[i].classList.add("blockFill");
                    rest++;
                }
                for (let i=rest; i < this.xp.blocks.length; i++) this.xp.blocks[i].classList.remove("blockFill");

            }

            if (type.name) this.name.innerHTML = getUser().toUpperCase();
            if (type.lvl) this.lvl.innerHTML = `LVL ${window.suData.level}`;
            if (type.gold) this.gold.innerHTML = `${window.suData.gold} G`;
            
            // Determine Time Stat
            if (type.time) {

                // Calculate Hours, Minutes and Seconds
                const rawr = window.suData.time;
                let h = Math.floor(rawr / 3600);
                let m = Math.floor((rawr % 3600) / 60);
                let s = rawr % 60;

                // Time Formatting
                if (h < 10) h = `0${h}`;
                if (m < 10) m = `0${m}`;
                if (s < 10) s = `0${s}`;

                // Display Time
                this.time.innerHTML = `${h}:${m}:${s}`;

            }
        }
    },
    tasks: {
        cont : document.getElementById("task-box"),
        outer: document.getElementById("taskOuter"),
        box  : [],
        name : [],
        icon : [],
        prog : [],
        bar  : [],

        display: async function(create) {

            let success = true;
            try {
                // Store Color Data
                const res = await fetch("scripts/apps/su/json/colors.json");
                var colors = await res.json();
            } 
            catch {
                success = false;
                console.warn("Warning: Color JSON Connection Failed");
            }
            
            window.suData.tasks.all.forEach((task, index) => {

                if (create) {

                    // Empty old Tasks if they Exist
                    if (this.box[index]) {
                        this.box[index].remove();
                        this.box[index] = undefined;
                    }

                    // Create Task Box
                    this.box[index] = this.outer.appendChild(document.createElement("div"));
                    this.box[index].classList.add("taskItems");
                    this.box[index].task = task;

                    // Create Task Top
                    const top = this.box[index].appendChild(document.createElement("div"));
                    top.classList.add("taskTop");

                    // Create Task Bottom
                    const bottom = this.box[index].appendChild(document.createElement("div"));
                    bottom.classList.add("taskBottom");

                    // Create Task Info
                    const iconBox = top.appendChild(document.createElement("div"));
                    iconBox.classList.add("taskIconBox", "topContent");
                    this.icon[index] = iconBox.appendChild(document.createElement("img"));
                    this.icon[index].classList.add("taskIcon");
                    this.icon[index].src = `assets/images/su/tasks/${task.type}.png`;

                    this.name[index] = top.appendChild(document.createElement("div"));
                    this.name[index].classList.add("taskName", "topContent");
                    this.name[index].innerHTML = task.name.full;

                    this.prog[index] = top.appendChild(document.createElement("div"));
                    this.prog[index].classList.add("taskProg", "topContent");

                    // Create progress Bar
                    this.bar[index] = bottom.appendChild(document.createElement("div"));
                    this.bar[index].classList.add("progBar", "bar");

                }

                // Assign/Update Data
                this.prog[index].innerHTML = `${task.progress}/${task.condition}`;
                // Create / Update Progress Bar Content
                if (!this.bar[index].children.length) {

                    // Math BS (making task.condition a number below 20 rounded on a 5)
                    const amount = task.condition;
                    const margin = amount > 20 ? Math.round(amount/20): 1;
                    const result = amount > 20 ? Math.round(amount/margin / 5)*5 : amount;

                    for (let i=0; i < result; i++) {

                        // Create Progress Bar Blocks
                        const block = this.bar[index].appendChild(document.createElement("div"));
                        block.classList.add("progBlock", "block");
                    }

                }

                let rest = 0;
                const limit = Math.floor((task.progress / task.condition) * this.bar[index].children.length);
                for (let i=0; i < limit; i++) {
                    
                    this.bar[index].children[i].classList.add("blockFill");
                    rest++;
                }
                for (let i=rest; i < this.bar[index].children.length; i++) this.bar[index].children[i].classList.remove("blockFill");
            });
        }
    }
}


/* Event Listeners */

// When DB Data is Ready
window.addEventListener("dataReady", () => {

    // Display Stats & Tasks
    elements.stats.display({ xp: true, name: true, lvl: true, time: true, gold: true });
    elements.tasks.display(true);

    // Enable all Tasks
    window.suData.tasks.all.forEach(task => task.active = true);

    // Task Completion (Admin Overrides)
    document.addEventListener("keypress", (event) => {

        if (event.key === "t" && task.admin) {
            const task = window.suData.tasks.all[0];
            taskProg(task.type, 180, task.target, true);
        }
        else if (event.key === "s" && task.admin) suDB("store", window.suData);
        else if (event.key === "o" && task.admin) var add = window.prompt("How much Progress do you wanna add to SU Apptime?");
        else if (!task.admin) console.warn("You don't have rights.");

        if (add) {
            console.log(add, window.suData.tasks.all[0].progress);
            const task = window.suData.tasks.all[0];
            taskProg(task.type, parseInt(add), task.target, true);
        }
    });

    // Stored Mini Rewards
    if (localStorage.lvlUp) {
        localStorage.removeItem("lvlUp");
        glow(elements.stats.lvl);
    }
    if (localStorage.goldUp) {
        localStorage.removeItem("goldUp");
        glow(elements.stats.gold);
    }
});

// DB Update
window.addEventListener("dataUpdate", () => {

    elements.stats.display({ xp: true, lvl: true, time: true, gold: true });
    elements.tasks.display(true);
});

// Timer Update
window.addEventListener("timerUpdate", () => elements.stats.display({ time: true }));


// Screenchange
window.addEventListener("resize", () => {

    elements.stats.display({ xp: true, name: true, lvl: true, time: true, gold: true });
    elements.tasks.display(false);
})




// Add horizontal scroll via mouse wheel for #task-box after initialization
const taskBox = document.getElementById("task-box");
if (taskBox) {
    taskBox.addEventListener("wheel", (e) => {
        e.preventDefault();
        taskBox.scrollLeft += e.deltaY;
    });
}


/* Startup Code */
elements.stats.xp.ini();