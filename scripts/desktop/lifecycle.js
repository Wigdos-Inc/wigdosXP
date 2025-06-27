// Windows XP Startup Sound
const audio = new Audio('assets/sfx/startup.mp3');
/* Startup */

window.onload = () => {

    if (sessionStorage.getItem("loaded")) load();
    else {

        // Create Power Button UI
        const powerOn = document.body.appendChild(document.createElement("div")); powerOn.classList.add("powerOn");
        const powerOnBtn = powerOn.appendChild(document.createElement("img")); powerOnBtn.classList.add("powerOptionBox"); powerOnBtn.id = "powerOnBtn";
        powerOnBtn.src = "assets/images/icons/32x/power.png";

        // Create background Creature
        const creature = powerOn.appendChild(document.createElement("img"));
        creature.src = "assets/images/icons/48x/bombs.png";
        creature.style.position = "absolute";
        creature.style.width = "80%";
        creature.style.opacity = "0.05";
        creature.style.pointerEvents = "none";

        // Move on if User clicks Power Button
        powerOnBtn.onclick = () => {
            
            creature.remove();
            powerOn.remove();
            
            load();
        }

    }
    
}

/* Loading */

function load() {

    // If the User hasn't loaded before
    if (!sessionStorage.getItem("loaded")) {

        const loader = document.body.appendChild(document.createElement("div")); loader.classList.add("loader");
        loader.style.visibility = "unset";


        // Prep Desktop Background
        setTimeout(() => { document.body.style.backgroundImage = "url(assets/images/background/desktop.jpg)"; }, 500);


        // Log/Sign In
        setTimeout(() => {

            // Create Account Screen
            const accBox = document.body.appendChild(document.createElement("div")); accBox.classList.add("accBox", "startup");

            const cBox = accScreen(accBox);
            cBox[0].innerHTML = "<i><strong>welcome</strong></i>";
            fill(cBox[1], "login");            

            // Remove Loader
            loader.remove();
        }, 3700);

    }
    else {

        document.body.style.backgroundImage = "url(assets/images/background/desktop.jpg)";
        desktopFill("load", JSON.parse(sessionStorage.getItem("layout")));
        document.getElementsByTagName("main")[0].style.opacity = 1;
        document.getElementsByTagName("footer")[0].style.opacity = 1;

    }
};




/* Shutdown */

let power = {
    type   : undefined,
    overlay: document.createElement("div"),
    accBox : document.createElement("div"),

    stage1 : function(off) {

        this.type = off;

        // Remove Start Menu
        smActive = false;
        if (document.getElementById("smBox")) document.getElementById("smBox").remove();

        // Remove User Agency
        document.body.style.pointerEvents = "none";
        
        // Prepare Overlay
        document.body.appendChild(this.overlay); 
        this.overlay.classList.add("overlay");

        // Cursor Change
        document.body.style.cursor = "wait";

        setTimeout(() => this.stage2(), 1000);
    },

    stage2: function() {

        // Remove Desktop Icons
        taskbar.style.position = "absolute";
        taskbar.style.bottom = 0;
        desktop.remove();

        // Shutdown Effects (1st Flash)
        this.overlay.style.backgroundColor = "#080c14";

        setTimeout(() => {

            // Shutdown Effects (2nd Flash)
            this.overlay.style.backgroundColor = "#466bc2";

            setTimeout(() => {

                // Make Overlay Transparent
                this.overlay.style.backgroundColor = "transparent";

                setTimeout(() => {

                    // Remove Taskbar
                    taskbar.remove();

                    setTimeout(() => {

                        // Shutdown Screen
                        document.body.style.backgroundImage = "none";
                        this.overlay.appendChild(this.accBox);
                        this.accBox.classList.add("accBox");

                        const cBox = accScreen(this.accBox);
                        cBox[0].innerHTML = "<i><strong>goodbye</strong></i>";
                        fill(cBox[1], "out");
                    }, 1500);
                }, 500);
            }, 50);
        }, 50);
    },

    stage3: function() {

        const graphic = this.accBox.appendChild(document.createElement("img")); graphic.id = "sdGraphic";
        graphic.src = "assets/images/background/shutdownGraphic_noBG.png";


        // Shutdown Sound
        const shutDownSFX = new Audio("assets/sfx/shutdown.mp3");
        shutDownSFX.play();

        shutDownSFX.onended = () => {

            // Remove Shutdown Screen
            this.accBox.remove();

            // Clear Session Data
            sessionStorage.clear();
            localStorage.clear();

            // Shutdown
            this.overlay.style.backgroundImage = "none";
            this.overlay.style.backgroundColor = "black";

            // Make the Cursor Invisible
            this.overlay.style.pointerEvents = "auto";
            this.overlay.style.cursor = "none"

            setTimeout(() => (!this.type ? location.reload() : window.close()), 2000);
        }
    }
}




