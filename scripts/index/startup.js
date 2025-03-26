/* Startup */

window.onload = () => {

    if (sessionStorage.getItem("loaded")) load();
    else {

        const powerOn = document.body.appendChild(document.createElement("div")); powerOn.classList.add("powerOn");
        const powerOnBtn = powerOn.appendChild(document.createElement("img")); powerOnBtn.classList.add("powerOptionBox"); powerOnBtn.id = "powerOnBtn";
        powerOnBtn.src = "../../assets/images/icons/32x/power.png";

        const creature = powerOn.appendChild(document.createElement("img"));
        creature.src = "../../assets/images/icons/48x/creature.png";
        creature.style.position = "absolute";
        creature.style.width = "80%";
        creature.style.opacity = "0.02";
        creature.style.pointerEvents = "none";


        powerOnBtn.onclick = () => {
            
            creature.remove();
            powerOn.remove();
            
            load();
        }

    }
    
}



/* Loading */

function load() {

    if (!sessionStorage.getItem("loaded")) {

        const loader = document.body.appendChild(document.createElement("div")); loader.classList.add("loader");
        loader.style.visibility = "unset";

        setTimeout(() => {
            document.getElementsByTagName("main")[0].style.opacity = 1;
            document.getElementsByTagName("footer")[0].style.opacity = 1;
        }, 500);    

        setTimeout(() => {
            audio.play();
            loader.classList.add("loader-hidden");

            loader.addEventListener("transitionend", () => loader.remove());
            sessionStorage.setItem("loaded", true);
        }, 3700); 

    }
    else {
        document.getElementsByTagName("main")[0].style.opacity = 1;
        document.getElementsByTagName("footer")[0].style.opacity = 1;
    }
};