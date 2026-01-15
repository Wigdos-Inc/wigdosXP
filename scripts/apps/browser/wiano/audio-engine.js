/**
 * Audio Engine Module
 * Handles all audio context, samplers, effects, and audio graph routing
 */

export class AudioEngine {
  constructor() {
    this.audioReady = false;
    this.initializing = false;
    
    // Audio nodes
    this.pianoSampler = null;
    this.masterGain = null;
    this.toneEQ = null;
    this.toneFilter = null;
    this.stereo = null;
    this.compressor = null;
    this.hallConvolution = null;
    this.algoReverb = null;
    this.reverbMerge = null;
    this.reverbSend = null;
    this.convSend = null;
    this.resonanceFilter = null;
    this.resonanceGain = null;
    
    // Analyzers for visualization
    this.fftAnalyser = null;
    this.waveAnalyser = null;
    
    // State
    this.currentPianoType = 'grand';
    this.loaded = false;
    
    // Multi-instrument synths
    this.instruments = {};
    this.polySynth = null;
  }

  /**
   * Initialize audio context and start loading samples
   */
  async initialize() {
    if (this.initializing || this.audioReady) return;
    this.initializing = true;

    try {
      await Tone.start();
      console.log('[AudioEngine] Tone.js started');
      
      this.buildAudioGraph();
      await this.loadSamples();
      this.createInstrumentSynths();
      
      this.audioReady = true;
      this.initializing = false;
      
      return true;
    } catch (error) {
      console.error('[AudioEngine] Initialization failed:', error);
      this.initializing = false;
      throw error;
    }
  }

