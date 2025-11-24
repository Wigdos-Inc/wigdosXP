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
let tabCounter = 1; // Start counter after the initial 1 tab

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
    <div class="google-2003-page">
      <div class="google-2003-header">
        <div class="google-2003-topbar">
          <div class="google-2003-logo-text">WiggleSearch</div>
          <div class="google-2003-links">
            <a href="#" onclick="alert('Coming Soon!'); return false;">Advanced Search</a>
            <a href="#" onclick="alert('Coming Soon!'); return false;">Preferences</a>
            <a href="#" onclick="alert('Coming Soon!'); return false;">Language Tools</a>
            <a href="#" onclick="alert('Coming Soon!'); return false;">Search Tips</a>
          </div>
        </div>
        <div class="google-2003-search-area">
          <input type="text" class="google-2003-search-input" placeholder="">
          <button class="google-2003-search-btn">WiggleSearch</button>
        </div>
        <div class="google-2003-nav">
          <a href="#" class="google-2003-nav-link" onclick="alert('Coming Soon!'); return false;">Images</a>
          <a href="#" class="google-2003-nav-link" onclick="alert('Coming Soon!'); return false;">Groups</a>
          <a href="#" class="google-2003-nav-link" onclick="alert('Coming Soon!'); return false;">Directory</a>
          <a href="#" class="google-2003-nav-link" onclick="alert('Coming Soon!'); return false;">News</a>
        </div>
      </div>
      <div class="google-2003-results">
        <div class="google-2003-results-info">
          Searched the web for <b>COOL SITES</b>
        </div>
        <div class="google-2003-result">
          <div class="google-2003-result-header">
            <a href="#" class="google-2003-result-title" onclick="navigateToWigTube('${tabId}'); return false;">Wigtube</a>
            <span class="google-2003-sponsored">Sponsored Link</span>
          </div>
          <div class="google-2003-result-url">www.wigtube.com</div>
          <div class="google-2003-result-desc">WIGTUBEEEEEEEEEEEEEEEEEE</div>
        </div>
        <div class="google-2003-result">
          <div class="google-2003-result-header">
            <a href="#" class="google-2003-result-title" onclick="navigateToWiano('${tabId}'); return false;">Wiano - Free Online Piano</a>
            <span class="google-2003-sponsored">Sponsored Link</span>
          </div>
          <div class="google-2003-result-url">www.wiano.com</div>
          <div class="google-2003-result-desc">Play beautiful piano music right in your browser! Full keyboard support with sustain pedal. piano go weeeeeeee</div>
        </div>
        <div class="google-2003-result">
          <div class="google-2003-result-header">
            <a href="#" class="google-2003-result-title" onclick="alert('Coming Soon!'); return false;">67 </a>
          </div>
          <div class="google-2003-result-snippet">
             ...
          </div>
          <div class="google-2003-result-meta">
            <span class="google-2003-result-url">www.placeholder.com/Placeholder.html</span>
            <span class="google-2003-result-size">24k</span>
            <span class="google-2003-result-date">Oct 10, 2003</span>
            <a href="#" onclick="alert('Cached view coming soon!'); return false;">Cached</a>
            <a href="#" onclick="alert('Similar pages coming soon!'); return false;">Similar pages</a>
          </div>
        </div>
        <div class="google-2003-result">
          <div class="google-2003-result-header">
            <a href="#" class="google-2003-result-title" onclick="alert('Coming Soon!'); return false;">placeholder</a>
          </div>
          <div class="google-2003-result-snippet">
           ...
          </div>
          <div class="google-2003-result-meta">
            <span class="google-2003-result-url">www.placeholder.com/placeholder/placeholder.html</span>
            <span class="google-2003-result-size">47k</span>
            <a href="#" onclick="alert('Cached view coming soon!'); return false;">Cached</a>
            <a href="#" onclick="alert('Similar pages coming soon!'); return false;">Similar pages</a>
          </div>
        </div>
      </div>
      <div class="google-2003-footer">
        <div class="google-2003-pagination">
          <span class="google-2003-logo-small">WiggleSearch</span>
          <div class="google-2003-pages">
            <span>Result Page:</span>
            <a href="#" onclick="alert('Coming Soon!'); return false;">Previous</a>
            <span class="google-2003-page-current">1</span>
            <a href="#" class="google-2003-page-link" onclick="alert('Coming Soon!'); return false;">2</a>
          </div>
        </div>
      </div>
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
    const predefinedPages = ['wiggle-search'];
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
      if (tabIndex >= 1) { // Only for dynamically created tabs
        const pageId = `tab-${tabIndex + 1}`;
        const pageContent = document.getElementById(pageId);
        if (pageContent) {
          pageContent.remove();
        }
      }
      
      tabEl.remove();
      
      // Check if all tabs are closed - use a slight delay to ensure DOM has updated
      setTimeout(() => {
        const remainingTabs = scroll.querySelectorAll('.tab');
        console.log('Remaining tabs after close:', remainingTabs.length);
        
        if (remainingTabs.length === 0) {
          console.log('No tabs remaining, closing window...');
          // Close the WiggleSearch window by sending message to parent
          if (window.parent && window.parent !== window) {
            // We're in an iframe, send message to parent to close the window
            window.parent.postMessage({ action: 'closeWindow' }, '*');
          }
        } else if (isActive) {
          const next = scroll.querySelector('.tab');
          if (next) activate(next);
        }
      }, 0);
      
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

