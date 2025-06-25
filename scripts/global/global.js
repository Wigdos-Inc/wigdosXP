/* Loading SFX */

function playerrorSound() {

    // Returns the Audio to what Called the Function, Allowing Onended to be Used There
    return new Promise((resolve) => {

        const audio = new Audio('assets/sfx/error.mp3');
        audio.play();

        audio.onended = () => resolve(audio);
    });
}

try {
} catch (error) {
    console.error(error.message);
    playerrorSound(); 
}


function getUser() {

    return localStorage.getItem("username");
}



const imgs = document.getElementsByTagName("img");
for (let i=0; i < imgs.length; i++) {

    let size;
    if (imgs[i].offsetWidth < 100) size = "16x";
    else if (imgs[i].offsetWidth < 200) size = "32x";
    else size = "48x";

    imgs[i].src = `assets/images/icons/${size}/bombs.png`;
}



// Catch errors for further handling if needed
const realConsoleError = console.error;
console.error = function(...args) {

    // Display Error in Console
    realConsoleError.apply(console, args);

    // Log Out User when Database Overloaded
    if (args[1] && typeof args[1] === "string" && args[1].includes("resource-exhausted")) {

        window.alert("Account functions are currently unavailable. Please try again later.\nYou will now be logged out.");

        if (document.getElementsByClassName("accBox")[0]) {
            sessionStorage.clear();
            localStorage.clear();
            localStorage.setItem("username", "guest");
        }
        else power.stage1(false);

    }
}