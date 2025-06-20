// Prep
const arrows = {
    top: document.body.appendChild(document.createElement("div")),
    left: document.body.appendChild(document.createElement("div")),
    right: document.body.appendChild(document.createElement("div"))
}
arrows.top.classList.add("arrowBox"); arrows.top.id = "topArrow";
arrows.left.classList.add("arrowBox"); arrows.left.classList.add("hArrow"); arrows.left.id = "leftArrow";
arrows.right.classList.add("arrowBox"); arrows.right.classList.add("hArrow"); arrows.right.id = "rightArrow";


const main = document.getElementById("main-container");

let screenMargin = window.innerWidth < 1000 ? window.innerWidth/10+65 : 100+65;
window.addEventListener("resize", () => screenMargin = window.innerWidth < 1000 ? window.innerWidth/10+65 : 100+65); 

const pages = ["user", "leaderboard", "market"];
let doing = true;

const pageData = {
    origin : pages.indexOf(new URLSearchParams(window.location.search).get("origin")),
    current: pages.findIndex(page => document.title.toLowerCase().includes(page)),
    wrap   : new URLSearchParams(window.location.search).get("wrap") ? true : false
}


// Swipe Stuff
document.addEventListener("mousemove", (event) => {

    let transform = {
        x: 0,
        y: 0
    }

    if (!doing) {

        if (event.clientY < screenMargin && !document.title.toLowerCase().includes("hub")) transform.y = `${screenMargin/2}px`;

        if (event.clientX < screenMargin && event.clientY >= screenMargin) transform.x = `${screenMargin}px`;
        else if (event.clientX > window.innerWidth - screenMargin) transform.x = `-${screenMargin}px`;

        main.style.transform = transform.x || transform.y ? `translate(${transform.x}, ${transform.y})` : "none";

    }
});


// Navigation
document.addEventListener("click", (event) => {

    if (event.target === arrows.top && !doing) {
        doing = true;
        main.style.transform = "translate(0, 100vw)";
        main.addEventListener("transitionend", () => {

            location.href = "apps/su/su.html"; 
            doing = false;
        });
    }
    else if (event.target === arrows.left && !doing) {
        
        doing = true;
        
        // Determine destination
        let destination;
        let wrap;
        if (pageData.current == 0) {
            destination = pages[pages.length-1];
            wrap = true;
        }
        else destination = pages[pageData.current-1];

        destination = `apps/su/${destination}.html?origin=${pages[pageData.current]}`;
        if (wrap) destination += "&wrap=true";

        navigate("translate(100vw)", destination);

    }
    else if (event.target === arrows.right && !doing) {

        doing = true;
        
        // Determine destination
        let destination;
        let wrap;
        if (pageData.current < pages.length-1) destination = pages[pageData.current+1];
        else {
            destination = pages[0];
            wrap = true;
        }

        destination = `apps/su/${destination}.html?origin=${pages[pageData.current]}`;
        if (wrap) destination += "&wrap=true";

        navigate("translate(-100vw)", destination);

    }
});

function navigate(slide, destination) {

    main.style.transform = slide;
    main.addEventListener("transitionend", () => location.href = destination);
}




// Page Arrival UI Position
console.log(pageData.origin);
if (pageData.origin !== undefined) {

    console.log("code runs");

    if (pageData.origin == -1) main.style.transform = "translate(0, 100vh)";
    else if (pageData.origin < pageData.current) {
        if (pageData.wrap) main.style.transform = "translate(-100vw)";
        else               main.style.transform = "translate(100vw)";
    }
    else if (pageData.origin > pageData.current) {
        if (pageData.wrap) main.style.transform = "translate(100vw)";
        else               main.style.transform = "translate(-100vw)";
    }

    setTimeout(() => main.style.transform = "none", 100);
}

// Enable Animation & Center UI
setTimeout(() => doing = false, 600);