// Prep
const arrows = {
    top: document.getElementById("topArrow"),
    left: document.getElementById("leftArrow"),
    right: document.getElementById("right")
}
const main = document.getElementById("main-container");


// Swipe Stuff
document.addEventListener("mousemove", (event) => {

    if (event.clientY < 200 && !document.title.toLowerCase().includes("hub")) main.style.marginTop = "100px";
    else main.style.marginTop = 0;

    if (event.clientX < 200 && event.clientY >= 200) main.style.marginLeft = "200px";
    else if (event.clientX > window.innerWidth - 200) main.style.marginLeft = "-200px";
    else main.style.marginLeft = 0;
});


// Navigation
document.addEventListener("click", (event) => {

    if (event.target === arrows.top) {
        main.style.marginTop = "100vh";
        main.addEventListener("transitionend", () => location.href = "su.html");
    }
    else if (event.target === arrows.left) {
        
        let destination;
        let title = document.title.toLowerCase();

        if      (title.includes("user"))        destination = "shop.html";
        else if (title.includes("leaderboard")) destination = "user.html";
        else if (title.includes("marketplace")) destination = "leaderboard.html";

        main.style.marginLeft = "-100vw";
        main.addEventListener("transitionend", () => location.href = destination);

    }
    else if (event.target === arrows.right) {

        let destination;
        let title = document.title.toLowerCase();

        if      (title.includes("user"))        destination = "leaderboard.html";
        else if (title.includes("leaderboard")) destination = "shop.html";
        else if (title.includes("marketplace")) destination = "user.html";

        main.style.marginLeft = "100vw";
        main.addEventListener("transitionend", () => location.href = destination);

    }
});