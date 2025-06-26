/* Create Elements */

// Arrows
const arrows = {
    top: document.body.appendChild(document.createElement("div")),
    left: document.body.appendChild(document.createElement("div")),
    right: document.body.appendChild(document.createElement("div"))
}
if (!document.title.toLowerCase().includes("hub")) {

    arrows.top.classList.add("arrowBox"); arrows.top.id = "topArrow";
    arrows.left.classList.add("arrowBox"); arrows.left.classList.add("hArrow"); arrows.left.id = "leftArrow";
    arrows.right.classList.add("arrowBox"); arrows.right.classList.add("hArrow"); arrows.right.id = "rightArrow";

}

// Borders
const borders = 
[
    document.body.appendChild(document.createElement("div")),
    document.createElement("div"),
    document.createElement("div"),
    document.createElement("div")
]
let bWidth = 0;
borders.forEach((border, index) => {

    if (index > 0) borders[index-1].appendChild(border);
    border.classList.add(`border-${index+1}`);

    // Add up total Border Width
    bWidth += parseFloat(getComputedStyle(border).borderWidth);
});

// Background
const bg = document.body.appendChild(document.createElement("div"));
bg.id = "bg";




/* Global Variables */

const main = document.getElementById("main-container") || document.getElementsByClassName("app-container")[0];

// Arrow Positional Margin
let screenMargin = window.innerWidth < 1000 ? window.innerWidth/10+bWidth : 100+bWidth;
window.addEventListener("resize", () => screenMargin = window.innerWidth < 1000 ? window.innerWidth/10+bWidth : 100+bWidth); 

// Arrow Navigation
const pages = ["user", "leaderboard", "market"];
let doing = true;

const pageData = {
    origin : pages.indexOf(new URLSearchParams(window.location.search).get("origin")),
    current: pages.findIndex(page => document.title.toLowerCase().includes(page)),
    wrap   : new URLSearchParams(window.location.search).get("wrap") ? true : false
}




/* Functions */

function navigate(slide, destination) {

    // Save Data
    suDB("store", window.suData);

    main.style.transform = `translate(${slide})`;
    main.addEventListener("transitionend", () => {

        main.style.opacity = 0;
        location.href = destination;
    });
}

function timeFormat(data) {

    const rawr = data;
    let h = Math.floor(rawr / 3600);
    let m = Math.floor((rawr % 3600) / 60);
    let s = rawr % 60;

    // Time Formatting
    if (h < 10) h = `0${h}`;
    if (m < 10) m = `0${m}`;
    if (s < 10) s = `0${s}`;

    // Display Time
    return `${h}:${m}:${s}`;
}




/* Event Listeners */

// Arrow Hover
document.addEventListener("mousemove", (event) => {

    let transform = {
        x: 0,
        y: 0
    }

    if (!doing && !document.title.toLowerCase().includes("hub")) {

        if (event.clientY < screenMargin) transform.y = `${screenMargin/2}px`;
        else if (event.clientX < screenMargin && event.clientY >= screenMargin) transform.x = `${screenMargin}px`;
        else if (event.clientX > window.innerWidth - screenMargin) transform.x = `-${screenMargin}px`;

        main.style.transform = transform.x || transform.y ? `translate(${transform.x}, ${transform.y})` : "none";

    }
});

// Arrow Click
document.addEventListener("click", (event) => {
    
    if (!doing) {

        let destination;
        let direction;
        let wrap;

        if (event.target === arrows.top) {

            doing = true;
            destination = "apps/su/su.html";
            direction = "0, 100vh";

        }
        else if (event.target === arrows.left) {

            doing = true;

            // Determine Destination
            if (pageData.current == 0) {
                destination = pages[pages.length-1];
                wrap = true;
            }
            else destination = pages[pageData.current-1];

            destination = `apps/su/${destination}.html`;
            direction = "100vw";

        }
        else if (event.target === arrows.right) {

            doing = true;

            // Determine Destination
            if (pageData.current < pages.length-1) destination = pages[pageData.current+1];
            else {
                destination = pages[0];
                wrap = true;
            }

            destination = `apps/su/${destination}.html`;
            direction = "-100vw";

        }

        
        if (doing) {

            destination += `?origin=${pages[pageData.current]}`;
            if (wrap) destination += "&wrap=true";

            navigate(direction, destination);

        }

    }
});




/* Startup Code */

// Page Arrival UI Position
if (pageData.origin !== undefined) {

    // Position based on Origin
    if (document.title.toLowerCase().includes("hub")) {
        if (location.href.includes("origin")) main.style.transform = "translate(0, -100vh)";
        else doing = false;
    }
    else if (pageData.origin == -1) main.style.transform = "translate(0, 100vh)";
    else if (pageData.origin < pageData.current) {
        if (pageData.wrap) main.style.transform = "translate(-100vw)";
        else               main.style.transform = "translate(100vw)";
    }
    else if (pageData.origin > pageData.current) {
        if (pageData.wrap) main.style.transform = "translate(100vw)";
        else               main.style.transform = "translate(-100vw)";
    }

    // Display Content & Enable Transition
    setTimeout(() => {

        main.style.opacity = 1;
        main.style.transition = "transform 0.5s";

        // Center Content
        setTimeout(() => {
            
            main.style.transform = "none";
            main.addEventListener("transitionend", () => doing = false);
        }, 50);
    }, 1);

}
else doing = false;

// Connect to DB
window.addEventListener("dbReady", () => {

    suDB("load").then(res => {

        if (res) {

            window.dispatchEvent(new Event("dataReady"));

            // App Timer
            setInterval(() => {

                // Add to Total Apptime
                window.suData.time++;
                sessionStorage.setItem("timer", window.suData.time);
                window.dispatchEvent(new Event("timerUpdate"));
                taskProg("timer", 1, "su");
            }, 1000);

        }
    });
});