/* Account Screen */

function accScreen(container) {

    // Create Background
    container.style.backgroundColor = "#466bc2";
    const topBar = container.appendChild(document.createElement("div")); topBar.classList.add("sdBar"); topBar.id = "sdTopBar";
    const topBorder = topBar.appendChild(document.createElement("div")); topBorder.id = "sdTopBorder";
    const bottomBar = container.appendChild(document.createElement("div")); bottomBar.classList.add("sdBar"); bottomBar.id = "sdBottomBar";
    const bottomBorder = bottomBar.appendChild(document.createElement("div")); bottomBorder.id = "sdBottomBorder";
    const lightSource = container.appendChild(document.createElement("div")); lightSource.id = "light";

    // Prep Content
    const contentBox   = container.appendChild(document.createElement("div")); contentBox.id = "contentBox";
    const contentLeft  = contentBox.appendChild(document.createElement("div")); contentLeft.id = "contentLeft";
    const contentMid   = contentBox.appendChild(document.createElement("div")); contentMid.id = "contentMid";
    const contentRight = contentBox.appendChild(document.createElement("div")); contentRight.id = "contentRight";
    contentLeft.classList.add("accBox_content"); contentRight.classList.add("accBox_content");

    return [contentLeft, contentRight];
}

function fill(parent, type) {

    // Remove former iteration if it exists
    if (document.getElementById("accBoxInner")) document.getElementById("accBoxInner").remove();

    // Create Inner Box 
    const accBoxInner = parent.appendChild(document.createElement("div")); accBoxInner.id = "accBoxInner";

    if (type == "login") {

        const form = accBoxInner.appendChild(document.createElement("form"));
        form.action = ""

        const login = {
            user: {
                label: document.createElement("label"),
                input: document.createElement("input")
            },
            pass: {
                label: document.createElement("label"),
                input: document.createElement("input")
            },
            btn : document.createElement("input"),
            output: document.createElement("p"),
            wrong: document.createElement("p"),
            guest: document.createElement("p")
        }


        // Username
        login.user.input.type = "text";
        login.user.input.name = "username";
        login.user.input.id = "username";
        login.user.input.autocomplete = "username";

        login.user.label.htmlFor = "username";
        login.user.label.innerHTML = "Username:";

        // Password
        login.pass.input.type = "password";
        login.pass.input.name = "password";
        login.pass.input.id = "password";
        login.pass.input.autocomplete = "current-password";
        
        login.pass.label.htmlFor = "password";
        login.pass.label.innerHTML = "Password:";

        // Button
        login.btn.type = "button";
        login.btn.classList.add("accBtn");
        login.btn.value = "Log In";
        login.btn.onclick = () => logIn(login.user.input, login.pass.input);

        // Switch
        login.wrong.id = "change";
        login.wrong.innerHTML = "Don't have an account? Click here!";
        login.wrong.onclick = () => fill(parent, "signin");

        // Guest
        login.guest.id = "guest";
        login.guest.innerHTML = "Log in as a Guest";
        login.guest.onclick = () => {

            localStorage.setItem("username", "guest");
            desktopFill("base");
            fill(parent, "in");
        }

        // Output
        login.output.id = "accOutput";

        // Append Elements
        form.appendChild(login.user.label);
        lineBreak(1);
        form.appendChild(login.user.input);
        lineBreak(2);

        form.appendChild(login.pass.label);
        lineBreak(1);
        form.appendChild(login.pass.input);
        lineBreak(2);

        form.appendChild(login.btn);
        lineBreak(2);

        form.appendChild(login.wrong);
        lineBreak(1);

        form.appendChild(login.guest);
        lineBreak(2);

        form.appendChild(login.output);


        // Input Limit
        function limit(element, amount) {

            element.addEventListener("input", () => {

                if (element.value.length > amount) element.value = element.value.slice(0, amount);
            });
        }
        limit(login.user.input, 20);
        limit(login.pass.input, 20);


        function lineBreak(amount) {

            for (let i=0; i < amount; i++) form.appendChild(document.createElement("br"));
        }

    }
    else if (type == "signin") {

        const form = accBoxInner.appendChild(document.createElement("form"));
        form.action = ""

        const signin = {
            fName: {
                label: document.createElement("label"),
                input: document.createElement("input")
            },
            lName: {
                label: document.createElement("label"),
                input: document.createElement("input")
            },
            email: {
                label: document.createElement("label"),
                input: document.createElement("input")
            },
            user: {
                label: document.createElement("label"),
                input: document.createElement("input")
            },
            pass: {
                label: document.createElement("label"),
                input: document.createElement("input")
            },
            btn : document.createElement("input"),
            output: document.createElement("p"),
            wrong: document.createElement("p")
        }


        // First Name
        signin.fName.input.type = "text";
        signin.fName.input.name = "firstname";
        signin.fName.input.id = "firstname";
        signin.fName.input.autocomplete = "given-name";

        signin.fName.label.htmlFor = "firstname";
        signin.fName.label.innerHTML = "First Name:";

        // Last Name
        signin.lName.input.type = "text";
        signin.lName.input.name = "lastname";
        signin.lName.input.id = "lastname";
        signin.lName.input.autocomplete = "family-name";

        signin.lName.label.htmlFor = "lastname";
        signin.lName.label.innerHTML = "Last Name:";

        // Email
        signin.email.input.type = "email";
        signin.email.input.name = "email";
        signin.email.input.id = "email";
        signin.email.input.autocomplete = "email";

        signin.email.label.htmlFor = "email";
        signin.email.label.innerHTML = "Email Address:";

        // Username
        signin.user.input.type = "text";
        signin.user.input.name = "username";
        signin.user.input.id = "username";
        signin.user.input.autocomplete = "username";

        signin.user.label.htmlFor = "username";
        signin.user.label.innerHTML = "Username:";

        // Password
        signin.pass.input.type = "password";
        signin.pass.input.name = "password";
        signin.pass.input.id = "password";
        signin.pass.input.autocomplete = "new-password";

        signin.pass.label.htmlFor = "password";
        signin.pass.label.innerHTML = "Password:";

        // Create Account Button
        signin.btn.type = "button";
        signin.btn.classList.add("accBtn");
        signin.btn.value = "Create Account";
        signin.btn.onclick = () => signIn(
            signin.fName.input,
            signin.lName.input,
            signin.email.input,
            signin.user.input,
            signin.pass.input
        );

        // Switch to Login
        signin.wrong.id = "change";
        signin.wrong.innerHTML = "Already have an account? Click here!";
        signin.wrong.onclick = () => fill(parent, "login");

        // Output
        signin.output.id = "accOutput";

        // Append Elements
        form.appendChild(signin.fName.label);
        lineBreak(1);
        form.appendChild(signin.fName.input);
        lineBreak(2);

        form.appendChild(signin.lName.label);
        lineBreak(1);
        form.appendChild(signin.lName.input);
        lineBreak(2);

        form.appendChild(signin.email.label);
        lineBreak(1);
        form.appendChild(signin.email.input);
        lineBreak(2);

        form.appendChild(signin.user.label);
        lineBreak(1);
        form.appendChild(signin.user.input);
        lineBreak(2);

        form.appendChild(signin.pass.label);
        lineBreak(1);
        form.appendChild(signin.pass.input);
        lineBreak(2);

        form.appendChild(signin.btn);
        lineBreak(2);

        form.appendChild(signin.wrong);
        lineBreak(2);

        form.appendChild(signin.output);


        // Input Limit
        function limit(element, amount) {

            element.addEventListener("input", () => {

                if (element.value.length > amount) element.value = element.value.slice(0, amount);
            });
        }
        limit(signin.fName.input, 50);
        limit(signin.lName.input, 50);
        limit(signin.email.input, 50);
        limit(signin.user.input, 20);
        limit(signin.pass.input, 20);


        function lineBreak(amount) {

            for (let i=0; i < amount; i++) form.appendChild(document.createElement("br"));
        }

    }
    else {

        // Display Icon
        accBoxInner.classList.add("specialFlex");
        const boxInnerLeft = accBoxInner.appendChild(document.createElement("div")); boxInnerLeft.id = "boxInnerLeft";
        const icon = boxInnerLeft.appendChild(document.createElement("img")); icon.id = "uIcon";
        icon.src = "assets/images/icons/user/guest.png";

        // Display Username & Text
        const boxInnerRight = accBoxInner.appendChild(document.createElement("div")); boxInnerRight.id = "boxInnerRight";
        const username = boxInnerRight.appendChild(document.createElement("p")); username.id = "pu";
        username.innerHTML = `<strong>${localStorage.getItem("username")}</strong>`;

        const subtitle = boxInnerRight.appendChild(document.createElement("p")); subtitle.id = "ps";
        subtitle.innerHTML = type == "in" ? "<i>Logging In...</i>" : "<i>Logging Out...</i>";


        setTimeout(() => {
            
            if (type == "out") parent.parentElement.remove();
            type == "in" ? start() : power.stage3();
        }, 3000); // Duration of Logging In/Out
    }
}