  /**
   * Build the audio processing graph
   */
  buildAudioGraph() {
    // Master gain
    this.masterGain = new Tone.Gain(0.7).toDestination();
    
    // EQ (3-band)
    this.toneEQ = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0,
      lowFrequency: 400,
      highFrequency: 2500
    });
    
    // Brightness filter
    this.toneFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 15000,
      rolloff: -24
    });
    
    // Stereo widener
    this.stereo = new Tone.StereoWidener(0.3);
    
    // Compressor
    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });
    
    // Reverbs
    this.algoReverb = new Tone.Reverb({
      decay: 2.5,
      preDelay: 0.01
    });
    
    this.hallConvolution = new Tone.Convolver({
      url: 'https://tonejs.github.io/audio/ir/bright-hall.mp3',
      onload: () => console.log('[AudioEngine] Convolution IR loaded')
    });
    
    // Reverb routing
    this.reverbSend = new Tone.Gain(0);
    this.convSend = new Tone.Gain(0);
    this.reverbMerge = new Tone.Gain(1);
    
    this.reverbSend.connect(this.algoReverb);
    this.convSend.connect(this.hallConvolution);
    this.algoReverb.connect(this.reverbMerge);
    this.hallConvolution.connect(this.reverbMerge);
    
    // Resonance filter (for pedal effects)
    this.resonanceGain = new Tone.Gain(0);
    this.resonanceFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 800,
      Q: 8
    });
    this.resonanceGain.connect(this.resonanceFilter);
    this.resonanceFilter.connect(this.masterGain);
    
    // Analyzers
    this.fftAnalyser = new Tone.Analyser('fft', 512);
    this.waveAnalyser = new Tone.Analyser('waveform', 1024);
    
    // Main chain: EQ -> Filter -> Stereo -> Compressor -> Master
    this.toneEQ.chain(
      this.toneFilter,
      this.stereo,
      this.compressor,
      this.fftAnalyser,
      this.waveAnalyser,
      this.masterGain
    );
    
    // Connect reverb merge to master
    this.reverbMerge.connect(this.masterGain);
    
    console.log('[AudioEngine] Audio graph built');
  }

  /**
   * Load piano samples (optimized - single sampler)
   */
  async loadSamples() {
    const baseURL = 'https://tonejs.github.io/audio/salamander/';
    const samples = {
      'A1': 'A1.mp3', 'C2': 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
      'A2': 'A2.mp3', 'C3': 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
      'A3': 'A3.mp3', 'C4': 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
      'A4': 'A4.mp3', 'C5': 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
      'A5': 'A5.mp3', 'C6': 'C6.mp3'
    };

    return new Promise((resolve, reject) => {
      this.pianoSampler = new Tone.Sampler({
        urls: samples,
        baseUrl: baseURL,
        release: 2,
        onload: () => {
          console.log('[AudioEngine] Piano samples loaded');
          this.loaded = true;
          
          // Connect sampler to audio graph
          this.pianoSampler.connect(this.toneEQ);
          this.pianoSampler.connect(this.reverbSend);
          this.pianoSampler.connect(this.convSend);
          this.pianoSampler.connect(this.resonanceGain);
          
          this.applyPianoTypeSettings();
          resolve();
        },
        onerror: reject
      });
    });
  }

  /**
   * Create synthesizers for different MIDI instruments
   */
  createInstrumentSynths() {
    // General polyphonic synth for all instruments
    this.polySynth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 32,
      voice: Tone.Synth,
      options: {
        envelope: {
          attack: 0.005,
          decay: 0.1,
          sustain: 0.3,
          release: 1
        }
      }
    }).connect(this.toneEQ);
    
    console.log('[AudioEngine] Multi-instrument synths created');
  }

  /**
   * Get instrument name from MIDI program number
   */
  getInstrumentName(programNumber) {
    const instruments = [
      // 0-7: Piano
      'Piano', 'Bright Piano', 'Electric Grand', 'Honky-tonk', 'Electric Piano 1', 'Electric Piano 2', 'Harpsichord', 'Clavinet',
      // 8-15: Chromatic Percussion
      'Celesta', 'Glockenspiel', 'Music Box', 'Vibraphone', 'Marimba', 'Xylophone', 'Tubular Bells', 'Dulcimer',
      // 16-23: Organ
      'Organ', 'Percussive Organ', 'Rock Organ', 'Church Organ', 'Reed Organ', 'Accordion', 'Harmonica', 'Tango Accordion',
      // 24-31: Guitar
      'Nylon Guitar', 'Steel Guitar', 'Jazz Guitar', 'Clean Guitar', 'Muted Guitar', 'Overdrive Guitar', 'Distortion Guitar', 'Guitar Harmonics',
      // 32-39: Bass
      'Acoustic Bass', 'Finger Bass', 'Pick Bass', 'Fretless Bass', 'Slap Bass 1', 'Slap Bass 2', 'Synth Bass 1', 'Synth Bass 2',
      // 40-47: Strings
      'Violin', 'Viola', 'Cello', 'Contrabass', 'Tremolo Strings', 'Pizzicato Strings', 'Harp', 'Timpani',
      // 48-55: Ensemble
      'Strings', 'Slow Strings', 'Synth Strings 1', 'Synth Strings 2', 'Choir', 'Voice Oohs', 'Synth Voice', 'Orchestra Hit',
      // 56-63: Brass
      'Trumpet', 'Trombone', 'Tuba', 'Muted Trumpet', 'French Horn', 'Brass Section', 'Synth Brass 1', 'Synth Brass 2',
      // 64-71: Reed
      'Soprano Sax', 'Alto Sax', 'Tenor Sax', 'Baritone Sax', 'Oboe', 'English Horn', 'Bassoon', 'Clarinet',
      // 72-79: Pipe
      'Piccolo', 'Flute', 'Recorder', 'Pan Flute', 'Bottle', 'Shakuhachi', 'Whistle', 'Ocarina',
      // 80-87: Synth Lead
      'Square Lead', 'Sawtooth Lead', 'Synth Calliope', 'Chiffer Lead', 'Charang', 'Solo Vox', 'Fifth Sawtooth', 'Bass & Lead',
      // 88-95: Synth Pad
      'Fantasia', 'Warm Pad', 'Polysynth', 'Space Voice', 'Bowed Glass', 'Metal Pad', 'Halo Pad', 'Sweep Pad',
      // 96-103: Synth Effects
      'Ice Rain', 'Soundtrack', 'Crystal', 'Atmosphere', 'Brightness', 'Goblin', 'Echo Drops', 'Star Theme',
      // 104-111: Ethnic
      'Sitar', 'Banjo', 'Shamisen', 'Koto', 'Kalimba', 'Bagpipe', 'Fiddle', 'Shanai',
      // 112-119: Percussive
      'Tinkle Bell', 'Agogo', 'Steel Drums', 'Woodblock', 'Taiko', 'Melodic Tom', 'Synth Drum', 'Reverse Cymbal',
      // 120-127: Sound Effects
      'Guitar Fret', 'Breath', 'Seashore', 'Bird', 'Telephone', 'Helicopter', 'Applause', 'Gunshot'
    ];
    
    return instruments[programNumber] || `Instrument ${programNumber}`;
  }

  /**
   * Piano type definitions
   */
  getPianoTypes() {
    return {
      grand: {
        name: 'Grand Piano',
        icon: '🎹',
        release: 2,
        brightness: 15000,
        reverb: 0.35,
        sustain: 1.0,
        attack: 0.001,
        color: '#8B4513'
      },
      upright: {
        name: 'Upright Piano',
        icon: '🎼',
        release: 1.2,
        brightness: 12000,
        reverb: 0.25,
        sustain: 0.7,
        attack: 0.005,
        color: '#654321'
      },
      electric: {
        name: 'Electric Piano',
        icon: '⚡',
        release: 1.5,
        brightness: 10000,
        reverb: 0.4,
        sustain: 0.8,
        attack: 0.003,
        color: '#FF6B35'
      },
      bright: {
        name: 'Bright Piano',
        icon: '✨',
        release: 1.0,
        brightness: 20000,
        reverb: 0.2,
        sustain: 0.6,
        attack: 0.001,
        color: '#FFD700'
      },
      soft: {
        name: 'Soft Piano',
        icon: '🌙',
        release: 2.5,
        brightness: 8000,
        reverb: 0.5,
        sustain: 1.2,
        attack: 0.01,
        color: '#6A5ACD'
      },
      organ: {
        name: 'Organ',
        icon: '🎶',
        release: 0.1,
        brightness: 8000,
        reverb: 0.5,
        sustain: 1.5,
        attack: 0.01,
        color: '#4B0082'
      },
      harpsichord: {
        name: 'Harpsichord',
        icon: '🎻',
        release: 0.3,
        brightness: 16000,
        reverb: 0.15,
        sustain: 0.3,
        attack: 0.001,
        color: '#CD853F'
      },
      synth: {
        name: 'Synth Piano',
        icon: '🎛️',
        release: 1.8,
        brightness: 14000,
        reverb: 0.6,
        sustain: 1.0,
        attack: 0.02,
        color: '#00CED1'
      },
      roblox: {
        name: 'Roblox Piano',
        icon: '🎮',
        release: 0.6,
        brightness: 18000,
        reverb: 0.15,
        sustain: 0.5,
        attack: 0.002,
        color: '#E03C28'
      }
    };
  }

  /**
   * Apply settings for current piano type
   */
  applyPianoTypeSettings() {
    if (!this.pianoSampler || !this.loaded) {
      console.warn('[AudioEngine] Cannot apply piano type settings - sampler not ready');
      return;
    }
    
    const types = this.getPianoTypes();
    const type = types[this.currentPianoType];
    
    if (!type) {
      console.warn(`[AudioEngine] Unknown piano type: ${this.currentPianoType}`);
      return;
    }
    
    console.log(`[AudioEngine] Applying ${type.name} settings:`, {
      attack: type.attack,
      release: type.release,
      brightness: type.brightness,
      reverb: type.reverb
    });
    
    // Update sampler envelope
    this.pianoSampler.attack = type.attack;
    this.pianoSampler.release = type.release;
    
    // Update filter brightness
    this.toneFilter.frequency.rampTo(type.brightness, 0.3);
    
    // Update reverb mix
    const reverbMix = type.reverb;
    this.reverbSend.gain.rampTo(reverbMix * 0.6, 0.3);
    this.convSend.gain.rampTo(reverbMix * 0.4, 0.3);
    
    console.log(`[AudioEngine] ✓ Applied ${type.name} settings`);
  }

  /**
   * Switch piano type
   */
  switchPianoType(type) {
    const types = this.getPianoTypes();
    if (!types[type]) {
      console.warn(`[AudioEngine] Unknown piano type: ${type}`);
      return;
    }
    
    console.log(`[AudioEngine] Switching to ${types[type].name}...`);
    this.currentPianoType = type;
    this.applyPianoTypeSettings();
  }

  /**
   * Play a note with optional instrument
   */
  playNote(note, velocity = 0.6, duration = undefined, instrument = 0) {
    if (!this.audioReady) {
      console.warn('[AudioEngine] Audio not ready');
      return;
    }
    
    // Clamp velocity
    velocity = Math.max(0.1, Math.min(1.0, velocity));
    
    // Use piano sampler for piano instruments (0-7) or if sampler loaded
    if (instrument <= 7 && this.pianoSampler && this.loaded) {
      if (duration) {
        this.pianoSampler.triggerAttackRelease(note, duration, undefined, velocity);
      } else {
        this.pianoSampler.triggerAttack(note, undefined, velocity);
      }
    }
    // Use polySynth for other instruments
    else if (this.polySynth) {
      if (duration) {
        this.polySynth.triggerAttackRelease(note, duration, undefined, velocity);
      } else {
        this.polySynth.triggerAttack(note, undefined, velocity);
      }
    }
    // Fallback to piano sampler
    else if (this.pianoSampler && this.loaded) {
      if (duration) {
        this.pianoSampler.triggerAttackRelease(note, duration, undefined, velocity);
      } else {
        this.pianoSampler.triggerAttack(note, undefined, velocity);
      }
    }
  }

  /**
   * Release a note with optional instrument
   */
  releaseNote(note, instrument = 0) {
    if (!this.audioReady) return;
    
    // Piano instruments use sampler
    if (instrument <= 7 && this.pianoSampler) {
      this.pianoSampler.triggerRelease(note);
    }
    // Other instruments use polySynth
    else if (this.polySynth) {
      this.polySynth.triggerRelease(note);
    }
    // Fallback
    else if (this.pianoSampler) {
      this.pianoSampler.triggerRelease(note);
    }
  }

  /**
   * Release all notes
   */
  releaseAllNotes() {
    if (!this.audioReady || !this.pianoSampler) return;
    this.pianoSampler.releaseAll();
  }

  /**
   * Trigger resonance effect (for sustain pedal)
   */
  triggerResonance() {
    if (!this.resonanceGain) return;
    
    this.resonanceGain.gain.cancelScheduledValues(Tone.now());
    this.resonanceGain.gain.setValueAtTime(0.15, Tone.now());
    this.resonanceGain.gain.exponentialRampToValueAtTime(0.001, Tone.now() + 2);
  }

  /**
   * Update EQ settings
   */
  updateEQ(band, value) {
    if (!this.toneEQ) return;
    
    switch(band) {
      case 'low':
        this.toneEQ.low.value = value;
        break;
      case 'mid':
        this.toneEQ.mid.value = value;
        break;
      case 'high':
        this.toneEQ.high.value = value;
        break;
    }
  }

  /**
   * Get FFT data for visualization
   */
  getFFTData() {
    if (!this.fftAnalyser) return null;
    return this.fftAnalyser.getValue();
  }

  /**
   * Get waveform data for visualization
   */
  getWaveformData() {
    if (!this.waveAnalyser) return null;
    return this.waveAnalyser.getValue();
  }

  /**
   * Set master volume
   */
  setVolume(value) {
    if (!this.masterGain) return;
    this.masterGain.gain.rampTo(value, 0.1);
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.pianoSampler) this.pianoSampler.dispose();
    if (this.masterGain) this.masterGain.dispose();
    if (this.toneEQ) this.toneEQ.dispose();
    if (this.toneFilter) this.toneFilter.dispose();
    if (this.stereo) this.stereo.dispose();
    if (this.compressor) this.compressor.dispose();
    if (this.algoReverb) this.algoReverb.dispose();
    if (this.hallConvolution) this.hallConvolution.dispose();
    
    this.audioReady = false;
    this.loaded = false;
  }
}
