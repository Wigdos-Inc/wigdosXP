/**
 * Controls Module
 * UI controls for velocity, sustain, transpose, piano types, and settings
 */

export class Controls {
  constructor(audioEngine, pianoUI) {
    this.audioEngine = audioEngine;
    this.pianoUI = pianoUI;
    this.container = null;
  }

  /**
   * Initialize controls panel
   */
  initialize() {
    this.createControlPanel();
    this.createPianoTypeBar();
    this.createUIModeBar();
    console.log('[Controls] Initialized');
  }

  /**
   * Create main control panel
   */
  createControlPanel() {
    const panel = document.createElement('div');
    panel.className = 'controls-panel';
    panel.innerHTML = `
      <div class="control-group">
        <label>
          <span>🎚️ Velocity Mode:</span>
          <select id="velocity-mode">
            <option value="dynamic">Dynamic</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
        <label id="fixed-velocity-group" style="display:none;">
          <span>Fixed Velocity:</span>
          <input type="range" id="fixed-velocity" min="0.1" max="1" step="0.05" value="0.6">
          <span id="fixed-velocity-val">0.60</span>
        </label>
      </div>

      <div class="control-group">
        <label>
          <span>🎹 Transpose:</span>
          <input type="range" id="transpose" min="-12" max="12" step="1" value="0">
          <span id="transpose-val">0</span>
        </label>
      </div>

      <div class="control-group">
        <label>
          <span>🔊 Volume:</span>
          <input type="range" id="master-volume" min="0" max="1" step="0.05" value="0.7">
          <span id="volume-val">70%</span>
        </label>
      </div>

      <div class="control-group">
        <button id="sustain-lock-btn" class="control-btn">
          <span id="sustain-lock-icon">🔓</span> Sustain Lock
        </button>
        <button id="clear-all-btn" class="control-btn secondary">
          🔕 Stop All Notes
        </button>
      </div>
    `;

    document.body.appendChild(panel);
    this.container = panel;
    this.wireControlEvents();
  }

