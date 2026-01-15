/**
 * Piano UI Module
 * Handles keyboard rendering, visual feedback, and user interaction
 */

export class PianoUI {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.container = null;
    this.piano = null;
    
    // State
    this.pressedKeys = new Set();
    this.sustainedNotes = new Set();
    this.sustain = false;
    this.sustainLock = false;
    this.velocityMode = 'dynamic';
    this.fixedVelocity = 0.6;
    this.transpose = 0; // semitones
    this.activeNoteMap = new Map(); // original -> transposed
    
    // Key mapping
    this.keyMap = {
      '1': 'C3', '2': 'D3', '3': 'E3', '4': 'F3', '5': 'G3', '6': 'A3', '7': 'B3',
      '8': 'C4', '9': 'D4', '0': 'E4',
      'q': 'F4', 'w': 'G4', 'e': 'A4', 'r': 'B4', 't': 'C5', 'y': 'D5', 'u': 'E5',
      'i': 'F5', 'o': 'G5', 'p': 'A5',
      'a': 'B5', 's': 'C6', 'd': 'D6', 'f': 'E6', 'g': 'F6', 'h': 'G6', 'j': 'A6',
      'k': 'B6', 'l': 'C7',
      'z': 'D7', 'x': 'E7', 'c': 'F7', 'v': 'G7', 'b': 'A7', 'n': 'B7', 'm': 'C8',
      // Sharps/flats
      '!': 'C#3', '@': 'D#3', '$': 'F#3', '%': 'G#3', '^': 'A#3',
      '*': 'C#4', '(': 'D#4',
      'Q': 'F#4', 'W': 'G#4', 'E': 'A#4', 'T': 'C#5', 'Y': 'D#5',
      'I': 'F#5', 'O': 'G#5', 'P': 'A#5',
      'S': 'C#6', 'D': 'D#6', 'G': 'F#6', 'H': 'G#6', 'J': 'A#6',
      'L': 'C#7', 'Z': 'D#7', 'C': 'F#7', 'V': 'G#7', 'B': 'A#7'
    };
    
    // Reverse mapping: note -> key label
    this.noteToLabel = Object.entries(this.keyMap).reduce((acc, [key, note]) => {
      acc[note] = key;
      return acc;
    }, {});
    
    // Bind keyboard handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  /**
   * Initialize and render the piano
   */
  initialize() {
    this.createPiano();
    this.attachEventListeners();
    console.log('[PianoUI] Initialized');
  }

  /**
   * Create piano keyboard HTML
   */
  createPiano() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'piano-container';
    
    // Create piano element
    this.piano = document.createElement('div');
    this.piano.className = 'piano';
    
    // Generate white keys (C3 to C8)
    const whiteNotes = this.generateWhiteNotes();
    
    whiteNotes.forEach((note, index) => {
      const key = document.createElement('div');
      key.className = 'key white-key';
      key.dataset.note = note;
      
      const keyLabel = this.noteToLabel[note] || '';
      
      key.innerHTML = `
        <div class="key-label">${keyLabel}</div>
        <div class="note-label">${note}</div>
      `;
      
      // Mouse events
      key.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.playNote(note, this.computeVelocity(e));
      });
      
      key.addEventListener('mouseup', (e) => {
        e.preventDefault();
        this.releaseNote(note);
      });
      
      key.addEventListener('mouseleave', (e) => {
        if (e.buttons === 1) {
          this.releaseNote(note);
        }
      });
      
