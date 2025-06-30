  const secrets = {
      "tv time": {
        video: "assets/mp4/TENNA BATTLE THEME DELTARUNE CHAPTER 3.mp4",
        audio: "assets/music/27. Its TV Time! (DELTARUNE Chapter 34 Soundtrack) - Toby Fox.mp3",
        gif: "assets/secrets/gif/tenna.gif"
      },
      //where the "Asgore" is placed at will be the code that will need to be inputted
      "asgore": {
        video: "assets/mp4/Asgore runs over Dess.mp4",
        audio: "assets/mp4/Asgore runs over Dess.mp4",
        gif: ""
      },

      "github": {
        video: "assets/mp4/Far Cry New Dawn release me.mp4",
        audio: "assets/music/Buddy Holly but just the riff.mp3",
        gif: ""
      },
      "disturbing the peace": {
        video: "assets/mp4/Persona 5 - Opening Cinematic.mp4",
        audio: "assets/music/It's Going Down Now.mp3",
        gif: "assets/secrets/gif/haru-haru-okumura.gif"
      },
      "steve": {
        video: "assets/mp4/steve.mp4",
        audio: "assets/music/C418 - Living Mice - Minecraft Volume Alpha.mp3",
        gif: "assets/secrets/gif/steve.gif"
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
          window.alert("Reset");
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