function logIn(uField, pField) {

    // Store Input
    const input = {
        u: uField.value,
        p: pField.value
    }

    // Validation
    const output = document.getElementById("accOutput");
    output.innerHTML = "";

    if (!input.u || !input.p) output.innerHTML = "Please fill in all fields!";
    else if (input.u.length < 4) output.innerHTML = "Username must contain at least 4 characters!";
    else if (input.p.length < 6) output.innerHTML = "Password must contain at least 6 characters!";
    else db(input, "login");
}

function signIn(fnField, lnField, eField, uField, pField) {

    // Store Input
    const input = {
        fn: fnField.value,
        ln: lnField.value,
        e : eField.value,
        u : uField.value,
        p : pField.value
    }

    // Validation
    const output = document.getElementById("accOutput");
    output.innerHTML = "";

    if (!input.fn || !input.ln || !input.e || !input.u || !input.p) output.innerHTML = "Please fill in all fields!";
    else if (input.fn.length < 2) output.innerHTML = "First name must contain at least 2 characters!";
    else if (input.ln.length < 2) output.innerHTML = "Last name must contain at least 2 characters!";
    else if (input.u.length < 4) output.innerHTML = "Username must contain at least 4 characters!";
    else if (input.p.length < 6) output.innerHTML = "Password must contain at least 6 characters!";
    else db(input, "signin");
}

