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
    video: "assets/videos/steve.mp4",
    audio: "assets/music/C418 - Living Mice - Minecraft Volume Alpha.mp3",
    gif: "assets/gifs/misc/steve.gif"
  },
  "criminal": {
    video: "assets/videos/criminal.mp4",
    audio: "assets/sfx/criminal.mp3",
    gif: ""
  },
  "nword": {
    video: "assets/videos/Nword.mp4",
    audio: "assets/audio/music/Nword.mp3",
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
  const content = document.getElementById("content");

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
    // XP-style error sound and dialog
    const errorsound = new Audio("assets/audio/system/error.mp3");
    errorsound.play().catch(() => {
      // Fallback if audio doesn't load
      console.log("Error sound failed to play");
    });
    
    // XP-style alert
    setTimeout(() => {
      alert("❌ Access Denied\n\nThe secret code you entered is invalid.\n\nPlease verify the code and try again.\n\nFor technical support, contact your system administrator.");
    }, 100);
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
const bInputs = document.getElementsByClassName("main-search-input");

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
      // Play XP startup sound
      const startupSound = new Audio("assets/audio/system/startup.mp3");
      startupSound.play().catch(() => {
        console.log("Startup sound failed to play");
      });
      
      // Reveal input box with XP-style notification
      setTimeout(() => {
        document.getElementById("content").style.display = "block";
        secretsActive = true;
      }, 200);
    }
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") pressArrow("ArrowUp");
  else if (event.key === "ArrowRight") pressArrow("ArrowRight");
  else if (event.key === "ArrowDown") pressArrow("ArrowDown");
  else if (event.key === "ArrowLeft") pressArrow("ArrowLeft");
});

// Page switching functionality
let tabCounter = 3; // Start counter after the initial 3 tabs

function switchToPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show the requested page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }
}

function createNewTabContent(tabId) {
  const newTabDiv = document.createElement('div');
  newTabDiv.id = tabId;
  newTabDiv.className = 'page-content';
  newTabDiv.innerHTML = `
    <div class="new-tab-page">
      <h1>New Tab ${tabId.replace('tab-', '')}</h1>
      <p>This is a fresh new tab! Choose what you'd like to do:</p>
      <div class="quick-links">
        <div class="quick-link" onclick="loadPageInTab('${tabId}', 'wiggle-search')">
          <img src="../.././assets/images/icons/32x/rBrowser.png" alt="Search">
          <span>Wiggle Search</span>
        </div>
        <div class="quick-link" onclick="loadPageInTab('${tabId}', 'wigtube')">
          <img src="../.././assets/images/icons/48x/WigleTube.png" alt="WigTube">
          <span>WigTube</span>
        </div>
  `;
  
  document.getElementById('appMain').appendChild(newTabDiv);
  return newTabDiv;
}

function loadPageInTab(tabId, pageType) {
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Update tab title
  const tabs = document.querySelectorAll('.tab');
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    // fuckass shitass iframes or sum shi
    switch(pageType) {
      case 'wiggle-search':
        titleSpan.textContent = 'Wiggle Search';
        faviconImg.src = 'assets/images/icons/32x/rBrowser.png';
        tabContent.innerHTML = `
          <div class="google-layout">
            <img src="../.././assets/images/icons/48x/rBrowser.png" draggable="false" class="logo">
            <div class="search-section">
              <div class="search-box-container">
                <input type="text" class="main-search-input" placeholder="Search...">
              </div>
              <div class="search-buttons">
                <button class="search-btn">Wiggle Search</button>
                <button class="search-btn">GAMBLING</button>
              </div>
            </div>
          </div>
        `;
        break;
      case 'wigtube':
        titleSpan.textContent = 'WigTube';
        faviconImg.src = 'assets/images/icons/48x/WigleTube.png';
        tabContent.innerHTML = `<iframe src="apps/browser/pages/wigtube.html" style="width: 100%; height: 100%; border: none;"></iframe>`;
        break;
    }
  }
  
  // Show this tab's content
  switchToPage(tabId);
}

// beginning of the tab code
// Minimal behavior: toggle active tab, add/remove fake tabs (visual only)
(function() {
  const tabstrip = document.querySelector('.tabstrip');
  if (!tabstrip) return;
  const scroll = tabstrip.querySelector('.tabs-scroll');
  const addBtn = tabstrip.querySelector('.tab-action.add');

  function activate(tab) {
    const tabIndex = Array.from(scroll.children).indexOf(tab);
    
    // Update tab states
    tabstrip.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    
    // Switch to corresponding page
    const predefinedPages = ['wiggle-search', 'wigtube', 'new-tab'];
    let pageId;
    
    if (tabIndex < predefinedPages.length) {
      pageId = predefinedPages[tabIndex];
    } else {
      // For dynamically created tabs, use tab-X format
      pageId = `tab-${tabIndex + 1}`;
    }
    
    switchToPage(pageId);
  }

  tabstrip.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.close');
    const tabEl = e.target.closest('.tab');
    
    if (closeBtn && tabEl) {
      const isActive = tabEl.classList.contains('active');
      const tabIndex = Array.from(scroll.children).indexOf(tabEl);
      
      // Remove corresponding page content for dynamic tabs
      if (tabIndex >= 3) { // Only for dynamically created tabs
        const pageId = `tab-${tabIndex + 1}`;
        const pageContent = document.getElementById(pageId);
        if (pageContent) {
          pageContent.remove();
        }
      }
      
      tabEl.remove();
      
      if (isActive) {
        const next = scroll.querySelector('.tab');
        if (next) activate(next);
      }
      return;
    }
    
    if (tabEl) {
      activate(tabEl);
    }
  });

  addBtn?.addEventListener('click', () => {
    tabCounter++;
    const newTabId = `tab-${tabCounter}`;
    
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.innerHTML = `
      <img class="favicon" src="assets/images/icons/32x/rBrowser.png" alt="" aria-hidden="true"/>
      <span class="title">New Tab</span>
      <span class="close" aria-hidden="true">✕</span>
    `;
    
    // Create corresponding page content
    createNewTabContent(newTabId);
    
    scroll.appendChild(btn);
    activate(btn);
    btn.scrollIntoView({ inline: 'end', behavior: 'smooth' });
  });
})();