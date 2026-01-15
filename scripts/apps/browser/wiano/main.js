/**
 * Wiano - Main Application Module
 * Coordinates all modules and handles initialization
 */

import { AudioEngine } from './audio-engine.js';
import { PianoUI } from './piano-ui.js';
import { Controls } from './controls.js';
import { Visualization } from './visualization.js';
import { SheetMusic } from './sheet-music.js';

class Wiano {
  constructor() {
    this.audioEngine = null;
    this.pianoUI = null;
    this.controls = null;
    this.visualization = null;
    this.sheetMusic = null;
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('[Wiano] Starting initialization...');
      
      // Show start overlay
      this.showStartOverlay();
      
      // Initialize audio engine
      this.audioEngine = new AudioEngine();
      
      // Initialize UI modules (they don't need audio yet)
      this.pianoUI = new PianoUI(this.audioEngine);
      this.controls = new Controls(this.audioEngine, this.pianoUI);
      this.visualization = new Visualization(this.audioEngine);
      this.sheetMusic = new SheetMusic(this.audioEngine, this.pianoUI);
      
      // Render UI
      this.pianoUI.initialize();
      this.controls.initialize();
      this.visualization.initialize();
      
      // Add instructions
      this.showInstructions();
      
      // Create notes block
      this.createNotesBlock();
      
      // Add sheet music button
      this.addSheetMusicButton();
      
      this.initialized = true;
      console.log('[Wiano] UI initialized, waiting for user interaction to start audio...');
      
    } catch (error) {
      console.error('[Wiano] Initialization error:', error);
      alert('Failed to initialize Wiano. Please refresh the page.');
    }
  }

  /**
   * Show start overlay that initializes audio on click
   */
  showStartOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'start-overlay';
    overlay.innerHTML = `
      <div class="start-content">
        <h1>🎹 Wiano</h1>
        <p>Free Online Piano</p>
        <button id="start-btn" class="start-button">Click to Start</button>
        <p class="start-hint">Audio will be initialized after clicking</p>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', async () => {
      startBtn.disabled = true;
      startBtn.textContent = '⏳ Loading...';
      
      try {
        // Initialize audio
        await this.audioEngine.initialize();
        
        // Initialize sheet music panel
        this.sheetMusic.initialize();
        
        // Remove overlay
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
        
        console.log('[Wiano] Fully initialized!');
      } catch (error) {
        console.error('[Wiano] Audio initialization failed:', error);
        alert('Failed to initialize audio. Please check your browser permissions.');
        startBtn.disabled = false;
        startBtn.textContent = 'Click to Start';
      }
    });
  }

  /**
   * Show instructions
   */
  showInstructions() {
    const instructions = document.createElement('p');
    instructions.innerHTML = `
      🎹 <strong>Play with keyboard:</strong> Keys 1-9, Q-P, A-L, Z-M for notes. 
      <strong>Spacebar</strong> for sustain pedal. 
      Or click/tap the piano keys!
    `;
    document.body.insertBefore(instructions, document.body.firstChild);
    
    const title = document.createElement('h1');
    title.textContent = '🎹 Wiano - Free Online Piano';
    document.body.insertBefore(title, document.body.firstChild);
  }

  /**
   * Create notes block for user notes
   */
  createNotesBlock() {
    const block = document.createElement('div');
    block.className = 'note-block';
    block.innerHTML = `
      <header>
        <span class="icon">📝</span>
        Notes & Ideas
      </header>
      <textarea id="user-notes" placeholder="Write your notes, song ideas, or chord progressions here..."></textarea>
      <div class="note-actions">
        <span class="saved-indicator" id="save-indicator">✓ Saved</span>
        <button id="clear-notes">Clear Notes</button>
      </div>
    `;
    
    document.body.appendChild(block);
    
    // Auto-save functionality
    const notesArea = document.getElementById('user-notes');
    const saveIndicator = document.getElementById('save-indicator');
    
    // Load saved notes
    const savedNotes = localStorage.getItem('wiano-notes');
    if (savedNotes) {
      notesArea.value = savedNotes;
    }
    
    // Debounced save
    let saveTimeout;
    notesArea.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        localStorage.setItem('wiano-notes', notesArea.value);
        saveIndicator.classList.add('visible');
        setTimeout(() => saveIndicator.classList.remove('visible'), 2000);
      }, 500);
    });
    
    // Clear button
    document.getElementById('clear-notes').addEventListener('click', () => {
      if (confirm('Clear all notes?')) {
        notesArea.value = '';
        localStorage.removeItem('wiano-notes');
      }
    });
  }

  /**
   * Add sheet music button
   */
  addSheetMusicButton() {
    const button = document.createElement('button');
    button.className = 'floating-btn';
    button.innerHTML = '🎼 Sheet Music';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    `;
    
    button.addEventListener('click', () => {
      if (this.sheetMusic) {
        this.sheetMusic.toggle();
      }
    });
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
    });
    
    document.body.appendChild(button);
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.audioEngine) this.audioEngine.dispose();
    if (this.pianoUI) this.pianoUI.dispose();
    if (this.controls) this.controls.dispose();
    if (this.visualization) this.visualization.dispose();
    if (this.sheetMusic) this.sheetMusic.dispose();
    
    this.initialized = false;
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new Wiano();
  app.initialize();
  
  // Make available globally for debugging
  window.wiano = app;
});

// Prevent context menu
document.addEventListener('contextmenu', e => e.preventDefault());

// Hide loader
const loader = document.getElementById('loader');
if (loader) {
  loader.style.display = 'none';
}