// Password Encoder
async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Send/Receive Data from Database
async function db(data, type) {

    const output = document.getElementById("accOutput");
    output.innerHTML = "";

    try {
        const { db, setDoc, getDoc, doc } = window.firebaseAPI;

        if (type === "signin") {

            // Check for existing username (used as document ID/KEY)
            const userDoc = await getDoc(doc(db, "users", data.u));
            if (userDoc.exists()) {
                output.innerHTML = "Username already in use.";
                output.style.color = "red";
                return;
            }

            // Hash the password (SHA-256 for demo purposes; bcrypt preferred in production)
            const hash = await sha256(data.p);

            function isValidEmail(email) {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            }

            if (!isValidEmail(data.e)) {
                output.innerHTML = "Email is invalid.";
                output.style.color = "red";
                return;
            }
            // Create user in Firestore
            await setDoc(doc(db, "users", data.u), {
                firstname: data.fn,
                lastname: data.ln,
                email: data.e,
                username: data.u,
                password: hash,
                layout: desktopFill("base"),
                admin: false
            });

            localStorage.setItem("username", data.u);
            fill(document.getElementById("contentRight"), "in");

        } else if (type === "login") {

            // Get user doc by username
            const userDoc = await getDoc(doc(db, "users", data.u));
            if (!userDoc.exists()) {
                output.innerHTML = "No user found";
                output.style.color = "red";
                return;
            }

            const userData = userDoc.data();

            // Hash the entered password
            const hash = await sha256(data.p);

            if (hash === userData.password) {

                localStorage.setItem("username", data.u);

                // Check if stored Layout is valid
                let layout;
                try {
                    layout = JSON.parse(userData.layout);
                } catch {
                    layout = null;
                }
                if (!layout || !Array.isArray(layout) || layout.length === 0) {

                    // Create new Valid Layout
                    layout = desktopFill("base");
                    desktopFill("update");

                }
                else desktopFill("load", JSON.parse(userData.layout));
                
                fill(document.getElementById("contentRight"), "in");
                if (userData.admin) localStorage.setItem("admin", "t");
                
            } else {
                output.innerHTML = "Incorrect password";
                output.style.color = "red";
            }

        }

    } catch (error) {
        output.style.color = "red";
        output.innerHTML = "Unknown error.";
        console.error("Firestore error:", error);
        playerrorSound();
    }
}



function start() {

    document.getElementsByTagName("main")[0].style.opacity = 1;
    document.getElementsByTagName("footer")[0].style.opacity = 1;

    audio.play();

    const accBox = document.getElementsByClassName("accBox")[0];
    accBox.classList.add("startup-hidden");

    accBox.addEventListener("transitionend", () => {
        accBox.remove();

        const param = new URLSearchParams(window.location.search).get("opdracht");
        if (param == "minor") window.alert("Hallo docent, de Minor opdracht staat in de Singular Upgrading App.\nAls u verder wilt testen, kunt u naar de taken kijken.\nLet op! Singular Upgrading update alleen maar als de applicatie nog open is!");
        else if (param == "beroeps") window.alert("Hallo docent, de nieuwste Wigdos XP uitbreiding (gemaakt voor beroeps) is Singular Upgrading.\nSommige functies binnen SU werken samen met andere games. Er zal altijd vermeld staan over welke game het gaat.\nLet op! Singular Upgrading update alleen maar de data van andere games als de applicatie zelf nog open is!");
    });
    sessionStorage.setItem("loaded", true);
}


// Future:
// Store username in Local Storage, so that user's last logged in account is remembered