  /**
   * Wire control panel events
   */
  wireControlEvents() {
    // Velocity mode
    const velocityMode = document.getElementById('velocity-mode');
    const fixedVelocityGroup = document.getElementById('fixed-velocity-group');
    const fixedVelocity = document.getElementById('fixed-velocity');
    const fixedVelocityVal = document.getElementById('fixed-velocity-val');

    velocityMode.addEventListener('change', (e) => {
      const mode = e.target.value;
      this.pianoUI.setVelocityMode(mode, parseFloat(fixedVelocity.value));
      
      if (mode === 'fixed') {
        fixedVelocityGroup.style.display = 'flex';
      } else {
        fixedVelocityGroup.style.display = 'none';
      }
    });

    fixedVelocity.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      fixedVelocityVal.textContent = val.toFixed(2);
      this.pianoUI.setVelocityMode('fixed', val);
    });

    // Transpose
    const transpose = document.getElementById('transpose');
    const transposeVal = document.getElementById('transpose-val');

    transpose.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      transposeVal.textContent = val > 0 ? `+${val}` : val;
      this.pianoUI.setTranspose(val);
    });

    // Volume
    const volume = document.getElementById('master-volume');
    const volumeVal = document.getElementById('volume-val');

    volume.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      volumeVal.textContent = `${Math.round(val * 100)}%`;
      this.audioEngine.setVolume(val);
    });

    // Sustain lock
    const sustainLockBtn = document.getElementById('sustain-lock-btn');
    const sustainLockIcon = document.getElementById('sustain-lock-icon');

    sustainLockBtn.addEventListener('click', () => {
      const locked = this.pianoUI.toggleSustainLock();
      sustainLockIcon.textContent = locked ? '🔒' : '🔓';
      sustainLockBtn.classList.toggle('active', locked);
      
      this.showNotification(
        locked ? 'Sustain Locked 🔒' : 'Sustain Unlocked 🔓',
        locked ? 'All notes will sustain indefinitely' : 'Normal sustain mode'
      );
    });

    // Clear all
    const clearAllBtn = document.getElementById('clear-all-btn');
    clearAllBtn.addEventListener('click', () => {
      this.audioEngine.releaseAllNotes();
      this.pianoUI.sustainedNotes.clear();
      this.pianoUI.activeNoteMap.clear();
      
      // Clear visual highlights
      document.querySelectorAll('.key.pressed').forEach(key => {
        key.classList.remove('pressed');
      });
      
      this.showNotification('All Notes Stopped 🔕', 'Audio cleared');
    });
  }

  /**
   * Create piano type selection bar
   */
  createPianoTypeBar() {
    const bar = document.createElement('div');
    bar.className = 'piano-type-bar';
    
    const types = this.audioEngine.getPianoTypes();
    
    bar.innerHTML = `
      <div class="type-label">Piano Type:</div>
      ${Object.entries(types).map(([key, type]) => `
        <button class="type-btn ${key === 'grand' ? 'active' : ''}" data-type="${key}">
          <span class="type-icon">${type.icon}</span>
          <span class="type-name">${type.name}</span>
        </button>
      `).join('')}
    `;
    
    document.body.appendChild(bar);
    
    // Wire events
    bar.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.audioEngine.switchPianoType(type);
        
        // Update active state
        bar.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show notification
        const typeInfo = types[type];
        this.showNotification(
          `${typeInfo.icon} ${typeInfo.name}`,
          'Piano type changed'
        );
      });
    });
  }

  /**
   * Create UI mode bar (dark mode, simple mode, etc.)
   */
  createUIModeBar() {
    const bar = document.createElement('div');
    bar.className = 'ui-mode-bar';
    bar.innerHTML = `
      <button id="dark-mode-btn" class="mode-btn">
        <span id="dark-mode-icon">🌙</span> Dark Mode
      </button>
      <button id="simple-mode-btn" class="mode-btn">
        <span id="simple-mode-icon">✨</span> Simple Mode
      </button>
    `;
    
    document.body.appendChild(bar);
    
    // Dark mode
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const darkModeIcon = document.getElementById('dark-mode-icon');
    let darkMode = false;

    darkModeBtn.addEventListener('click', () => {
      darkMode = !darkMode;
      document.body.classList.toggle('dark', darkMode);
      darkModeIcon.textContent = darkMode ? '☀️' : '🌙';
      darkModeBtn.classList.toggle('active', darkMode);
      
      localStorage.setItem('wiano-dark-mode', darkMode);
    });

    // Restore dark mode preference
    if (localStorage.getItem('wiano-dark-mode') === 'true') {
      darkModeBtn.click();
    }

    // Simple mode (hides advanced controls)
    const simpleModeBtn = document.getElementById('simple-mode-btn');
    const simpleModeIcon = document.getElementById('simple-mode-icon');
    let simpleMode = false;

    simpleModeBtn.addEventListener('click', () => {
      simpleMode = !simpleMode;
      document.body.classList.toggle('simple', simpleMode);
      simpleModeIcon.textContent = simpleMode ? '🎛️' : '✨';
      simpleModeBtn.classList.toggle('active', simpleMode);
      
      // Hide/show advanced panels
      const panels = ['.eq-panel', '.note-block'];
      panels.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.style.display = simpleMode ? 'none' : '';
      });
      
      localStorage.setItem('wiano-simple-mode', simpleMode);
    });

    // Restore simple mode preference
    if (localStorage.getItem('wiano-simple-mode') === 'true') {
      simpleModeBtn.click();
    }
  }

  /**
   * Show notification popup
   */
  showNotification(title, message) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = `
      <div class="notif-title">${title}</div>
      <div class="notif-message">${message}</div>
    `;
    
    document.body.appendChild(notif);
    
    // Animate in
    setTimeout(() => notif.classList.add('visible'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notif.classList.remove('visible');
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.container) {
      this.container.remove();
    }
  }
}
