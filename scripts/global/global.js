/* Redirects */

index = () => location.href = "index.html";
creature = () => location.href = "apps/bombs/creature.html";
wiggleSearch = () => location.href = "apps/browser/fuzzy1.html";

// Bombs
c4       = () => location.href = "apps/bombs/c4.html";
dynamite = () => location.href = "apps/bombs/dynamite.html";
modular  = () => location.href = "apps/bombs/modular.html";
nuke     = () => location.href = "apps/bombs/nuke.html";



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