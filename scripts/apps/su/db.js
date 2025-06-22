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
                            tasks: {}
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
    catch (error) {
        playerrorSound();
        console.error("DB Connection Failed: " + error);

        document.body.style.pointerEvents = "none";
        document.body.style.opacity = 0.1;
        window.alert("Error: Singular Upgrading is not available at this time.\nPlease try again later.");
        return null;
    }
}