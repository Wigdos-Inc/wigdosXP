async function suDB(type, data) {

    try {
        const { db, setDoc, getDoc, doc } = window.firebaseAPI;
        const username = getUser();

        // Load the current Date
        const time = Date.now();
        const date = new Date(); date.setHours(0, 0, 0, 0);
        const day = date.getTime();

        console.log("DB");
        
        switch (type) {

            case "store":

                // Store Data
                if (username != "guest") {

                    // NaN Failsafe
                    if (!data.xp) data.xp = 0;
                    if (!data.gold) data.gold = 0;

                    await setDoc(
                        doc(db, "game_saves", username), 
                        { su: JSON.stringify(data) },
                        { merge: true }
                    );

                }
                else sessionStorage.setItem("suData", JSON.stringify(data));

                window.dispatchEvent(new Event("dataUpdate"));

                break;

                
            case "load":

                // Check if User has SU Data
                const userDoc = await getDoc(doc(db, "game_saves", username));
                if (userDoc.exists() && userDoc.data().su) data = JSON.parse(userDoc.data().su); // Store Data in Variable
                else {

                    // Temporary Storage Load for Guests
                    if (username == "guest" && sessionStorage.getItem("suData")) data = JSON.parse(sessionStorage.getItem("suData"));
                    else {

                        // Create Tasklist
                        await task.override();

                        // Store Empty Dataset
                        data = {
                            time : 0, 
                            level: 1, 
                            xp   : 0, 
                            gold : 0,
                            tasks: {
                                all : task.user.all,
                                pin : {},
                                date: day
                            }
                        };

                        suDB("store", data);
                        return;

                    }

                }

                break;


            default: return;
        }

        // Refresh Tasklist if needed
        if (!data.tasks.date || time - data.tasks.date > 86400000) {

            await task.override();
            data.tasks.date = day;
            data.tasks.all = task.user.all;
            data.tasks.pin = task.user.pin;

        }

        // Store data in Window
        if (data.level == 0) data.level = 1;
        window.suData = data;
        return true;

    }
    catch (error) { return err("DB Connection Failed: " + error) }
}

function err(error) {

    playerrorSound();
    console.error(error);

    document.body.style.pointerEvents = "none";
    document.body.style.opacity = 0.1;
    window.alert("Error: Singular Upgrading is not available at this time.\nPlease try again later.");
    return null;
}



let task = {
    admin: !!localStorage.admin,
    user : {
        all: [],
        pin: []
    },

    list : async function() {

        try {
            const res = await fetch("scripts/apps/su/json/tasks.json");
            return await res.json();
        } catch (error) {
            return err("JSON Tasks Load Failed: " + error);
        }
    },

    override: async function() {

        // Empty old Tasks
        this.user.all = [];
        this.user.pin = [];

        let tasks = {
            all : await this.list(),
            p: [],

            r: function() {

                // Rerun on Duplicate
                const number = Math.floor(Math.random() * this.all.length);
                if (this.p.includes(number) && this.p.length >= this.all.length) return;
                else if (this.p.includes(number)) this.r();
                else this.p.push(number);
            }
        }

        // Store Random Tasks
        for (let i=0; i < 5; i++) {

            if (i == 0) tasks.p.push(i); // Ensure SU Apptime Goes First
            else tasks.r();
        }

        tasks.p.forEach(taskID => {

            const task = tasks.all[taskID];
            task.progress = 0;
            this.user.all.push(task);
        });
    }
}
let override = false;
window.onkeydown = async function(event) {

    if (event.key === "r" || event.key === "Enter") {

        if (task.admin) {

            // Load New Tasks
            await task.override(false);

            // Store new Tasks
            window.suData.tasks.all = task.user.all;
            window.suData.tasks.pin = task.user.pin;
            window.suData.tasks.date = Date.now() - (86400000 * (Date.now() % 86400000));
            await suDB("store", window.suData);

            // Reload the Page
            location.reload();

        }
        else console.warn("You don't have rights.");

    }
}