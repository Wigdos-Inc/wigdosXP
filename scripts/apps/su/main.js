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
console.log(window.innerWidth, window.innerWidth > 999);
window.addEventListener("resize", () => {

    screenMargin = window.innerWidth < 1000 ? window.innerWidth/10+65 : 100+65;
}); 

const pages = ["user", "leaderboard", "shop"];
let doing;


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

    if (event.target === arrows.top) {
        doing = true;
        main.style.transform = "translate(0, 100vw)";
        main.addEventListener("transitionend", () => {

            location.href = "apps/su/su.html"; 
            doing = false;
        });
    }
    else if (event.target === arrows.left) {
        
        doing = true;
        const origin = pages.findIndex(page => document.title.toLowerCase().includes());
        const destination = pages[origin-1 < 0 ? pages.length-1 : origin-1];

        main.style.transform = "translate(100vw)";
        main.addEventListener("transitionend", () => {

            location.href = `apps/su/${destination}.html`;
            doing = false;
        });

    }
    else if (event.target === arrows.right) {

        doing = true;
        const origin = pages.findIndex(page => document.title.toLowerCase().includes());
        const destination = pages[origin+1 < pages.length-1 ? 0 : origin+1];

        main.style.transform = "translate(-100vw)";
        main.addEventListener("transitionend", () => {

            location.href = `apps/su/${destination}.html`; 
            doing = false;
        });

    }
});