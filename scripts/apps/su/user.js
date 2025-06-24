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
                    this.blocks[i].classList.add("xpBlock");
                }
            }
        },
        time: document.getElementById("uTime"),
        gold: document.getElementById("uGold"),

        display: function(type) {

            // Colour XP Blocks
            if (type.xp) for (let i=0; i < type.xp[1]; i++) this.xp.blocks[i].style.backgroundColor = "green";

            if (type.name) this.name.innerHTML = getUser().toUpperCase();
            if (type.lvl) this.lvl.innerHTML = `LVL ${window.suData.level}`;
            if (type.gold) this.gold.innerHTML = `${window.suData.gold} G`;
            
            // Determine Time Stat
            if (type.time) {

                const rawr = window.suData.time;
                let h = Math.floor(rawr / 3600);
                let m = Math.floor((rawr % 3600) / 60);
                let s = rawr % 60;


                if (h < 10) h = `0${h}`;
                if (m < 10) m = `0${m}`;
                if (s < 10) s = `0${s}`;

                this.time.innerHTML = `${h}:${m}:${s}`;

            }
        }
    },
    tasks: {}
}



/* Event Listeners */

// When DB Data is Ready
window.addEventListener("dataReady", () => {

    elements.stats.display({ xp: true, name: true, lvl: true, time: true, gold: true });
});

// DB Update
window.addEventListener("dbUpdate", () => {

    elements.stats.display({ xp: true, name: true, lvl: true, time: true, gold: true });
});




/* Startup Code */
elements.stats.xp.ini();