// Searchable items for autocomplete
const searchableItems = [
  { name: "WigTube", url: "wigtube", keywords: ["wigtube", "video", "tube", "wig", "wt"] },
  { name: "Wiano", url: "wiano", keywords: ["wiano", "piano", "music"] },
  { name: "Winesweeper", url: "winesweeper", keywords: ["winesweeper", "minesweeper", "wine", "game"] },
];

// Create and manage autocomplete dropdown
function setupAutocomplete(input) {
  // Create a wrapper if the input doesn't have one
  let wrapper = input.parentElement;
  
  // For google-2003-search-input, we need to wrap it properly
  if (input.classList.contains('google-2003-search-input')) {
    // Check if already wrapped
    if (!wrapper.classList.contains('search-input-wrapper')) {
      const newWrapper = document.createElement('div');
      newWrapper.className = 'search-input-wrapper';
      newWrapper.style.cssText = 'position: relative; display: inline-block;';
      
      input.parentElement.insertBefore(newWrapper, input);
      newWrapper.appendChild(input);
      wrapper = newWrapper;
    }
  }
  
  let dropdown = wrapper.querySelector('.autocomplete-dropdown');
  
  // Create dropdown if it doesn't exist
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      background: white;
      border: 2px inset #ddd;
      border-top: 2px solid #0055aa;
      max-height: 180px;
      overflow-y: auto;
      display: none;
      z-index: 10000;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      margin-top: -2px;
      box-sizing: border-box;
    `;
    
    // Ensure parent has relative positioning
    if (window.getComputedStyle(wrapper).position === 'static') {
      wrapper.style.position = 'relative';
    }
    
    wrapper.appendChild(dropdown);
  }
  
  input.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    
    if (query.length === 0) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }
    
    const matches = searchableItems.filter(item => {
      return item.name.toLowerCase().includes(query) ||
             item.keywords.some(keyword => keyword.includes(query));
    });
    
    if (matches.length === 0) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }
    
    dropdown.innerHTML = '';
    dropdown.style.display = 'block';
    
    matches.forEach(match => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #e0e0e0;
        font-family: 'Tahoma', sans-serif;
        font-size: 12px;
      `;
      item.textContent = match.name;
      
      item.addEventListener('mouseenter', function() {
        this.style.background = '#0055aa';
        this.style.color = 'white';
      });
      
      item.addEventListener('mouseleave', function() {
        this.style.background = 'white';
        this.style.color = 'black';
      });
      
      item.addEventListener('click', function() {
        input.value = match.name;
        dropdown.style.display = 'none';
        
        // Trigger search
        const pageContent = input.closest('.page-content');
        if (pageContent) {
          handleWiggleSearch(match.name, pageContent.id);
        }
      });
      
      dropdown.appendChild(item);
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
  
  // Handle arrow keys for navigation
  let selectedIndex = -1;
  
  input.addEventListener('keydown', function(e) {
    const items = dropdown.querySelectorAll('div');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelection(items, selectedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection(items, selectedIndex);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      items[selectedIndex].click();
      selectedIndex = -1;
    }
  });
  
  function updateSelection(items, index) {
    items.forEach((item, i) => {
      if (i === index) {
        item.style.background = '#0055aa';
        item.style.color = 'white';
      } else {
        item.style.background = 'white';
        item.style.color = 'black';
      }
    });
  }
}

