/* Redirects */

index = () => location.href = "index.html";
creature = () => location.href = "pages/creature.html";
wiggleSearch = () => location.href = "pages/browser/fuzzy1.html";

// Bombs
c4       = () => location.href = "pages/bombs/c4.html";
dynamite = () => location.href = "pages/bombs/dynamite.html";
modular  = () => location.href = "pages/bombs/modular.html";
nuke     = () => location.href = "pages/bombs/nuke.html";



/* Loading SFX */

function playerrorSound() {

    // Returns the Audio to what Called the Function, Allowing Onended to be Used There
    return new Promise((resolve) => {

        const audio = new Audio('assets/sfx/Windows XP Error Sound.mp3');
        audio.play();

        audio.onended = () => resolve(audio);
    });
}

try {
} catch (error) {
    console.error(error.message);
    playerrorSound(); 
}