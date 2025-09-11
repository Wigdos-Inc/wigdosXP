  const secrets = {
      "tv time": {
        video: "assets/mp4/TENNA BATTLE THEME DELTARUNE CHAPTER 3.mp4",
        audio: "assets/music/27. Its TV Time! (DELTARUNE Chapter 34 Soundtrack) - Toby Fox.mp3",
        gif: "assets/secrets/gif/tenna.gif"
      },
      //where the "Asgore" is placed at will be the code that will need to be inputted
      "asgore": {
        video: "assets/videos/bergentruck.mp4",
        audio: "assets/videos/bergentruck.mp4",
        gif: ""
      },

      "github": {
        video: "assets/videos/far.mp4",
        audio: "assets/audio/misc/buddy_holly_riff.mp3",
        gif: ""
      },
      "disturbing the peace": {
        video: "assets/videos/persona5_opening.mp4",
        audio: "assets/audio/music/going_down.mp3",
        gif: "assets/gifs/misc/haru_okumura.gif"
      },
      "steve": {
        video: "assets/mp4/steve.mp4",
        audio: "assets/music/C418 - Living Mice - Minecraft Volume Alpha.mp3",
        gif: "assets/gifs/misc/steve.gif"
      },
      "criminal": {
        video: "assets/mp4/criminal.mp4",
        audio: "assets/sfx/criminal.mp3",
        gif: ""
      },
      // add for more secrets
    };

    function checkCode() {
      const input = document.getElementById("codeInput").value.trim().toLowerCase();
      const secret = secrets[input];
      const gif = document.getElementById("gif");
      const music = document.getElementById("music");
      const video = document.getElementById("bgVideo");

      if (secret) {
        // Set media sources :<
        video.src = secret.video;
        music.src = secret.audio;
        gif.src = secret.gif;

        // Show video and gif :>
        video.style.display = "block";
        gif.style.display = "block";

        video.play();
        music.play();

        // Stop everything when MUUUUUUUUUUUUSIC ENDS
        music.onended = () => {
          gif.style.display = "none";
          video.style.display = "none";
          video.pause();
          video.currentTime = 0;
        };
      } else {
        const errorsound = new Audio("/assets/sfx/deltarune splat sfx.mp3");
        errorsound.play()
        
        alert("❌ Incorrect code.");
      }
    }

// Konami sequence logic (with buttons)
  const konamiSequence = [
    "ArrowUp", "ArrowUp",
    "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight",
    "ArrowLeft", "ArrowRight"
  ];
  let userInput = [];
  let secretsActive = false;
  const bInputs = document.getElementsByClassName("search-input");

  function pressArrow(direction) {
    if (!secretsActive && document.activeElement !== bInputs[0] && document.activeElement !== bInputs[1]) {
      userInput.push(direction); 
      console.log(direction, userInput, konamiSequence);

      userInput.forEach((input, index) => {
        if (input != konamiSequence[index]) {
          userInput = [];
        
        }
      });
      userInput = userInput.slice(-konamiSequence.length);

      if (userInput.join() === konamiSequence.join()) {
        // Reveal input box and hide arrow buttons
        document.getElementById("content").style.display = "block";
        secretsActive = true;
      }
    }
  }

  document.addEventListener("keydown", (event) => {

    let input = false;
    if (event.key === "ArrowUp") pressArrow("ArrowUp");
    else if (event.key === "ArrowRight") pressArrow("ArrowRight");
    else if (event.key === "ArrowDown") pressArrow("ArrowDown");
    else if (event.key === "ArrowLeft") pressArrow("ArrowLeft");
  });

  function checkCode() {
  const input = document.getElementById("codeInput").value.trim().toLowerCase();
  const secret = secrets[input];
  const gif = document.getElementById("gif");
  const music = document.getElementById("music");
  const video = document.getElementById("bgVideo");
  const content = document.getElementById("content"); // Add this to control visibility

  if (secret) {
    // Hide input while secret is playing
    content.style.display = "none";

    // Set media sources
    video.src = secret.video;
    music.src = secret.audio;
    gif.src = secret.gif;

    // Show video and gif
    video.style.display = "block";
    gif.style.display = secret.gif ? "block" : "none";

    video.play();
    music.play();

    music.onended = () => {
      // Hide media when finished
      gif.style.display = "none";
      video.style.display = "none";
      video.pause();
      video.currentTime = 0;

      // Show input again
      content.style.display = "block";
    };
  } else {
    const errorsound = new Audio("/assets/sfx/deltarune splat sfx.mp3");
    errorsound.play();
    alert("❌ Incorrect code.");
  }
}