// Initialize autocomplete for all search inputs
document.addEventListener('DOMContentLoaded', function() {
  // Setup for main search input
  const mainSearchInputs = document.querySelectorAll('.main-search-input');
  mainSearchInputs.forEach(input => setupAutocomplete(input));
  
  // Setup for Google 2003 search inputs
  const google2003Inputs = document.querySelectorAll('.google-2003-search-input');
  google2003Inputs.forEach(input => setupAutocomplete(input));
});

// Observe for dynamically added search inputs
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    mutation.addedNodes.forEach(function(node) {
      if (node.nodeType === 1) { // Element node
        // Check for main search inputs
        const mainInputs = node.querySelectorAll ? node.querySelectorAll('.main-search-input') : [];
        mainInputs.forEach(input => setupAutocomplete(input));
        
        // Check for Google 2003 search inputs
        const googleInputs = node.querySelectorAll ? node.querySelectorAll('.google-2003-search-input') : [];
        googleInputs.forEach(input => setupAutocomplete(input));
        
        // Check if the node itself is a search input
        if (node.classList && (node.classList.contains('main-search-input') || node.classList.contains('google-2003-search-input'))) {
          setupAutocomplete(node);
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Handle Wiggle Search searches
document.addEventListener('click', (e) => {
  // Handle "Wiggle Search" button clicks
  if (e.target.classList.contains('search-btn') && e.target.textContent === 'Wiggle Search') {
    const pageContent = e.target.closest('.page-content');
    if (!pageContent) return;
    
    const input = pageContent.querySelector('.main-search-input');
    if (input && input.value.trim()) {
      handleWiggleSearch(input.value.trim(), pageContent.id);
    }
  }
});

// Handle Enter key in Wiggle Search inputs
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList.contains('main-search-input')) {
    const searchTerm = e.target.value.trim();
    const pageContent = e.target.closest('.page-content');
    
    if (searchTerm && pageContent) {
      handleWiggleSearch(searchTerm, pageContent.id);
    }
  }
});

function handleWiggleSearch(searchTerm, tabId) {
  const searchLower = searchTerm.toLowerCase();
  
  // Check searchable items
  const match = searchableItems.find(item => 
    item.name.toLowerCase() === searchLower ||
    item.keywords.includes(searchLower) ||
    item.url.toLowerCase() === searchLower
  );
  
  if (match) {
    if (match.url === 'wigtube') {
      navigateToWigTube(tabId);
    } else if (match.url === 'wiano' || match.url === 'winesweeper') {
      alert(`${match.name} is coming soon!`);
    } else {
      alert(`Navigating to ${match.name}...`);
    }
  } else {
    // Perform regular search
    performSearch(searchTerm, tabId);
  }
}

function navigateToWigTube(tabId) {
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Find the tab index
  const allTabs = document.querySelectorAll('.tab');
  const predefinedPages = ['wiggle-search', 'new-tab'];
  let tabIndex = predefinedPages.indexOf(tabId);
  
  // If it's a dynamic tab, calculate its position
  if (tabIndex === -1) {
    tabIndex = parseInt(tabId.replace('tab-', '')) - 1;
  }
  
  const activeTab = allTabs[tabIndex];
  
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    titleSpan.textContent = 'WigTube';
    faviconImg.src = 'assets/images/icons/48x/WigleTube.png';
  }
  
  // Load WigTube content
  tabContent.innerHTML = `<iframe src="apps/browser/pages/wigtube.html" style="width: 100%; height: 100%; border: none;"></iframe>`;
}

function navigateToWiano(tabId) {
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Find the tab index
  const allTabs = document.querySelectorAll('.tab');
  const predefinedPages = ['wiggle-search', 'new-tab'];
  let tabIndex = predefinedPages.indexOf(tabId);
  
  // If it's a dynamic tab, calculate its position
  if (tabIndex === -1) {
    tabIndex = parseInt(tabId.replace('tab-', '')) - 1;
  }
  
  const activeTab = allTabs[tabIndex];
  
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    titleSpan.textContent = 'Wiano Piano';
    faviconImg.src = 'assets/images/icons/32x/notes.png'; // Using notes icon as placeholder
  }
  
  // Load Wiano content
  tabContent.innerHTML = `<iframe src="apps/wiano/wiano.html" style="width: 100%; height: 100%; border: none;"></iframe>`;
}

