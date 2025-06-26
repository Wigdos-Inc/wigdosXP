  const secrets = {
      "T.V. TIME!!!": {
        video: "assets/mp4/TENNA BATTLE THEME DELTARUNE CHAPTER 3.mp4",
        audio: "assets/music/27. Its TV Time! (DELTARUNE Chapter 34 Soundtrack) - Toby Fox.mp3",
        gif: "assets/secrets/gif/tenna.gif"
      },
      //where the "Asgore" is placed at will be the code that will need to be inputted
      "Asgore": {
        video: "assets/mp4/Asgore runs over Dess.mp4",
        audio: "assets/mp4/Asgore runs over Dess.mp4",
        gif: ""
      },

      "Github": {
        video: "assets/mp4/Far Cry New Dawn release me.mp4",
        audio: "assets/music/Buddy Holly but just the riff.mp3",
        gif: ""
      },
      // add for more secrets
    };

    function checkCode() {
      const input = document.getElementById("codeInput").value.trim();
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
        alert("❌ Incorrect code.");
      }
    }