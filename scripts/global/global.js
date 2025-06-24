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