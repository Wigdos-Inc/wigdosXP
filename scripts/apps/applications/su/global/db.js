async function suDB(type, data) {

    try {
        const { db, setDoc, getDoc, doc } = window.firebaseAPI;
        const username = getUser();
        const isOnline = window.firebaseOnline !== false;

        // Load the current Date
        const time = Date.now();
        const date = new Date(); date.setHours(0, 0, 0, 0);
        const day = date.getTime();
        
        switch (type) {

            case "store":

                // Store Data
                if (username != "guest" && isOnline) {

                    console.log("DB Used");

                    // NaN Failsafe
                    if (!data.xp) data.xp = 0;
                    if (!data.gold) data.gold = 0;

                    await setDoc(
                        doc(db, "game_saves", username), 
                        { su: JSON.stringify(data) },
                        { merge: true }
                    );

                }
                else if (username != "guest" && !isOnline) {
                    console.log("Offline mode: Data saved locally only");
                    // In offline mode, just save to local storage
                }

                window.dispatchEvent(new Event("dataUpdate"));

                break;

                
            case "load":

                // Check if Data has been Loaded Before
                if (localStorage.suData) data = JSON.parse(localStorage.suData);
                else if (localStorage.suData && document.title.toLowerCase().includes("hub")) {

                    // Store Data in DB if in Hub and online
                    if (isOnline) {
                        suDB("store", JSON.parse(localStorage.suData));
                    }
                    return;
                    
                }
                else {
                    
                    let newData = false;

                    // Temporary Storage Load for Guests or offline users
                    if (username == "guest" || !isOnline) {
                        if (localStorage.suData) data = JSON.parse(localStorage.suData);
                        else newData = true;
                    }
                    else if (username != "guest" && isOnline) {

                        console.log("DB Used");

                        // Check if User has SU Data
                        const userDoc = await getDoc(doc(db, "game_saves", username));
                        if (userDoc.exists() && userDoc.data().su) {

                            // Store Data in Variable
                            data = JSON.parse(userDoc.data().su);

                        }
                        else newData = true;

                    }

                    if (newData) {

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

            console.log("Daily Task Reset");

            await task.override();
            data.tasks.date = day;
            data.tasks.all = task.user.all;
            data.tasks.pin = task.user.pin;

        }

        // Store Data
        if (data.level == 0) data.level = 1; // Failsafe
        if (localStorage.getItem("timer") > data.time) data.time = localStorage.getItem("timer");
        window.suData = data;
        localStorage.setItem("suData", JSON.stringify(data));
        return true;

    }
    catch (error) { 
        // Check if we're in offline mode - if so, try to continue with local data only
        if (window.firebaseOnline === false) {
            console.warn("Offline mode: Continuing with local data only");
            
            // Try to load from local storage as fallback
            if (type === "load") {
                let fallbackData = null;
                
                if (localStorage.suData) {
                    fallbackData = JSON.parse(localStorage.suData);
                } else {
                    // Create new data for offline use
                    await task.override();
                    const day = new Date(); 
                    day.setHours(0, 0, 0, 0);
                    
                    fallbackData = {
                        time : 0,
                        level: 1,
                        xp   : 0,
                        gold : 0,
                        tasks: {
                            all : task.user.all,
                            pin : {},
                            date: day.getTime()
                        }
                    };
                }
                
                if (fallbackData) {
                    if (fallbackData.level == 0) fallbackData.level = 1;
                    if (localStorage.getItem("timer") > fallbackData.time) fallbackData.time = localStorage.getItem("timer");
                    window.suData = fallbackData;
                    localStorage.setItem("suData", JSON.stringify(fallbackData));
                    return true;
                }
            }
        }
        
        return err("DB Connection Failed: " + error);
    }
}

function err(error) {

    playerrorSound();
    console.error(error);

    document.body.style.pointerEvents = "none";
    document.body.style.opacity = 0.1;
    
    // Show different message for offline mode
    if (window.firebaseOnline === false) {
        window.alert("Offline Mode: Some features may not be available.\nData will be stored locally only.");
        
        // Restore interactivity for offline mode
        document.body.style.pointerEvents = "auto";
        document.body.style.opacity = 1;
        return null;
    } else {
        window.alert("Error: Singular Upgrading is not available at this time.\nPlease try again later.");
        return null;
    }
}



let task = {
    admin: !!localStorage.admin,
    user : {
        all: [],
        pin: []
    },

    list : async function() {

        try {
            const res = await fetch("scripts/apps/applications/su/json/tasks.json");
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