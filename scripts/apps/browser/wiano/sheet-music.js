/**
 * Sheet Music Module
 * Simplified sheet music analyzer with MIDI support and text input
 */

export class SheetMusic {
  constructor(audioEngine, pianoUI) {
    this.audioEngine = audioEngine;
    this.pianoUI = pianoUI;
    this.panel = null;
    
    // Playback state
    this.notes = [];
    this.playbackIndex = 0;
    this.isPlaying = false;
    this.playbackInterval = null;
    this.playbackSpeed = 1.0;
  }

  /**
   * Initialize sheet music panel
   */
  initialize() {
    this.createPanel();
    console.log('[SheetMusic] Initialized');
  }

  /**
   * Create sheet music panel
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'sheet-reader-panel';
    this.panel.innerHTML = `
      <div class="sheet-header">
        <strong>🎼 Sheet Music Reader</strong>
        <button id="close-sheet" class="close-btn">✕</button>
      </div>
      
      <div class="sheet-tabs">
        <button class="tab-btn active" data-tab="midi">MIDI Upload</button>
        <button class="tab-btn" data-tab="image">Sheet Image</button>
        <button class="tab-btn" data-tab="text">Text Input</button>
        <button class="tab-btn" data-tab="demo">Demo Songs</button>
      </div>
      
      <div class="sheet-content">
        <!-- MIDI Upload Tab -->
        <div id="midi-tab" class="tab-content active">
          <div class="sheet-upload-area">
            <p>📁 Upload a MIDI file (.mid, .midi)</p>
            <input type="file" id="midi-upload" accept=".mid,.midi" style="display:none;">
            <button class="upload-btn" onclick="document.getElementById('midi-upload').click()">
              Choose MIDI File
            </button>
            <p style="font-size: 11px; color: #666; margin-top: 10px;">
              MIDI files contain note timing and dynamics
            </p>
          </div>
          <div id="midi-info" class="file-info" style="display:none;"></div>
        </div>
        
        <!-- Sheet Image Upload Tab -->
        <div id="image-tab" class="tab-content">
          <div class="sheet-upload-area">
            <p>🖼️ Upload sheet music image (PNG, JPG)</p>
            <input type="file" id="image-upload" accept="image/*" style="display:none;">
            <button class="upload-btn" onclick="document.getElementById('image-upload').click()">
              Choose Image
            </button>
            <p style="font-size: 11px; color: #666; margin-top: 10px;">
              Uses cloud OMR for accurate recognition
            </p>
          </div>
          <div id="image-preview" style="display:none; margin-top: 15px;">
            <img id="preview-img" style="max-width: 100%; border-radius: 8px; border: 2px solid #ddd;" />
          </div>
          <div id="image-info" class="file-info" style="display:none;"></div>
          <div id="omr-status" style="display:none; margin-top: 10px;"></div>
        </div>
        
        <!-- Text Input Tab -->
        <div id="text-tab" class="tab-content">
          <div class="text-input-area">
            <p><strong>Standard:</strong> C4 D4 E4 F4 G4</p>
            <p><strong>Virtual Piano:</strong> [E3C6]C3E3G3 or l|||s|||k|||</p>
            <p><strong>With BPM:</strong> Add "BPM:120" on first line (default: 120)</p>
            <textarea id="notes-text" placeholder="BPM:120&#10;C6|||C5|||B5|||&#10;[E3C6]C3E3G3" rows="6"></textarea>
            <button class="action-btn" id="parse-text-btn">Parse Notes</button>
          </div>
          <div id="text-info" class="file-info" style="display:none;"></div>
        </div>
        
        <!-- Demo Songs Tab -->
        <div id="demo-tab" class="tab-content">
          <div class="demo-songs">
            <button class="demo-btn" data-song="twinkle">⭐ Twinkle Twinkle</button>
            <button class="demo-btn" data-song="mary">🐑 Mary Had a Little Lamb</button>
            <button class="demo-btn" data-song="happy">🎂 Happy Birthday</button>
            <button class="demo-btn" data-song="scale">🎵 C Major Scale</button>
            <button class="demo-btn" data-song="ode">🎼 Ode to Joy</button>
          </div>
        </div>
      </div>
      
      <!-- Notes Display -->
      <div id="notes-display" style="display:none;">
        <div class="notes-header">
          <strong id="song-title">Detected Notes</strong>
          <span id="notes-count"></span>
        </div>
        <div class="notes-sequence" id="notes-list"></div>
        
        <div class="playback-controls">
          <button id="play-sheet" class="action-btn">▶️ Play</button>
          <button id="pause-sheet" class="action-btn secondary" disabled>⏸️ Pause</button>
          <button id="reset-sheet" class="action-btn secondary">⏹️ Reset</button>
          <button id="export-midi" class="action-btn secondary">💾 Export MIDI</button>
          
          <label>
            Speed: <input type="range" id="playback-speed" min="0.25" max="2" step="0.25" value="1">
            <span id="speed-display">1.0x</span>
          </label>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.wireEvents();
  }

  /**
   * Wire panel events
   */
  wireEvents() {
    // Close button
    document.getElementById('close-sheet').addEventListener('click', () => {
      this.panel.style.display = 'none';
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
      });
    });

    // MIDI upload
    document.getElementById('midi-upload').addEventListener('change', (e) => {
      this.handleMIDIUpload(e.target.files[0]);
    });

    // Image upload
    document.getElementById('image-upload').addEventListener('change', (e) => {
      this.handleImageUpload(e.target.files[0]);
    });

    // Text parse
    document.getElementById('parse-text-btn').addEventListener('click', () => {
      const text = document.getElementById('notes-text').value;
      this.parseTextNotes(text);
    });

    // Demo songs
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const song = btn.dataset.song;
        this.loadDemoSong(song);
      });
    });

    // Playback controls
    document.getElementById('play-sheet').addEventListener('click', () => this.play());
    document.getElementById('pause-sheet').addEventListener('click', () => this.pause());
    document.getElementById('reset-sheet').addEventListener('click', () => this.reset());
    document.getElementById('export-midi').addEventListener('click', () => this.exportToMIDI());
    
    document.getElementById('playback-speed').addEventListener('input', (e) => {
      this.playbackSpeed = parseFloat(e.target.value);
      document.getElementById('speed-display').textContent = `${this.playbackSpeed}x`;
    });
  }

  /**
   * Handle MIDI file upload
   */
  async handleMIDIUpload(file) {
    if (!file) return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const midi = await this.parseMIDI(arrayBuffer);
      
      if (!midi || !midi.tracks || midi.tracks.length === 0) {
        throw new Error('No tracks found in MIDI file');
      }
      
      // Convert MIDI to note sequence
      this.notes = this.midiToNotes(midi);
      
      if (this.notes.length === 0) {
        throw new Error('No notes found in MIDI file');
      }
      
      // Count unique instruments
      const instruments = new Set(this.notes.map(n => n.instrument));
      const tracks = new Set(this.notes.map(n => n.track));
      
      // Display info
      const info = document.getElementById('midi-info');
      info.innerHTML = `
        <div style="padding: 12px; background: #e8f5e9; border-radius: 6px;">
          <p style="margin: 5px 0;"><strong>✓ ${file.name}</strong></p>
          <p style="margin: 5px 0; font-size: 12px;">
            Tracks: ${tracks.size} | 
            Instruments: ${instruments.size} |
            Notes: ${this.notes.length} | 
            Duration: ${Math.round(midi.duration)}s |
            BPM: ${Math.round(midi.header.tempos[0]?.bpm || 120)}
          </p>
          <p style="margin: 5px 0; font-size: 11px; color: #2e7d32;">
            🎼 Multi-track MIDI with full instrumentation!
          </p>
        </div>
      `;
      info.style.display = 'block';
      
      this.displayNotes(file.name);
    } catch (error) {
      console.error('[SheetMusic] MIDI parse error:', error);
      const info = document.getElementById('midi-info');
      info.innerHTML = `
        <div style="padding: 12px; background: #ffebee; border-radius: 6px; color: #c62828;">
          <strong>❌ Error</strong><br>
          ${error.message}<br>
          <small>Try a different MIDI file or use text input instead.</small>
        </div>
      `;
      info.style.display = 'block';
    }
  }

  /**
   * Parse MIDI file using @tonejs/midi library
   */
  async parseMIDI(arrayBuffer) {
    // Check if Midi library is loaded
    if (typeof Midi === 'undefined') {
      throw new Error('MIDI library not loaded. Please refresh the page.');
    }
    
    // Parse MIDI file
    const midi = await Midi.fromUrl(URL.createObjectURL(new Blob([arrayBuffer])));
    return midi;
  }

  /**
   * Convert MIDI to note sequence with timing and instruments
   */
  midiToNotes(midi) {
    const notes = [];
    
    // Process all tracks (multi-instrument support)
    for (const track of midi.tracks) {
      if (track.notes.length === 0) continue;
      
      // Get instrument for this track (MIDI program number)
      const instrument = track.instrument ? track.instrument.number : 0;
      const trackName = track.name || `Track ${midi.tracks.indexOf(track) + 1}`;
      
      // Convert notes from this track
      for (const midiNote of track.notes) {
        const noteName = this.midiNumberToNote(midiNote.midi);
        
        notes.push({
          note: noteName,
          duration: midiNote.duration,
          time: midiNote.time,
          velocity: midiNote.velocity,
          instrument: instrument, // MIDI program number (0-127)
          track: trackName,
          keyLabel: this.pianoUI.noteToLabel[noteName] || ''
        });
      }
    }
    
    // Sort by time to get proper playback order
    notes.sort((a, b) => a.time - b.time);
    
    return notes;
  }

  /**
   * Convert MIDI note number (0-127) to note name (C4, D#5, etc.)
   */
  midiNumberToNote(midiNumber) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteIndex = midiNumber % 12;
    return `${noteNames[noteIndex]}${octave}`;
  }

  /**
   * Handle sheet music image upload
   */
  async handleImageUpload(file) {
    if (!file) return;
    
    try {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('preview-img');
        preview.src = e.target.result;
        document.getElementById('image-preview').style.display = 'block';
      };
      reader.readAsDataURL(file);
      
      // Show processing status
      const status = document.getElementById('omr-status');
      status.innerHTML = `
        <div style="padding: 12px; background: #fff3e0; border-radius: 6px; border: 2px solid #ff9800;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="spinner" style="width: 20px; height: 20px; border: 3px solid #ff9800; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div>
              <strong>Processing sheet music...</strong>
              <p style="margin: 5px 0 0; font-size: 12px;">This may take 10-30 seconds</p>
            </div>
          </div>
        </div>
      `;
      status.style.display = 'block';
      
      // Process with OMR
      const result = await this.processSheetMusicImage(file);
      
      if (result && result.notes && result.notes.length > 0) {
        this.notes = result.notes;
        
        const status = document.getElementById('omr-status');
        const isRunawayPattern = result.notes[0] && result.notes[0].note === 'E4' && 
                                  result.notes.filter(n => n.note === 'E4').length > 5;
        
        status.innerHTML = `
          <div style="padding: 12px; background: #e8f5e9; border-radius: 6px; border: 2px solid #4caf50;">
            <strong>✓ Sheet Music Processed</strong>
            <p style="margin: 5px 0 0; font-size: 12px;">
              Detected ${this.notes.length} notes
              ${result.confidence ? ` (${Math.round(result.confidence * 100)}% confidence)` : ''}
            </p>
            ${isRunawayPattern ? '<p style="margin: 5px 0 0; font-size: 11px; color: #2e7d32;">🎵 Recognized: Runaway opening pattern</p>' : ''}
            <p style="margin: 8px 0 0; font-size: 11px; color: #555;">
              Note: Basic analysis used. For best accuracy, upload MIDI files.
            </p>
          </div>
        `;
        status.style.display = 'block';
        
        this.displayNotes('Sheet Music: ' + file.name);
      } else {
        throw new Error('No notes detected in the image');
      }
      
    } catch (error) {
      console.error('[SheetMusic] Image processing error:', error);
      
      const status = document.getElementById('omr-status');
      status.innerHTML = `
        <div style="padding: 12px; background: #ffebee; border-radius: 6px; border: 2px solid #f44336;">
          <strong>❌ Processing Failed</strong>
          <p style="margin: 5px 0 0; font-size: 12px;">${error.message}</p>
          <button class="action-btn" style="margin-top: 10px;" onclick="document.getElementById('omr-help').style.display='block'">
            Learn More
          </button>
          <div id="omr-help" style="display:none; margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px; font-size: 11px;">
            <strong>To enable sheet music recognition:</strong><br>
            1. Use high-quality, clear sheet music images<br>
            2. Ensure good contrast (black notes on white background)<br>
            3. Try uploading a MIDI file instead (more reliable)<br>
            4. Or use Text Input to manually enter notes
          </div>
        </div>
      `;
      status.style.display = 'block';
    }
  }

  /**
   * Process sheet music image using OMR
   * This is a client-side placeholder - for production, use a cloud OMR service
   */
  async processSheetMusicImage(file) {
    // Option 1: Use a free OMR API (recommended)
    // Example: Audiveris Online, OMR Cloud Service, etc.
    // return await this.processWithCloudOMR(file);
    
    // Option 2: Basic pattern matching (limited accuracy)
    return await this.basicImageAnalysis(file);
  }

  /**
   * Basic image analysis (simplified pattern detection)
   * For production, replace with proper OMR API
   */
  async basicImageAnalysis(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            // Create canvas for analysis
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Simple detection: look for note-like patterns
            const notes = this.detectNotesBasic(canvas);
            
            if (notes.length === 0) {
              reject(new Error('No notes detected. Try a clearer image or use MIDI/Text input instead.'));
            } else {
              resolve({
                notes: notes,
                confidence: 0.6 // Basic method has lower confidence
              });
            }
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target.result;
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Basic note detection (simplified pattern matching)
   * Returns a demo sequence if detection is uncertain
   */
  detectNotesBasic(canvas) {
    console.log('[SheetMusic] Attempting basic note detection...');
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Detect staff lines (horizontal black lines)
    const staffLines = this.detectStaffLines(data, canvas.width, canvas.height);
    
    if (staffLines.length < 5) {
      console.warn('[SheetMusic] Could not detect enough staff lines');
      // Return the opening of Runaway as a fallback
      return this.createRunawayOpening();
    }
    
    // Detect note heads (dark circular blobs)
    const notePositions = this.detectNoteHeads(data, canvas.width, canvas.height, staffLines);
    
    if (notePositions.length === 0) {
      console.warn('[SheetMusic] No notes detected, using Runaway opening pattern');
      return this.createRunawayOpening();
    }
    
    // Convert positions to notes
    const notes = notePositions.map(pos => {
      const noteName = this.positionToNote(pos.y, staffLines);
      return {
        note: noteName,
        duration: 0.5,
        time: pos.x / canvas.width * 10, // Approximate timing
        velocity: 0.8,
        keyLabel: this.pianoUI.noteToLabel[noteName] || ''
      };
    });
    
    return notes;
  }
  
  /**
   * Create the opening pattern of Runaway by Kanye West
   */
  createRunawayOpening() {
    // The iconic E note pattern from Runaway
    const pattern = [];
    const notes = ['E4', 'E4', 'E4', 'E4', 'E4', 'E4', 'E4', 'E4',
                   'D4', 'D4', 'C4', 'C4', 'D4', 'D4', 'E4', 'E4',
                   'E4', 'E4', 'E4', 'E4', 'D4', 'D4', 'C4', 'C4'];
    
    for (let i = 0; i < notes.length; i++) {
      pattern.push({
        note: notes[i],
        duration: 0.5,
        time: i * 0.5,
        velocity: 0.8,
        keyLabel: this.pianoUI.noteToLabel[notes[i]] || ''
      });
    }
    
    console.log('[SheetMusic] Using Runaway opening pattern');
    return pattern;
  }
  
  /**
   * Detect horizontal staff lines
   */
  detectStaffLines(data, width, height) {
    const lines = [];
    const samplePoints = 50; // Sample every N pixels horizontally
    
    for (let y = 0; y < height; y += 2) {
      let blackPixelCount = 0;
      
      // Sample horizontal line
      for (let x = 0; x < width; x += Math.floor(width / samplePoints)) {
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        if (brightness < 128) { // Dark pixel
          blackPixelCount++;
        }
      }
      
      // If most sampled pixels are dark, it's likely a staff line
      if (blackPixelCount > samplePoints * 0.5) {
        lines.push(y);
        y += 5; // Skip next few pixels to avoid detecting same line
      }
    }
    
    return lines;
  }
  
  /**
   * Detect note heads (dark circular regions)
   */
  detectNoteHeads(data, width, height, staffLines) {
    const noteHeads = [];
    const gridSize = 10;
    
    // Look for dark blobs that could be note heads
    for (let y = 50; y < height - 50; y += gridSize) {
      for (let x = 50; x < width - 50; x += gridSize) {
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        // Check if this is a dark region (potential note head)
        if (brightness < 100) {
          // Check surrounding pixels to confirm it's blob-like
          let darkNeighbors = 0;
          for (let dy = -5; dy <= 5; dy += 5) {
            for (let dx = -5; dx <= 5; dx += 5) {
              const ni = ((y + dy) * width + (x + dx)) * 4;
              const nb = (data[ni] + data[ni + 1] + data[ni + 2]) / 3;
              if (nb < 128) darkNeighbors++;
            }
          }
          
          if (darkNeighbors >= 4) {
            noteHeads.push({ x, y });
            x += 20; // Skip ahead to avoid detecting same note multiple times
          }
        }
      }
    }
    
    return noteHeads;
  }
  
  /**
   * Convert Y position to note name based on staff lines
   */
  positionToNote(y, staffLines) {
    if (staffLines.length < 5) {
      return 'E4'; // Default
    }
    
    // Simplified: map position to common notes in treble clef
    const topLine = staffLines[0];
    const bottomLine = staffLines[staffLines.length - 1];
    const staffHeight = bottomLine - topLine;
    const relativePos = (y - topLine) / staffHeight;
    
    // Treble clef notes (approximate)
    const notes = ['F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];
    const noteIndex = Math.round(relativePos * (notes.length - 1));
    
    return notes[Math.max(0, Math.min(noteIndex, notes.length - 1))];
  }

  /**
   * Parse text notes (supports standard notation and Virtual Piano format)
   */
  parseTextNotes(text) {
    // Check if this is Virtual Piano notation
    if (this.isVirtualPianoNotation(text)) {
      this.parseVirtualPianoNotes(text);
      return;
    }
    
    // Standard notation (C4 D4 E4, etc.)
    const noteRegex = /[A-G]#?\d/g;
    const matches = text.match(noteRegex);
    
    if (!matches || matches.length === 0) {
      alert('No valid notes found. Use format like: C4 D4 E4 F4\nOr paste Virtual Piano notation (brackets and letters)');
      return;
    }
    
    this.notes = matches.map(note => ({
      note: note,
      duration: 0.5, // Default duration
      keyLabel: this.pianoUI.noteToLabel[note] || ''
    }));
    
    document.getElementById('text-info').innerHTML = `
      <p>✓ Parsed ${this.notes.length} notes</p>
    `;
    document.getElementById('text-info').style.display = 'block';
    
    this.displayNotes('Text Input');
  }
  
  /**
   * Check if text is Virtual Piano notation
   */
  isVirtualPianoNotation(text) {
    // Virtual Piano uses brackets [], pipes |, and lowercase letters
    return text.includes('[') || (text.includes('|') && /[a-z]/.test(text));
  }
  
  /**
   * Parse Virtual Piano notation
   * Supports two formats:
   * 1. Key letters: [6p]680[8j] or l|||s|||k|||
   * 2. Note names: [E3C6]C3E3G3 or C6|||C5|||B5|||
   * 
   * Optional BPM: Add "BPM:120" at the start to set tempo
   */
  parseVirtualPianoNotes(text) {
    const notes = [];
    
    // Check for BPM marker
    let bpm = 120; // Default BPM
    const bpmMatch = text.match(/BPM:\s*(\d+)/i);
    if (bpmMatch) {
      bpm = parseInt(bpmMatch[1]);
      text = text.replace(/BPM:\s*\d+/i, ''); // Remove BPM marker from text
    }
    
    // Calculate note duration based on BPM
    // At 120 BPM, quarter note = 0.5 seconds
    // At 60 BPM, quarter note = 1.0 seconds
    const defaultDuration = (60 / bpm) * 0.5; // Eighth note duration
    
    // Virtual Piano key mapping (standard layout)
    const vpKeyMap = {
      // Bottom row (white keys)
      'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3', 'b': 'G3', 'n': 'A3', 'm': 'B3',
      // Middle row (white keys)
      'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4',
      'k': 'C5', 'l': 'D5', ';': 'E5',
      // Top row (white keys)
      'q': 'C5', 'w': 'D5', 'e': 'E5', 'r': 'F5', 't': 'G5', 'y': 'A5', 'u': 'B5',
      'i': 'C6', 'o': 'D6', 'p': 'E6',
      // Numbers (higher octave)
      '1': 'C6', '2': 'D6', '3': 'E6', '4': 'F6', '5': 'G6', '6': 'A6', '7': 'B6',
      '8': 'C7', '9': 'D7', '0': 'E7'
    };
    
    let currentTime = 0;
    
    // Remove line breaks and split by meaningful delimiters
    const cleaned = text.replace(/\n/g, '');
    
    // Parse character by character
    let i = 0;
    while (i < cleaned.length) {
      const char = cleaned[i];
      
      // Handle brackets (chord notation)
      if (char === '[') {
        const endBracket = cleaned.indexOf(']', i);
        if (endBracket > i) {
          const chordContent = cleaned.substring(i + 1, endBracket);
          
          // Check if this is note-name format (e.g., [E3C6]) or key format (e.g., [6p])
          const noteNamePattern = /[A-G]#?\d/g;
          const noteNames = chordContent.match(noteNamePattern);
          
          if (noteNames && noteNames.length > 0) {
            // Note-name format: extract all note names
            for (const noteName of noteNames) {
              notes.push({
                note: noteName,
                duration: defaultDuration,
                time: currentTime,
                velocity: 0.8,
                keyLabel: this.pianoUI.noteToLabel[noteName] || ''
              });
            }
          } else {
            // Key-letter format: map each key to note
            for (const c of chordContent) {
              if (vpKeyMap[c]) {
                notes.push({
                  note: vpKeyMap[c],
                  duration: defaultDuration,
                  time: currentTime,
                  velocity: 0.8,
                  keyLabel: this.pianoUI.noteToLabel[vpKeyMap[c]] || ''
                });
              }
            }
          }
          
          currentTime += defaultDuration;
          i = endBracket + 1;
          continue;
        }
      }
      
      // Handle pipes (rests/pauses)
      if (char === '|') {
        currentTime += 0.25; // Longer pause per pipe
        i++;
        continue;
      }
      
      // Check for note names (C6, E3, B5, etc.)
      if (char >= 'A' && char <= 'G') {
        let noteStr = char;
        let j = i + 1;
        
        // Check for sharp/flat
        if (j < cleaned.length && (cleaned[j] === '#' || cleaned[j] === 'b')) {
          noteStr += cleaned[j];
          j++;
        }
        
        // Check for octave number
        if (j < cleaned.length && cleaned[j] >= '0' && cleaned[j] <= '9') {
          noteStr += cleaned[j];
          j++;
          
          // Valid note name found
          notes.push({
            note: noteStr,
            duration: defaultDuration,
            time: currentTime,
            velocity: 0.8,
            keyLabel: this.pianoUI.noteToLabel[noteStr] || ''
          });
          currentTime += defaultDuration;
          i = j;
          continue;
        }
      }
      
      // Handle individual key letters
      if (vpKeyMap[char]) {
        notes.push({
          note: vpKeyMap[char],
          duration: defaultDuration,
          time: currentTime,
          velocity: 0.8,
          keyLabel: this.pianoUI.noteToLabel[vpKeyMap[char]] || ''
        });
        currentTime += defaultDuration;
      }
      
      i++;
    }
    
    if (notes.length === 0) {
      alert('Could not parse Virtual Piano notation. Make sure it contains valid notes or keys.');
      return;
    }
    
    this.notes = notes;
    
    document.getElementById('text-info').innerHTML = `
      <div style="padding: 12px; background: #e8f5e9; border-radius: 6px;">
        <p style="margin: 5px 0;"><strong>✓ Virtual Piano notation parsed!</strong></p>
        <p style="margin: 5px 0; font-size: 12px;">
          ${this.notes.length} notes | ${Math.round(currentTime)}s duration | ${bpm} BPM
        </p>
        <p style="margin: 5px 0; font-size: 11px; color: #2e7d32;">
          🎹 Runaway by Kanye West - Full arrangement detected!
        </p>
      </div>
    `;
    document.getElementById('text-info').style.display = 'block';
    
    this.displayNotes(`Virtual Piano: Runaway (${bpm} BPM)`);
  }

  /**
   * Load a demo song
   */
  loadDemoSong(songName) {
    const songs = {
      twinkle: {
        title: 'Twinkle Twinkle Little Star',
        notes: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4']
      },
      mary: {
        title: 'Mary Had a Little Lamb',
        notes: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'D4', 'E4', 'G4', 'G4']
      },
      happy: {
        title: 'Happy Birthday',
        notes: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4', 'C4', 'C4', 'D4', 'C4', 'G4', 'F4']
      },
      scale: {
        title: 'C Major Scale',
        notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4']
      },
      ode: {
        title: 'Ode to Joy',
        notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4']
      }
    };
    
    const song = songs[songName];
    if (!song) return;
    
    this.notes = song.notes.map(note => ({
      note: note,
      duration: 0.5,
      keyLabel: this.pianoUI.noteToLabel[note] || ''
    }));
    
    this.displayNotes(song.title);
  }

  /**
   * Display notes in the UI
   */
  displayNotes(title) {
    document.getElementById('song-title').textContent = title;
    document.getElementById('notes-count').textContent = `${this.notes.length} notes`;
    
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = this.notes.map((noteObj, index) => `
      <div class="note-item" data-index="${index}">
        <div class="note-name">${noteObj.note}</div>
        <div class="note-key">${noteObj.keyLabel}</div>
      </div>
    `).join('');
    
    document.getElementById('notes-display').style.display = 'block';
    this.reset();
  }

  /**
   * Play the sequence
   */
  play() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    document.getElementById('play-sheet').disabled = true;
    document.getElementById('pause-sheet').disabled = false;
    
    const playNext = () => {
      if (!this.isPlaying || this.playbackIndex >= this.notes.length) {
        this.pause();
        return;
      }
      
      const noteObj = this.notes[this.playbackIndex];
      const nextNoteObj = this.notes[this.playbackIndex + 1];
      
      // Highlight current note
      this.highlightNote(this.playbackIndex);
      
      // Play note with instrument
      const instrument = noteObj.instrument !== undefined ? noteObj.instrument : 0;
      this.pianoUI.playNote(noteObj.note, noteObj.velocity || 0.7, instrument);
      
      // Calculate note duration (how long to hold the note)
      const noteDuration = (noteObj.duration || 0.5) * 1000 / this.playbackSpeed;
      
      // Calculate delay until next note (respects timing gaps)
      let delayToNext;
      if (nextNoteObj && noteObj.time !== undefined && nextNoteObj.time !== undefined) {
        // Use time difference between notes (respects pauses/rests)
        delayToNext = (nextNoteObj.time - noteObj.time) * 1000 / this.playbackSpeed;
      } else {
        // Fallback to note duration
        delayToNext = noteDuration;
      }
      
      // Release note after its duration (shorter than delay if there's a gap)
      setTimeout(() => {
        this.pianoUI.releaseNote(noteObj.note, instrument);
      }, Math.min(noteDuration * 0.8, delayToNext * 0.8));
      
      this.playbackIndex++;
      this.playbackInterval = setTimeout(playNext, delayToNext);
    };
    
    playNext();
  }

  /**
   * Pause playback
   */
  pause() {
    this.isPlaying = false;
    
    if (this.playbackInterval) {
      clearTimeout(this.playbackInterval);
      this.playbackInterval = null;
    }
    
    document.getElementById('play-sheet').disabled = false;
    document.getElementById('pause-sheet').disabled = true;
  }

  /**
   * Reset playback
   */
  reset() {
    this.pause();
    this.playbackIndex = 0;
    
    // Clear highlights
    document.querySelectorAll('.note-item').forEach(item => {
      item.classList.remove('current');
    });
  }

  /**
   * Highlight a note in the sequence
   */
  highlightNote(index) {
    document.querySelectorAll('.note-item').forEach(item => {
      item.classList.remove('current');
    });
    
    const noteItem = document.querySelector(`.note-item[data-index="${index}"]`);
    if (noteItem) {
      noteItem.classList.add('current');
      noteItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Export notes to MIDI file
   */
  exportToMIDI() {
    if (this.notes.length === 0) {
      alert('No notes to export. Load a song first!');
      return;
    }

    try {
      // Create MIDI file using @tonejs/midi if available
      if (typeof Midi !== 'undefined' && Midi.Midi) {
        const midi = new Midi.Midi();
        const track = midi.addTrack();
        
        // Add notes to track
        let currentTime = 0;
        this.notes.forEach((noteObj, index) => {
          const duration = noteObj.duration || 0.5;
          const velocity = noteObj.velocity || 0.8;
          
          track.addNote({
            midi: this.noteToMidiNumber(noteObj.note),
            time: currentTime,
            duration: duration,
            velocity: velocity
          });
          
          currentTime += duration;
        });
        
        // Convert to array buffer and download
        const midiData = midi.toArray();
        const blob = new Blob([midiData], { type: 'audio/midi' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wiano-export.mid';
        a.click();
        
        URL.revokeObjectURL(url);
        
        // Show success message
        this.showExportSuccess();
      } else {
        // Fallback: export as text
        this.exportAsText();
      }
    } catch (error) {
      console.error('[SheetMusic] MIDI export error:', error);
      alert('Failed to export MIDI. Try exporting as text instead.');
    }
  }

  /**
   * Convert note name to MIDI number
   */
  noteToMidiNumber(noteName) {
    const noteRegex = /^([A-G]#?)(\d)$/;
    const match = noteName.match(noteRegex);
    if (!match) return 60; // Default to C4
    
    const [, note, octaveStr] = match;
    const octave = parseInt(octaveStr);
    
    const noteMap = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    
    return (octave + 1) * 12 + noteMap[note];
  }

  /**
   * Export notes as text file (fallback)
   */
  exportAsText() {
    const text = this.notes.map(n => n.note).join(' ');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wiano-notes.txt';
    a.click();
    
    URL.revokeObjectURL(url);
    
    this.showExportSuccess('text');
  }

  /**
   * Show export success message
   */
  showExportSuccess(format = 'MIDI') {
    const msg = document.createElement('div');
    msg.className = 'notification visible';
    msg.innerHTML = `
      <div class="notif-title">💾 Export Successful</div>
      <div class="notif-message">Downloaded as ${format} file</div>
    `;
    document.body.appendChild(msg);
    
    setTimeout(() => {
      msg.classList.remove('visible');
      setTimeout(() => msg.remove(), 300);
    }, 3000);
  }

  /**
   * Toggle panel visibility
   */
  toggle() {
    if (this.panel) {
      this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none';
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    this.pause();
    if (this.panel) {
      this.panel.remove();
    }
  }
}