      // Touch events
      key.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.playNote(note, this.computeVelocity(e));
      });
      
      key.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.releaseNote(note);
      });
      
      this.piano.appendChild(key);
      
      // Add black key after this white key (if applicable)
      const blackNote = this.getBlackKeyAfter(note);
      if (blackNote) {
        const blackKey = document.createElement('div');
        blackKey.className = 'key black-key';
        blackKey.dataset.note = blackNote;
        blackKey.style.left = `${(index * 60) + 42}px`;
        
        const blackKeyLabel = this.noteToLabel[blackNote] || '';
        
        blackKey.innerHTML = `
          <div class="key-label">${blackKeyLabel}</div>
          <div class="note-label">${blackNote}</div>
        `;
        
        // Mouse events
        blackKey.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.playNote(blackNote, this.computeVelocity(e));
        });
        
        blackKey.addEventListener('mouseup', (e) => {
          e.preventDefault();
          this.releaseNote(blackNote);
        });
        
        blackKey.addEventListener('mouseleave', (e) => {
          if (e.buttons === 1) {
            this.releaseNote(blackNote);
          }
        });
        
        // Touch events
        blackKey.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.playNote(blackNote, this.computeVelocity(e));
        });
        
        blackKey.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.releaseNote(blackNote);
        });
        
        this.piano.appendChild(blackKey);
      }
    });
    
    this.container.appendChild(this.piano);
    document.body.appendChild(this.container);
  }

  /**
   * Generate white key notes from C3 to C8
   */
  generateWhiteNotes() {
    const notes = [];
    const scale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    
    for (let octave = 3; octave <= 8; octave++) {
      for (const noteName of scale) {
        notes.push(`${noteName}${octave}`);
        if (octave === 8 && noteName === 'C') break;
      }
    }
    
    return notes;
  }

  /**
   * Get black key that comes after a white key
   */
  getBlackKeyAfter(whiteNote) {
    const noteMap = {
      'C': '#', 'D': '#', 'F': '#', 'G': '#', 'A': '#'
    };
    
    const noteName = whiteNote.slice(0, -1);
    const octave = whiteNote.slice(-1);
    
    if (noteMap[noteName]) {
      return `${noteName}#${octave}`;
    }
    
    return null;
  }

  /**
   * Compute velocity from event
   */
  computeVelocity(e) {
    if (this.velocityMode === 'fixed') {
      return this.fixedVelocity;
    }
    
    // Dynamic velocity based on Y position (top = louder)
    if (e.offsetY !== undefined) {
      const rect = e.target.getBoundingClientRect();
      const y = e.offsetY;
      const height = rect.height;
      return 0.3 + (1 - (y / height)) * 0.7;
    }
    
    return 0.6;
  }

  /**
   * Play a note with transpose applied
   */
  playNote(note, velocity = 0.6, instrument = 0) {
    const transposedNote = this.transposeNote(note, this.transpose);
    
    this.highlightKey(note, true);
    this.audioEngine.playNote(transposedNote, velocity, undefined, instrument);
    this.activeNoteMap.set(note, transposedNote);
    
    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('wiano:noteon', {
      detail: { note, transposedNote, velocity, instrument }
    }));
  }

  /**
   * Release a note
   */
  releaseNote(note, instrument = 0) {
    if (this.sustain || this.sustainLock) {
      this.sustainedNotes.add(note);
      return;
    }
    
    const transposedNote = this.activeNoteMap.get(note);
    if (transposedNote) {
      this.audioEngine.releaseNote(transposedNote, instrument);
      this.activeNoteMap.delete(note);
    }
    
    this.highlightKey(note, false);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('wiano:noteoff', {
      detail: { note, transposedNote, instrument }
    }));
  }

  /**
   * Transpose a note by semitones
   */
  transposeNote(note, semitones) {
    if (semitones === 0) return note;
    
    const noteRegex = /^([A-G]#?)(\d)$/;
    const match = note.match(noteRegex);
    if (!match) return note;
    
    const [, noteName, octaveStr] = match;
    let octave = parseInt(octaveStr);
    
    const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let noteIndex = chromatic.indexOf(noteName);
    
    if (noteIndex === -1) return note;
    
    // Calculate new position
    let totalSemitones = octave * 12 + noteIndex + semitones;
    
    // Clamp to valid range (C0 to C10)
    totalSemitones = Math.max(0, Math.min(120, totalSemitones));
    
    const newOctave = Math.floor(totalSemitones / 12);
    const newNoteIndex = totalSemitones % 12;
    
    return `${chromatic[newNoteIndex]}${newOctave}`;
  }

  /**
   * Highlight/unhighlight a key
   */
  highlightKey(note, active) {
    const key = this.piano?.querySelector(`[data-note="${note}"]`);
    if (!key) return;
    
    if (active) {
      key.classList.add('pressed');
    } else {
      key.classList.remove('pressed');
    }
  }

  /**
   * Handle keyboard input
   */
  handleKeyDown(e) {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const key = e.key;
    
    // Space bar for sustain
    if (key === ' ') {
      e.preventDefault();
      this.setSustain(true);
      return;
    }
    
    // Get note from key mapping
    const note = this.keyMap[key];
    if (!note) return;
    
    // Prevent repeat
    if (this.pressedKeys.has(key)) return;
    this.pressedKeys.add(key);
    
    e.preventDefault();
    this.playNote(note, this.computeVelocity(e));
  }

  /**
   * Handle keyboard release
   */
  handleKeyUp(e) {
    const key = e.key;
    
    // Space bar for sustain
    if (key === ' ') {
      e.preventDefault();
      this.setSustain(false);
      return;
    }
    
    const note = this.keyMap[key];
    if (!note) return;
    
    this.pressedKeys.delete(key);
    
    e.preventDefault();
    this.releaseNote(note);
  }

  /**
   * Set sustain pedal state
   */
  setSustain(active) {
    if (this.sustainLock) return; // Locked sustain
    
    this.sustain = active;
    
    if (!active) {
      // Release all sustained notes
      this.sustainedNotes.forEach(note => {
        const transposedNote = this.activeNoteMap.get(note);
        if (transposedNote) {
          this.audioEngine.releaseNote(transposedNote);
          this.activeNoteMap.delete(note);
        }
        this.highlightKey(note, false);
      });
      this.sustainedNotes.clear();
      this.audioEngine.triggerResonance();
    }
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('wiano:sustain', {
      detail: { active }
    }));
  }

  /**
   * Toggle sustain lock
   */
  toggleSustainLock() {
    this.sustainLock = !this.sustainLock;
    
    if (!this.sustainLock) {
      // Release all sustained notes
      this.sustainedNotes.forEach(note => {
        const transposedNote = this.activeNoteMap.get(note);
        if (transposedNote) {
          this.audioEngine.releaseNote(transposedNote);
          this.activeNoteMap.delete(note);
        }
        this.highlightKey(note, false);
      });
      this.sustainedNotes.clear();
      this.audioEngine.triggerResonance();
    }
    
    return this.sustainLock;
  }

  /**
   * Set velocity mode
   */
  setVelocityMode(mode, fixedValue = 0.6) {
    this.velocityMode = mode;
    if (mode === 'fixed') {
      this.fixedVelocity = fixedValue;
    }
  }

  /**
   * Set transpose
   */
  setTranspose(semitones) {
    this.transpose = Math.max(-12, Math.min(12, semitones));
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Detach event listeners
   */
  detachEventListeners() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Cleanup
   */
  dispose() {
    this.detachEventListeners();
    if (this.container) {
      this.container.remove();
    }
    this.activeNoteMap.clear();
    this.pressedKeys.clear();
    this.sustainedNotes.clear();
  }
}
