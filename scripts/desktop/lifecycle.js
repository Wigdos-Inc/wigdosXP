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
        creature.src = "assets/images/icons/48x/creature.png";
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

    // If the User has loaded before
    if (!sessionStorage.getItem("loaded")) {

        const loader = document.body.appendChild(document.createElement("div")); loader.classList.add("loader");
        loader.style.visibility = "unset";


        // Stage 1 of Startup: Display Loading Screen
        setTimeout(() => { document.body.style.backgroundImage = "url(assets/images/background/desktop.jpg)"; }, 500);


        // Stage 2 of Startup: Log/Sign In
        setTimeout(() => {

            // Create Account Screen
            const accBox = document.body.appendChild(document.createElement("div")); accBox.classList.add("accBox");
            accScreen(accBox);

            const contentBox   = accBox.appendChild(document.createElement("div")); contentBox.id = "contentBox";
            const contentLeft  = contentBox.appendChild(document.createElement("div")); contentLeft.id = "contentLeft";
            const contentMid   = contentBox.appendChild(document.createElement("div")); contentMid.id = "contentMid";
            const contentRight = contentBox.appendChild(document.createElement("div")); contentRight.id = "contentRight";
            contentLeft.classList.add("accBox_content"); contentRight.classList.add("accBox_content");

            contentLeft.innerHTML = "<i><strong>welcome</strong></i>";
            fill(contentRight, "login");            

            // Remove Loader
            loader.remove();
        }, 3700);


        /*/ Stage 3 of Startup: Display Desktop
        setTimeout(() => {

            document.getElementsByTagName("main")[0].style.opacity = 1;
            document.getElementsByTagName("footer")[0].style.opacity = 1;

            audio.play();
            loader.classList.add("loader-hidden");

            loader.addEventListener("transitionend", () => loader.remove());
            //sessionStorage.setItem("loaded", true);
        }, 3700); */

    }
    else {

        document.body.style.backgroundImage = "url(assets/images/background/desktop.jpg)";
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

                    setTimeout(() => this.stage3(), 1500);
                }, 500);
            }, 50);
        }, 50);
    },

    stage3: function() {

        // Shutdown Screen
        document.body.style.backgroundImage = "none";
        this.overlay.appendChild(this.accBox);
        this.accBox.classList.add("accBox");
        accScreen(this.accBox);

        const graphic = this.accBox.appendChild(document.createElement("img")); graphic.id = "sdGraphic";
        graphic.src = "assets/images/background/shutdownGraphic_noBG.png";


        // Shutdown Sound
        const shutDownSFX = new Audio("assets/sfx/Windows XP Shutdown Sound.mp3");
        shutDownSFX.play();

        shutDownSFX.onended = () => {

            // Remove Shutdown Screen
            this.accBox.remove();

            // Clear Session Data
            sessionStorage.clear();

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
}

function fill(parent, type) {

    // Remove former iteration if it exists
    if (document.getElementById("accBoxInner")) document.getElementById("accBoxInner").remove();

    // Remove 
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
            wrong: document.createElement("p")
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

        const boxInnerLeft = accBoxInner.appendChild(document.createElement("div")); boxInnerLeft.id = "boxInnerLeft";
        const boxInnerRight = accBoxInner.appendChild(document.createElement("div")); boxInnerRight.id = "boxInnerRight";

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
    else php(input, "login");
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
    else php(input, "signin");
}

// Send/Receive Data from PHP
function php(data, type) {

    const output = document.getElementById("accOutput");

    // Store PHP file path
    let path = `scripts/db/${type}.php`;

    // Communicate with PHP (AI Assistance)
    fetch(path, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {

        if (response.status) {

            // Placeholder Code
            output.innerHTML = "Success!";
            output.style.color = "green";

            // Store username to session
            sessionStorage.setItem("username", data.u);

            // Load Desktop

        }
        else {

            output.style.color = "red";

            switch (response.reason) {

                case "duplicate": output.innerHTML = "Username already in use."; break;
                case "unknown"  : output.innerHTML = "Unknown error."; break;
                case "layout" : output.innerHTML = "Layout error."; break;
                case "user" : output.innerHTML = "No user found"; break;
                case "pass" : output.innerHTML = "Incorrect password"; break;
            }

        }
    })
    .catch(error => {

        playerrorSound();
        console.error("Error:", error);
        output.innerHTML = "Error: See console for more details";
    })
}

// GO DO THE DESKTOP SHIT YA DONKEY