    function checkCode() {
      const input = document.getElementById("codeInput").value;
      const secretCode = "T.V. TIME!!!"; // code here, for the functionalities under here to work
      const gif = document.getElementById("gif");
      const music = document.getElementById("music");
      const video = document.getElementById("bgVideo");
      const body = document.body;

      if (input === secretCode) {
        gif.style.display = "block";
        body.classList.remove("default-bg");

       
        video.src = "assets/mp4/TENNA BATTLE THEME DELTARUNE CHAPTER 3.mp4"; 
        video.style.display = "block";
        video.play();

       
        music.play();

        music.onended = function () {
          gif.style.display = "none";
          video.style.display = "none";
          video.pause();
          video.currentTime = 0;
          body.classList.add("default-bg");
        };
      } else {
        alert("❌ Incorrect code.");
      }
    }