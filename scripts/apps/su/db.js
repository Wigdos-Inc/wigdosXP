async function suDB(type, data) {

    try {
        const { db, setDoc, getDoc, doc } = window.firebaseAPI;
        const username = getUser();
        
        switch (type) {

            case "store":

                // Store Data
                if (username != "guest") {

                    await setDoc(
                        doc(db, "game_saves", username), 
                        { su: JSON.stringify(data) },
                        { merge: true }
                    );

                }
                else sessionStorage.setItem("suData", JSON.stringify(data));

                break;

                
            case "load":

                // Check if User has SU Data
                const userDoc = await getDoc(doc(db, "game_saves", username));
                if (userDoc.exists() && userDoc.data().su) data = JSON.parse(userDoc.data().su); // Store Data in Variable
                else {

                    // Temporary Storage Load for Guests
                    if (username == "guest" && sessionStorage.getItem("suData")) data = JSON.parse(sessionStorage.getItem("suData"));
                    else {

                        // Store Empty Dataset
                        data = {
                            time : 0, 
                            level: 0, 
                            xp   : 0, 
                            gold : 0,
                            tasks: {
                                all:    {},
                                pinned: {}
                            }
                        };

                        suDB("store", data);
                        return;

                    }

                }

                break;


            default: return;
        }

        // Store data in Window
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



window.task = {
    admin: !!localStorage.admin,
    uName: localStorage.username,

    list : async function() {

        fetch("scripts/apps/su/tasks.json")
            .then(res => res.json())
            .then(data => { return data })
            .catch(error => { return err("JSON Tasks Load Failed: " + error) });
    },

    override: async function() {

        if (this.admin) {

            const tasks = {
                all : await this.list(),
                user: {
                    all: {},
                    pin: {}
                },
                c: undefined,
                p: [],

                r: function() {

                    // Rerun on Duplicate
                    const number = Math.floor(Math.random() * limit);
                    if (this.p.includes(number) && this.p.length >= this.all.length) return;
                    else if (this.p.includes(number)) this.r();
                    else {
                        this.c = number;
                        this.p.push(number);
                    }
                }
            }

            // Store Random Tasks
            for (let i=0; i < 5; i++) tasks.r();

        }
        else console.error("Error: You don't have rights.");
    }
}