function loadWiggleSearchInTab(tabId) {
  // If it's the new-tab (second tab), just switch to the first tab (wiggle-search)
  if (tabId === 'new-tab') {
    const firstTab = document.querySelector('.tab');
    if (firstTab) {
      firstTab.click();
    }
    return;
  }
  
  // For dynamic tabs, load Wiggle Search content
  const tabContent = document.getElementById(tabId);
  if (!tabContent) return;
  
  // Find the tab index
  const allTabs = document.querySelectorAll('.tab');
  const predefinedPages = ['wiggle-search', 'new-tab'];
  let tabIndex = predefinedPages.indexOf(tabId);
  
  // If it's a dynamic tab, calculate its position
  if (tabIndex === -1) {
    tabIndex = parseInt(tabId.replace('tab-', '')) - 1;
  }
  
  const activeTab = allTabs[tabIndex];
  
  if (activeTab) {
    const titleSpan = activeTab.querySelector('.title');
    const faviconImg = activeTab.querySelector('.favicon');
    titleSpan.textContent = 'Wiggle Search';
    faviconImg.src = 'assets/images/icons/32x/rBrowser.png';
  }
  
  // Load Wiggle Search content
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
    <div id="content">
      <h2>Enter the Secret Code</h2>
      <input type="text" id="codeInput" placeholder="Enter code here" />
      <button onclick="checkCode()">Submit</button>
    </div>
  `;
}

function performSearch(searchTerm, tabId) {
  // This function can be expanded to handle actual search functionality
  console.log('Searching for:', searchTerm, 'in tab:', tabId);
  // For now, just show an alert or could navigate to a search results page
  alert(`Searching for: ${searchTerm}`);
}

// Address bar functionality
document.addEventListener('DOMContentLoaded', () => {
  const addressInput = document.getElementById('addressInput');
  const addressGoBtn = document.querySelector('.address-go-btn');
  
  function handleAddressBarNavigation() {
    const input = addressInput.value.trim().toLowerCase();
    
    if (!input) return;
    
    // Get current active tab
    const activeTab = document.querySelector('.tab.active');
    const tabs = document.querySelectorAll('.tab');
    const tabIndex = Array.from(tabs).indexOf(activeTab);
    
    // Determine the page ID
    const predefinedPages = ['wiggle-search', 'new-tab'];
    let pageId;
    
    if (tabIndex < predefinedPages.length) {
      pageId = predefinedPages[tabIndex];
    } else {
      pageId = `tab-${tabIndex + 1}`;
    }
    
    // Check searchable items
    const match = searchableItems.find(item => 
      item.name.toLowerCase() === input ||
      item.keywords.includes(input) ||
      item.url.toLowerCase() === input
    );
    
    if (match) {
      if (match.url === 'wigtube') {
        navigateToWigTube(pageId);
        addressInput.value = 'wigtube.com';
      } else if (match.url === 'wiano' || match.url === 'winesweeper') {
        alert(`${match.name} is coming soon!`);
      } else {
        alert(`Navigating to ${match.name}...`);
      }
    } else {
      // For other searches or URLs
      alert(`Navigating to: ${input}`);
    }
  }
  
  // Handle Go button click
  if (addressGoBtn) {
    addressGoBtn.addEventListener('click', handleAddressBarNavigation);
  }
  
  // Handle Enter key in address bar
  if (addressInput) {
    addressInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleAddressBarNavigation();
      }
    });
  }
});

// Handle Google 2003 search button and input
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('google-2003-search-btn')) {
    const pageContent = e.target.closest('.page-content');
    if (!pageContent) return;
    
    const input = pageContent.querySelector('.google-2003-search-input');
    if (input && input.value.trim()) {
      handleGoogle2003Search(input.value.trim(), pageContent.id);
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList.contains('google-2003-search-input')) {
    const searchTerm = e.target.value.trim();
    const pageContent = e.target.closest('.page-content');
    
    if (searchTerm && pageContent) {
      handleGoogle2003Search(searchTerm, pageContent.id);
    }
  }
});

function handleGoogle2003Search(searchTerm, tabId) {
  const searchLower = searchTerm.toLowerCase();
  
  // Check searchable items
  const match = searchableItems.find(item => 
    item.name.toLowerCase() === searchLower ||
    item.keywords.includes(searchLower) ||
    item.url.toLowerCase() === searchLower
  );
  
  if (match) {
    if (match.url === 'wigtube') {
      navigateToWigTube(tabId);
    } else if (match.url === 'wiano') {
      navigateToWiano(tabId);
    } else if (match.url === 'winesweeper') {
      alert(`${match.name} is coming soon!`);
    } else {
      alert(`Navigating to ${match.name}...`);
    }
  } else {
    // Perform regular search
    alert(`Searching for: ${searchTerm}`);
  }
}