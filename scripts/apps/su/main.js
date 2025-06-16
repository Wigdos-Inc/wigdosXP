const arrows = {
    top: document.getElementById("topArrow"),
    left: document.getElementById("leftArrow"),
    right: document.getElementById("right")
}



document.addEventListener("mousemove", (event) => {

    if      (event.clientY < 200)                     screenMove("down");
    else if (event.clientX < 200)                     screenMove("right");
    else if (event.clientX > window.innerWidth - 200) screenMove("left");
});


console.log(window.innerWidth);


function screenMove(direction) {

    if (document.title.includes("Hub")) return;

    switch (direction) {

        case "down": document.body.style.marginTop = "200px"; break;
        case "left": document.body.style.marginRight = "200px"; break;
        case "right": document.body.style.marginLeft = "200px"; break;
    }
}