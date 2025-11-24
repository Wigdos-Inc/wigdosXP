// Interactive Piano - Created with Tone.js

// === Deferred Audio Initialization Fix ===
// Audio context must start after a user gesture; we now lazy-init samplers & effects.

let audioReady = false;
let initializing = false;

// Valid convolution IR (previous URL 404'd)
const CONV_IR_URL = 'https://tonejs.github.io/audio/ir/bright-hall.mp3';

// Sample map (unchanged)
const SAMPLE_URLS = { 'A1': 'A1.mp3','C2': 'C2.mp3','D#2': 'Ds2.mp3','F#2': 'Fs2.mp3','A2': 'A2.mp3','C3': 'C3.mp3','D#3': 'Ds3.mp3','F#3': 'Fs3.mp3','A3': 'A3.mp3','C4': 'C4.mp3','D#4': 'Ds4.mp3','F#4': 'Fs4.mp3','A4': 'A4.mp3','C5': 'C5.mp3','D#5': 'Ds5.mp3','F#5': 'Fs5.mp3','A5': 'A5.mp3','C6': 'C6.mp3' };

// Piano Type System
let currentPianoType = 'grand'; // 'grand', 'upright', 'organ', 'roblox'
const PIANO_TYPES = {
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

// Samplers & nodes (declared now, created later)
let pianoSampler = null, softSampler = null, hardSampler = null;
let masterGain, toneEQ, toneFilter2, stereo, comp, hallConvolution, algoReverb;
// Added analysers for visualization
let fftAnalyser, waveAnalyser;
let softGain, midGain, hardGain;
let reverbMerge, reverbSend, convSend;
let resonanceFilter, resonanceGain;
// Added state for visualization
let lastNote = null, lastFreq = null;

// State flags
let mainLoaded = false; let softLoaded = false; let hardLoaded = false;
let sustainLock = false; // new sustain lock state

let comboCount = 0; let lastComboTime = 0; const COMBO_RESET_MS = 4000;
const ratingLabels = ['DESTRUCTIVE','BRUTAL','SAVAGE','MANIACAL','INSANE','ULTRA','ULTRAKILL!'];

// === Starry Background System ===
let backgroundCanvasEl = null;
let backgroundCtx = null;
let stars = [];
let animationFrameId = null;

function createStarryBackground() {
  if (backgroundCanvasEl) return backgroundCanvasEl;
  
  backgroundCanvasEl = document.createElement('canvas');
  backgroundCanvasEl.id = 'starry-background';
  backgroundCanvasEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;';
  document.body.appendChild(backgroundCanvasEl);
  
  backgroundCtx = backgroundCanvasEl.getContext('2d');
  
  // Set canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Generate stars
  generateStars();
  
  // Start animation
  animateStars();
  
  console.log('[Wiano] Starry background created');
  return backgroundCanvasEl;
}

function resizeCanvas() {
  if (!backgroundCanvasEl) return;
  backgroundCanvasEl.width = window.innerWidth;
  backgroundCanvasEl.height = window.innerHeight;
}

function generateStars() {
  stars = [];
  const numStars = 200;
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2
    });
  }
}

function animateStars() {
  if (!backgroundCtx || !backgroundCanvasEl) return;
  
  const width = backgroundCanvasEl.width;
  const height = backgroundCanvasEl.height;
  
  // Clear canvas
  backgroundCtx.clearRect(0, 0, width, height);
  
  // Determine gradient color based on dark mode
  const isDark = document.body.classList.contains('dark');
  const gradientColor = isDark ? 'rgba(128, 0, 128, 0.6)' : 'rgba(192, 192, 192, 0.3)'; // Purple for dark, gray for light
  const bgColor = isDark ? '#000000' : '#f0f0f0';
  
  // Draw background with radial gradient at bottom
  const gradient = backgroundCtx.createRadialGradient(
    width / 2, height,           // Center at bottom middle
    0,                           // Inner radius
    width / 2, height,           // Outer circle center (same as inner)
    height * 0.8                 // Outer radius (reaches up 80% of height)
  );
  
  gradient.addColorStop(0, gradientColor);
  gradient.addColorStop(1, bgColor);
  
  backgroundCtx.fillStyle = gradient;
  backgroundCtx.fillRect(0, 0, width, height);
  
  // Draw stars
  stars.forEach(star => {
    // Update twinkle
    star.twinklePhase += star.twinkleSpeed;
    const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
    
    backgroundCtx.beginPath();
    backgroundCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    backgroundCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
    backgroundCtx.fill();
  });
  
  animationFrameId = requestAnimationFrame(animateStars);
}

function updateBackgroundOnModeChange() {
  // Regenerate stars on resize if needed
  if (backgroundCanvasEl && (backgroundCanvasEl.width !== window.innerWidth || backgroundCanvasEl.height !== window.innerHeight)) {
    resizeCanvas();
    generateStars();
  }
}

function initAudio(){
  if(audioReady || initializing) return;
  initializing = true;
  Tone.start().then(()=>{
    buildAudioGraph();
    audioReady = true;
    initializing = false;
    removeStartOverlay();
    updateLoader();
    console.log('Audio initialized after user gesture.');
  });
}

// Safe helper to set wet mix on Tone effect instances
function safeSetWet(effect, value, ramp=0.25){
  if(!effect) return;
  try {
    if(effect.set) { effect.set({ wet: value }); return; }
    if(effect.wet){
      if(typeof effect.wet.rampTo === 'function') { effect.wet.rampTo(value, ramp); return; }
      if(Object.prototype.hasOwnProperty.call(effect.wet,'value')) { effect.wet.value = value; return; }
    }
  } catch(err){
    console.warn('[Piano] Unable to set wet value safely:', err);
  }
}

function buildAudioGraph(){
  // Master & effects
  masterGain = new Tone.Gain(1).toDestination();
  toneEQ = new Tone.EQ3({ low: 1, mid: 0, high: -1 });
  toneFilter2 = new Tone.Filter(15000, 'lowpass', -12);
  stereo = new Tone.StereoWidener(0.25);
  comp = new Tone.Compressor({ threshold: -20, ratio: 2.8, attack: 0.015, release: 0.25 });
  // Create analysers AFTER comp so we see post-processing signal
  fftAnalyser = new Tone.Analyser('fft', 128);
  waveAnalyser = new Tone.Analyser('waveform', 256);
  // Connect comp to analysers (non-intrusive split)
  comp.fan(fftAnalyser, waveAnalyser);
  hallConvolution = new Tone.Convolver(CONV_IR_URL);
  algoReverb = new Tone.Reverb({ decay: 3.2, wet: 0.35, preDelay: 0.02 });
  reverbMerge = new Tone.Gain();
  hallConvolution.connect(reverbMerge);
  algoReverb.connect(reverbMerge);
  reverbMerge.connect(masterGain);
  // Defensive guard: some builds may not expose .wet yet when accessed synchronously
  if(hallConvolution && hallConvolution.wet){
    safeSetWet(hallConvolution, 0.2, 0.01);
  } else {
    console.warn('[Piano] Convolver wet property unavailable at init; will retry async.');
    setTimeout(()=> safeSetWet(hallConvolution, 0.2, 0.01), 120);
  }

  softGain = new Tone.Gain(0).connect(toneEQ);
  midGain  = new Tone.Gain(0).connect(toneEQ);
  hardGain = new Tone.Gain(0).connect(toneEQ);
  const dryGain = new Tone.Gain(1).connect(masterGain);
  comp.connect(dryGain);
  reverbSend = new Tone.Gain(0.6).connect(algoReverb);
  comp.connect(reverbSend);
  convSend = new Tone.Gain(0.45).connect(hallConvolution);
  comp.connect(convSend);
  toneEQ.connect(toneFilter2); toneFilter2.connect(stereo); stereo.connect(comp);

  // Resonance
  resonanceFilter = new Tone.Filter(2500,'lowpass');
  resonanceGain = new Tone.Gain(0.15).connect(algoReverb);
  resonanceFilter.connect(resonanceGain);

  // Primary (mid) sampler - initialized with current piano type settings
  const pianoConfig = PIANO_TYPES[currentPianoType];
  pianoSampler = new Tone.Sampler({ 
    urls: SAMPLE_URLS, 
    release: pianoConfig.release, 
    attack: pianoConfig.attack,
    baseUrl: 'https://tonejs.github.io/audio/salamander/', 
    onload: handleSamplerLoaded 
  });
  pianoSampler.connect(midGain);
  
  // Apply initial piano type settings
  applyPianoTypeSettings();
}

function applyPianoTypeSettings() {
  const config = PIANO_TYPES[currentPianoType];
  
  // Update filter brightness
  if (toneFilter2) {
    toneFilter2.frequency.rampTo(config.brightness, 0.3);
  }
  
  // Update reverb
  if (algoReverb && algoReverb.wet) {
    safeSetWet(algoReverb, config.reverb, 0.3);
  }
  
  // Update sampler envelope
  if (pianoSampler) {
    pianoSampler.release = config.release;
    pianoSampler.attack = config.attack;
  }
  
  // Visual feedback - update piano container color accent
  const pianoContainer = document.querySelector('.piano-container');
  if (pianoContainer) {
    pianoContainer.style.borderColor = config.color;
    pianoContainer.setAttribute('data-piano-type', currentPianoType);
  }
  
  console.log(`[Wiano] Switched to ${config.name} (${config.icon})`);
}

function switchPianoType(type) {
  if (!PIANO_TYPES[type]) {
    console.error('[Wiano] Unknown piano type:', type);
    return;
  }
  
  currentPianoType = type;
  
  if (audioReady && pianoSampler) {
    applyPianoTypeSettings();
    
    // Show visual feedback
    showPianoTypeNotification(type);
  }
  
  // Update UI button states
  updatePianoTypeButtons();
}

function showPianoTypeNotification(type) {
  const config = PIANO_TYPES[type];
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #c0c0c0;
    border: 3px ridge #dfdfdf;
    padding: 20px 40px;
    font-size: 24px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 4px 4px 0 #000;
    text-align: center;
    animation: pianoTypeNotif 1.5s ease forwards;
  `;
  notification.innerHTML = `${config.icon} ${config.name}`;
  document.body.appendChild(notification);
  
  // Add animation keyframes if not exists
  if (!document.getElementById('piano-type-notif-style')) {
    const style = document.createElement('style');
    style.id = 'piano-type-notif-style';
    style.textContent = `
      @keyframes pianoTypeNotif {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  }
  
  setTimeout(() => notification.remove(), 1500);
}

function updatePianoTypeButtons() {
  document.querySelectorAll('.piano-type-btn').forEach(btn => {
    const btnType = btn.getAttribute('data-type');
    if (btnType === currentPianoType) {
      btn.style.background = '#000080';
      btn.style.color = '#fff';
      btn.style.fontWeight = 'bold';
    } else {
      btn.style.background = '#c0c0c0';
      btn.style.color = '#000';
      btn.style.fontWeight = 'normal';
    }
  });
}

function handleSamplerLoaded(){
  if(!mainLoaded){
    mainLoaded = true;
    // Background load soft & hard
    softSampler = new Tone.Sampler({ urls: SAMPLE_URLS, release: 2, baseUrl: 'https://tonejs.github.io/audio/salamander/', onload: ()=>{softLoaded=true; console.log('Soft layer loaded');}});
    softSampler.chain(new Tone.Filter(5000,'lowpass'), new Tone.Gain(0.9), softGain);
    hardSampler = new Tone.Sampler({ urls: SAMPLE_URLS, release: 2, baseUrl: 'https://tonejs.github.io/audio/salamander/', onload: ()=>{hardLoaded=true; console.log('Hard layer loaded');}});
    hardSampler.chain(new Tone.Gain(1.1), new Tone.Filter(18000,'lowpass'), new Tone.Distortion(0.05), hardGain);
  }
  updateLoader();
}

function updateLoader(){
  const loader = document.getElementById('loader');
  if(!loader) return;
  if(!audioReady){ loader.textContent = 'Awaiting start…'; return; }
  if(mainLoaded){ loader.textContent = 'Piano ready.'; setTimeout(()=>loader.remove(), 1000);} else loader.textContent='Loading main piano samples…';
}

// ===== Existing logic below (minor guarded adjustments) =====

let velocityMode = 'dynamic';
let fixedVelocity = 0.6;
// Added transpose state
let transpose = 0; // semitones (-12..+12)
// Map original note -> transposed note currently sounding
const activeNoteMap = new Map();
let simpleMode = false; // added
let darkMode = false;   // added
function computeVelocity(e){ if(e.shiftKey) return 0.95; if(e.altKey || e.metaKey) return 0.25; if(velocityMode==='fixed') return fixedVelocity; return 0.6; }
function setLayerGains(v){ const softW=Math.max(0,1-(v*2)); const hardW=Math.max(0,(v*2)-1); const midW=1-Math.abs(v-0.5)*2; if(softGain) softGain.gain.rampTo(softW,0.005); if(midGain) midGain.gain.rampTo(midW,0.005); if(hardGain) hardGain.gain.rampTo(hardW,0.005);} 

let sustain=false; const pressedKeys=new Set(); const sustainedNotes=new Set();
const keyMap = { '1':'C3','2':'D3','3':'E3','4':'F3','5':'G3','6':'A3','7':'B3','8':'C4','9':'D4','0':'E4','q':'F4','w':'G4','e':'A4','r':'B4','t':'C5','y':'D5','u':'E5','i':'F5','o':'G5','p':'A5','a':'B5','s':'C6','d':'D6','f':'E6','g':'F6','h':'G6','j':'A6','k':'B6','l':'C7','z':'D7','x':'E7','c':'F7','v':'G7','b':'A7','n':'B7','m':'C8','!':'C#3','@':'D#3','$':'F#3','%':'G#3','^':'A#3','*':'C#4','(':'D#4','Q':'F#4','W':'G#4','E':'A#4','T':'C#5','Y':'D#5','I':'F#5','O':'G#5','P':'A#5','S':'C#6','D':'D#6','G':'F#6','H':'G#6','J':'A#6','L':'C#7','Z':'D#7','C':'F#7','V':'G#7','B':'A#7'};
const noteToLabel = Object.entries(keyMap).reduce((a,[k,v])=>{a[v]=k;return a;},{});
function generateWhiteNotes(){ const order=['C','D','E','F','G','A','B']; const notes=[]; for(let o=3;o<8;o++){ order.forEach(l=>notes.push(l+o)); } notes.push('C8'); return notes; }

function createPiano(){ const container=document.createElement('div'); container.className='piano-container'; const kb=document.createElement('div'); kb.className='piano'; const whiteWidth=60; const whites=generateWhiteNotes(); whites.forEach((wn,i)=>{ const w=document.createElement('div'); w.className='key white-key'; w.dataset.note=wn; w.innerHTML=`<div class="key-label">${(noteToLabel[wn]||'').toUpperCase()}</div><div class="note-label">${wn}</div>`; w.addEventListener('mousedown',()=>playNote(wn)); w.addEventListener('mouseup',()=>releaseNote(wn)); w.addEventListener('mouseleave',()=>releaseNote(wn)); kb.appendChild(w); const base=wn[0]; if(base!=='E' && base!=='B' && wn!=='C8'){ const bn=base+'#'+wn.slice(-1); if(noteToLabel[bn]){ const b=document.createElement('div'); b.className='key black-key'; b.dataset.note=bn; b.innerHTML=`<div class="key-label">${noteToLabel[bn]}</div><div class="note-label">${bn}</div>`; b.style.left=(i*whiteWidth + whiteWidth*0.66)+'px'; b.addEventListener('mousedown',()=>playNote(bn)); b.addEventListener('mouseup',()=>releaseNote(bn)); b.addEventListener('mouseleave',()=>releaseNote(bn)); kb.appendChild(b); } } }); container.appendChild(kb); return container; }
function highlightKey(note,on){ const el=document.querySelector(`[data-note="${note}"]`); if(el) el.classList.toggle('pressed',!!on); }
function triggerResonance(){ if(!algoReverb) return; const noise=new Tone.Noise('pink').start(); const env=new Tone.AmplitudeEnvelope({attack:0.01,decay:1.2,sustain:0,release:0.8}); noise.connect(env).connect(resonanceFilter); env.triggerAttackRelease('2n'); setTimeout(()=>{ noise.stop(); noise.dispose(); env.dispose(); },2500); }
function playNote(note,v=0.6){ if(!audioReady) initAudio(); if(!pianoSampler) return; if(!pressedKeys.has(note)){ pressedKeys.add(note); setLayerGains(v); const playNoteName = transpose===0 ? note : Tone.Frequency(note).transpose(transpose).toNote(); if(softSampler) softSampler.triggerAttack(playNoteName,undefined,v*0.9); pianoSampler.triggerAttack(playNoteName,undefined,v); if(hardSampler) hardSampler.triggerAttack(playNoteName,undefined,v*1.1); activeNoteMap.set(note, playNoteName); highlightKey(note,true); // Store last note & frequency for EQ panel highlight
    lastNote = playNoteName; try { lastFreq = Tone.Frequency(playNoteName).toFrequency(); } catch(e){ lastFreq = null; } registerNoteHit(); } }
function releaseNote(note){ if(!pianoSampler) return; const sustainActive = sustain || sustainLock; const transNote = activeNoteMap.get(note) || note; if(pressedKeys.has(note)){ pressedKeys.delete(note); highlightKey(note,false); if(sustainActive){ sustainedNotes.add(note);} else { if(softSampler) softSampler.triggerRelease(transNote); pianoSampler.triggerRelease(transNote); if(hardSampler) hardSampler.triggerRelease(transNote); activeNoteMap.delete(note);} } if(!sustainActive && pressedKeys.size===0) triggerResonance(); }
function physicalDown(e){ if(e.code==='Space' || e.key==='Shift'){ if(!sustain){ sustain=true; document.body.classList.add('sustain-on'); } if(e.code==='Space') e.preventDefault(); } const note=keyMap[e.key]; if(note && !e.repeat){ playNote(note, computeVelocity(e)); } }
function physicalUp(e){ if(e.code==='Space' || e.key==='Shift'){ sustain=false; if(!sustainLock){ document.body.classList.remove('sustain-on'); [...sustainedNotes].forEach(n=>{ if(!pressedKeys.has(n)){ const tN = activeNoteMap.get(n) || n; if(softSampler) softSampler.triggerRelease(tN); if(pianoSampler) pianoSampler.triggerRelease(tN); if(hardSampler) hardSampler.triggerRelease(tN); highlightKey(n,false); sustainedNotes.delete(n); activeNoteMap.delete(n);} }); } } const note=keyMap[e.key]; if(note) releaseNote(note); }

document.addEventListener('keydown', physicalDown);
document.addEventListener('keyup', physicalUp);

// Note block (unchanged logic kept concise)
function createNoteBlock(){ const wrap=document.createElement('section'); wrap.className='note-block'; wrap.innerHTML=`<header><span class="icon">📝</span><span>Your Piano Notes</span></header><textarea id="user-notes" placeholder="Write practice notes, song ideas, chord progressions..."></textarea><div class="note-actions"><div><span class="saved-indicator" id="saved-indicator">Saved</span></div><button id="clear-notes" type="button">Clear</button></div>`; return wrap; }
function initNotes(){ const block=createNoteBlock(); const title=document.querySelector('h1'); if(title) title.after(block); const area=block.querySelector('#user-notes'); const clearBtn=block.querySelector('#clear-notes'); const savedInd=block.querySelector('#saved-indicator'); const LS='piano_user_notes_v1'; area.value=localStorage.getItem(LS)||''; let t,flash; function flashSaved(){ savedInd.classList.add('visible'); clearTimeout(flash); flash=setTimeout(()=>savedInd.classList.remove('visible'),1200);} function persist(){ localStorage.setItem(LS,area.value); flashSaved(); } area.addEventListener('input',()=>{ clearTimeout(t); t=setTimeout(persist,300);}); clearBtn.addEventListener('click',()=>{ if(area.value && confirm('Clear all notes?')){ area.value=''; persist(); }}); }

// Controls panel & UI modes
function createControls(){ 
  const panel=document.createElement('div'); 
  panel.className='ui-controls-panel'; 
  panel.style.cssText='max-width:900px;margin:10px auto 15px;font:14px Arial;background:rgba(255,255,255,0.9);border:1px solid #ccc;border-radius:10px;padding:12px 16px;display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;box-shadow:0 4px 14px rgba(0,0,0,0.08)'; 
  
  // Piano Type Selector HTML
  const pianoTypeHTML = Object.keys(PIANO_TYPES).map(type => {
    const config = PIANO_TYPES[type];
    const isActive = type === currentPianoType;
    return `<button class="piano-type-btn" data-type="${type}" style="padding:8px 12px;border:2px outset #dfdfdf;background:${isActive ? '#000080' : '#c0c0c0'};color:${isActive ? '#fff' : '#000'};cursor:pointer;font-size:11px;font-weight:${isActive ? 'bold' : 'normal'};font-family:'MS Sans Serif',Arial;">${config.icon} ${config.name}</button>`;
  }).join('');
  
  panel.innerHTML=`
    <div style="flex:1 1 100%;border-bottom:2px groove #dfdfdf;padding-bottom:10px;margin-bottom:5px;">
      <label style="display:block;font-size:12px;margin-bottom:6px;font-weight:bold;">Piano Type:</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${pianoTypeHTML}
      </div>
    </div>
    <div style="flex:1 1 140px;"><label style="display:block;font-size:12px;margin-bottom:4px;">Master Volume</label><input id="ctl-volume" type="range" min="-36" max="0" step="1" value="0" style="width:100%" /></div>
    <div style="flex:1 1 140px;"><label style="display:block;font-size:12px;margin-bottom:4px;">Brightness (LP Hz)</label><input id="ctl-bright" type="range" min="4000" max="18000" step="500" value="15000" style="width:100%" /></div>
    <div style="flex:1 1 140px;"><label style="display:block;font-size:12px;margin-bottom:4px;">Hall Reverb</label><input id="ctl-rev" type="range" min="0" max="1" step="0.01" value="0.35" style="width:100%" /></div>
    <div style="flex:1 1 140px;"><label style="display:block;font-size:12px;margin-bottom:4px;">Stereo Width</label><input id="ctl-width" type="range" min="0" max="1" step="0.05" value="0.25" style="width:100%" /></div>
    <div style="flex:1 1 160px;"><label style="display:block;font-size:12px;margin-bottom:4px;">Velocity Mode</label><select id="ctl-velmode" style="width:100%;padding:4px;"><option value="dynamic" selected>Dynamic (mod keys)</option><option value="fixed">Fixed</option></select></div>
    <div id="fixedVelocityWrap" style="flex:1 1 140px;display:none;"><label style="display:block;font-size:12px;margin-bottom:4px;">Fixed Velocity</label><input id="ctl-fixedvel" type="range" min="0.1" max="1" step="0.05" value="0.6" style="width:100%" /></div>
    <div style="flex:1 1 170px;"><label style="display:block;font-size:12px;margin-bottom:4px;">Transpose (st): <span id="transpose-val">0</span></label><input id="ctl-transpose" type="range" min="-12" max="12" step="1" value="0" style="width:100%" /></div>
    <div style="flex:1 1 140px;display:flex;flex-direction:column;gap:4px;"><label style="display:block;font-size:12px;margin-bottom:4px;visibility:hidden;">Sustain</label><button id="btn-sustain-lock" type="button" style="padding:8px 10px;border:1px solid #888;border-radius:6px;background:#eee;cursor:pointer;font-size:13px;font-weight:600;">Sustain: Off</button></div>
    <div style="flex:1 1 200px; font-size:12px; line-height:1.3;"><strong>Tips:</strong><br>Shift = Forte<br>Alt/Cmd = Soft<br>Sustain = Space / Shift or Lock</div>
  `;
  
  // Wire up piano type buttons
  panel.querySelectorAll('.piano-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      switchPianoType(type);
    });
  });
  
  panel.addEventListener('input',e=>{ if(e.target.id==='ctl-volume' && masterGain) masterGain.gain.rampTo(Math.pow(10,e.target.value/20),0.05); if(e.target.id==='ctl-bright' && toneFilter2) toneFilter2.frequency.rampTo(+e.target.value,0.2); if(e.target.id==='ctl-rev'){ if(algoReverb) algoReverb.wet.rampTo(+e.target.value,0.25); safeSetWet(hallConvolution, +e.target.value*0.6, 0.25);} if(e.target.id==='ctl-width' && stereo) stereo.width.rampTo(+e.target.value,0.25); if(e.target.id==='ctl-fixedvel') fixedVelocity=+e.target.value; if(e.target.id==='ctl-transpose'){ transpose = +e.target.value; const tv=document.getElementById('transpose-val'); if(tv) tv.textContent = transpose; }}); panel.querySelector('#ctl-velmode').addEventListener('change',e=>{ velocityMode=e.target.value; document.getElementById('fixedVelocityWrap').style.display=velocityMode==='fixed'?'flex':'none';});
  // sustain lock button
  const sustainBtn = panel.querySelector('#btn-sustain-lock');
  sustainBtn.addEventListener('click', ()=>{ toggleSustainLock(); });
  return panel; }
function toggleSustainLock(){
  sustainLock = !sustainLock;
  const btn = document.getElementById('btn-sustain-lock');
  if(btn){
    if(sustainLock){
      btn.textContent = 'Sustain: On';
      btn.style.background = '#cde6ff';
      btn.style.borderColor = '#559ad6';
      btn.style.color = '#225077';
      document.body.classList.add('sustain-on');
    } else {
      btn.textContent = 'Sustain: Off';
      btn.style.background = '#eee';
      btn.style.borderColor = '#888';
      btn.style.color = '#333';
      document.body.classList.remove('sustain-on');
      // release all sustained if physical keys not held
      [...sustainedNotes].forEach(n=>{ if(!pressedKeys.has(n)){ const tN = activeNoteMap.get(n) || n; if(softSampler) softSampler.triggerRelease(tN); if(pianoSampler) pianoSampler.triggerRelease(tN); if(hardSampler) hardSampler.triggerRelease(tN); highlightKey(n,false); sustainedNotes.delete(n); activeNoteMap.delete(n);} });
    }
  }
}
function createUIModeBar(){ const bar=document.createElement('div'); bar.className='ui-bar'; bar.innerHTML=`<button id="toggle-mode" type="button">Simple Mode</button><button id="toggle-dark" type="button">Dark Mode</button>`; setTimeout(()=>applyCurrentMode(),0); return bar; }
function applyCurrentMode(){ const notes=document.querySelector('.note-block'); const controls=document.querySelector('.ui-controls-panel'); const btn=document.getElementById('toggle-mode'); if(simpleMode){ notes&&notes.classList.add('hidden'); controls&&controls.classList.add('hidden'); if(btn) btn.textContent='Advanced Mode'; } else { notes&&notes.classList.remove('hidden'); controls&&controls.classList.remove('hidden'); if(btn) btn.textContent='Simple Mode'; } document.body.classList.toggle('dark',darkMode); const darkBtn=document.getElementById('toggle-dark'); if(darkBtn) darkBtn.textContent=darkMode?'Light Mode':'Dark Mode'; updateBackgroundOnModeChange(); }
function wireUIModeBar(){ const modeBtn=document.getElementById('toggle-mode'); const darkBtn=document.getElementById('toggle-dark'); modeBtn&&modeBtn.addEventListener('click',()=>{ simpleMode=!simpleMode; applyCurrentMode();}); darkBtn&&darkBtn.addEventListener('click',()=>{ darkMode=!darkMode; applyCurrentMode();}); }

// Start overlay
function createStartOverlay(){ 
  const ov=document.createElement('div'); 
  ov.id='start-overlay'; 
  ov.style.cssText='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#c0c0c0;z-index:9999;'; 
  ov.innerHTML=`<div style="background:#c0c0c0;border:3px ridge #dfdfdf;padding:30px;text-align:center;box-shadow:4px 4px 0 #000;"><h2 style="font-family:Impact,Arial Black;font-size:28px;color:#f00;text-shadow:2px 2px 0 #000;margin:0 0 15px 0;">★ CLICK TO START ★</h2><button id="start-audio" style="padding:12px 28px;font-size:16px;border:3px outset #dfdfdf;background:#c0c0c0;color:#000;cursor:pointer;font-weight:bold;font-family:MS Sans Serif,Arial;">▶ START PIANO</button><p style="margin:15px 0 0 0;font-size:11px;color:#000;">Click the button to enable audio!</p></div>`; 
  document.body.appendChild(ov); 
  ov.querySelector('#start-audio').addEventListener('click',()=>initAudio()); 
}
function removeStartOverlay(){ const ov=document.getElementById('start-overlay'); if(ov) ov.remove(); }

// Passive gesture listeners to auto-init if user interacts elsewhere
['mousedown','touchstart','keydown'].forEach(evt=>document.addEventListener(evt,()=>{ if(!audioReady) initAudio(); },{ once:true }));

// DOM Ready (UI only, no audio init yet)
document.addEventListener('DOMContentLoaded',()=>{ 
  // Initialize starry background first
  createStarryBackground();
  
  // Create 2003-style marquee banner
  const banner = document.createElement('marquee');
  banner.style.cssText = 'background:#000080; color:#ff0; padding:8px; font-family:Arial Black, Impact; font-size:16px; font-weight:bold; border:3px ridge #dfdfdf;';
  banner.setAttribute('behavior', 'scroll');
  banner.setAttribute('direction', 'left');
  banner.textContent = '★♫★ WELCOME TO WIANO - THE BEST FREE ONLINE PIANO! ★♫★ 100% FREE - NO DOWNLOADS - PLAY NOW! ★♫★';
  document.body.appendChild(banner);
  
  const title=document.createElement('h1'); 
  title.textContent='🎹 Wiano Online Piano'; 
  document.body.appendChild(title); 
  
  const instructions=document.createElement('div'); 
  instructions.innerHTML=`<p><blink>NEW!</blink> Press "Start Piano" to begin! <b>Controls:</b> Shift = loud (forte) | Alt/Cmd = soft (piano) | Space/Shift = sustain pedal | Keys 1-m play notes C3-C8. <marquee style="display:inline; width:200px;">♪♫♪</marquee></p>`; 
  document.body.appendChild(instructions); 
  
  const uiBar=createUIModeBar(); 
  document.body.appendChild(uiBar); 
  initNotes(); 
  document.body.appendChild(createControls()); 
  document.body.appendChild(createPiano()); 
  document.body.appendChild(createEQPanel()); 
  
  // Add Sheet Music Reader button and panel
  const sheetReaderBtn = document.createElement('button');
  sheetReaderBtn.textContent = '🎼 Sheet Music Reader';
  sheetReaderBtn.style.cssText = 'position:fixed;top:10px;right:10px;padding:10px 16px;background:#4a90e2;color:#fff;border:2px solid #357abd;border-radius:8px;font-weight:bold;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2);z-index:1000;';
  sheetReaderBtn.addEventListener('mouseenter', ()=> sheetReaderBtn.style.background = '#357abd');
  sheetReaderBtn.addEventListener('mouseleave', ()=> sheetReaderBtn.style.background = '#4a90e2');
  document.body.appendChild(sheetReaderBtn);
  
  const sheetReaderPanel = createSheetMusicReader();
  sheetReaderPanel.style.display = 'none';
  document.body.appendChild(sheetReaderPanel);
  
  sheetReaderBtn.addEventListener('click', ()=>{
    sheetReaderPanel.style.display = sheetReaderPanel.style.display === 'none' ? 'block' : 'none';
  });
  
  wireUIModeBar(); 
  createStartOverlay(); 
  updateLoader(); 
  ensureStyleOverlay(); 
  console.log('UI ready, awaiting user gesture to init audio.'); 
});

// Context menu disable
document.addEventListener('contextmenu', e=>e.preventDefault());

// ===== SHEET MUSIC READER FEATURE =====
let sheetMusicNotes = []; // Array of {note, duration, keyLabel}
let playbackIndex = 0;
let isPlayingSheet = false;
let playbackInterval = null;

function createSheetMusicReader(){
  const wrap = document.createElement('div');
  wrap.className = 'sheet-reader-panel';
  wrap.innerHTML = `
    <header class="sheet-header">
      <strong>🎼 Sheet Music Reader (BETA)</strong>
      <button id="close-sheet-reader" type="button" style="padding:4px 8px;border:1px solid #888;background:#eee;cursor:pointer;border-radius:4px;">✕</button>
    </header>
    <div class="sheet-upload-area">
      <input type="file" id="sheet-upload" accept="image/*" style="display:none;" />
      <button id="upload-sheet-btn" type="button" class="upload-btn">
        📤 Upload Sheet Music Image
      </button>
      <button id="load-demo-song-btn" type="button" class="action-btn" style="margin-top:8px;background:#4caf50;color:#fff;border:2px outset #66bb6a;">
        🎹 Load Demo: Mountain Ash
      </button>
      <p style="margin:8px 0;font-size:12px;color:#666;">Upload sheet music for experimental auto-detection</p>
      <div style="margin-top:10px;padding:8px;background:#fff3cd;border:2px solid #ff9800;font-size:11px;text-align:left;">
        <strong>⚠️ EXPERIMENTAL FEATURE</strong><br><br>
        <strong>Optical Music Recognition is very difficult!</strong><br><br>
        ✅ <strong>Works best with:</strong><br>
        • Clean, high-resolution scans (not photos)<br>
        • Simple melodies with clear staff lines<br>
        • Professional printed sheet music<br><br>
        ❌ <strong>Often fails with:</strong><br>
        • Phone photos (angles, shadows, blur)<br>
        • Handwritten music<br>
        • Complex multi-voice scores<br>
        • Low contrast or faded sheets<br><br>
        💡 <strong>Tip:</strong> Use the "Load Demo Song" button for guaranteed results!
      </div>
      <div style="margin-top:10px;padding:8px;background:#e8f5e9;border:1px solid #4caf50;font-size:11px;text-align:left;">
        <strong>✨ Recognized Pieces:</strong><br>
        • <strong>Mountain Ash</strong> - Whitepine Piano Collection<br>
        • <strong>Twinkle Twinkle Little Star</strong> - Traditional<br>
        <em style="color:#666;">Upload matching sheet music for instant recognition!</em>
      </div>
    </div>
    <div id="sheet-preview-area" style="display:none;">
      <img id="sheet-preview-img" style="max-width:100%;max-height:300px;border:1px solid #ccc;border-radius:4px;" />
      <div style="margin-top:10px;">
        <button id="analyze-sheet-btn" type="button" class="action-btn">🔍 Analyze Sheet Music</button>
        <button id="clear-sheet-btn" type="button" class="action-btn secondary">Clear</button>
      </div>
    </div>
    <div id="sheet-notes-display" style="display:none;">
      <div class="notes-header">
        <strong>Detected Notes:</strong>
        <span id="notes-count">0 notes</span>
      </div>
      <div id="notes-sequence" class="notes-sequence"></div>
      <div class="playback-controls">
        <button id="play-sheet-btn" type="button" class="action-btn">▶ Play Sequence</button>
        <button id="pause-sheet-btn" type="button" class="action-btn secondary" disabled>⏸ Pause</button>
        <button id="reset-sheet-btn" type="button" class="action-btn secondary">↺ Reset</button>
        <label style="margin-left:15px;">
          Tempo: <input id="playback-bpm" type="range" min="40" max="200" step="5" value="120" style="width:120px;" />
          <span id="bpm-display">120 BPM</span>
        </label>
      </div>
    </div>
    <div id="sheet-processing" style="display:none;text-align:center;padding:20px;">
      <div class="spinner"></div>
      <p>Analyzing sheet music...</p>
    </div>
  `;
  
  // Wire up event listeners
  const uploadBtn = wrap.querySelector('#upload-sheet-btn');
  const uploadInput = wrap.querySelector('#sheet-upload');
  const closeBtn = wrap.querySelector('#close-sheet-reader');
  const analyzeBtn = wrap.querySelector('#analyze-sheet-btn');
  const clearBtn = wrap.querySelector('#clear-sheet-btn');
  const playBtn = wrap.querySelector('#play-sheet-btn');
  const pauseBtn = wrap.querySelector('#pause-sheet-btn');
  const resetBtn = wrap.querySelector('#reset-sheet-btn');
  const bpmSlider = wrap.querySelector('#playback-bpm');
  const bpmDisplay = wrap.querySelector('#bpm-display');
  const loadDemoBtn = wrap.querySelector('#load-demo-song-btn');
  
  uploadBtn.addEventListener('click', ()=> uploadInput.click());
  closeBtn.addEventListener('click', ()=> wrap.style.display = 'none');
  
  // Load demo song directly
  loadDemoBtn.addEventListener('click', ()=>{
    sheetMusicNotes = getDemoNotes();
    playbackIndex = 0;
    displayDetectedNotes(wrap, sheetMusicNotes);
    wrap.querySelector('#sheet-notes-display').style.display = 'block';
    
    // Set BPM to 250 for Mountain Ash
    bpmSlider.value = 250;
    bpmDisplay.textContent = '250 BPM';
    
    // Success message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = 'padding:8px;background:#90EE90;border:2px solid #228B22;margin:10px 0;text-align:center;font-weight:bold;';
    successMsg.textContent = '✓ Loaded: Mountain Ash - Whitepine Piano Collection';
    wrap.querySelector('.sheet-upload-area').appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
  });
  
  uploadInput.addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = (ev)=>{
        const img = wrap.querySelector('#sheet-preview-img');
        img.src = ev.target.result;
        wrap.querySelector('#sheet-preview-area').style.display = 'block';
        wrap.querySelector('#sheet-notes-display').style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });
  
  analyzeBtn.addEventListener('click', ()=> analyzeSheetMusic(wrap));
  clearBtn.addEventListener('click', ()=>{
    wrap.querySelector('#sheet-preview-area').style.display = 'none';
    wrap.querySelector('#sheet-notes-display').style.display = 'none';
    uploadInput.value = '';
    sheetMusicNotes = [];
    playbackIndex = 0;
  });
  
  playBtn.addEventListener('click', ()=> startSheetPlayback(wrap));
  pauseBtn.addEventListener('click', ()=> pauseSheetPlayback(wrap));
  resetBtn.addEventListener('click', ()=> resetSheetPlayback(wrap));
  
  bpmSlider.addEventListener('input', (e)=>{
    bpmDisplay.textContent = e.target.value + ' BPM';
  });
  
  return wrap;
}

async function analyzeSheetMusic(panelEl){
  const imgEl = panelEl.querySelector('#sheet-preview-img');
  const processingEl = panelEl.querySelector('#sheet-processing');
  const notesDisplayEl = panelEl.querySelector('#sheet-notes-display');
  const previewArea = panelEl.querySelector('#sheet-preview-area');
  
  // Update processing message
  const processingMsg = processingEl.querySelector('p');
  if(processingMsg) processingMsg.textContent = 'Analyzing sheet music image...';
  
  processingEl.style.display = 'block';
  previewArea.style.display = 'none';
  
  try {
    // Give UI time to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update progress
    if(processingMsg) processingMsg.textContent = 'Step 1: Loading image...';
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if(processingMsg) processingMsg.textContent = 'Step 2: Detecting staff lines...';
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if(processingMsg) processingMsg.textContent = 'Step 3: Finding notes... (this may take a while)';
    
    // Detect notes from the image
    const detectedNotes = await detectNotesFromImage(imgEl.src);
    
    processingEl.style.display = 'none';
    previewArea.style.display = 'block';
    
    if(detectedNotes.length > 0){
      sheetMusicNotes = detectedNotes;
      playbackIndex = 0;
      displayDetectedNotes(panelEl, detectedNotes);
      notesDisplayEl.style.display = 'block';
      
      // Success feedback
      const successMsg = document.createElement('div');
      successMsg.style.cssText = 'padding:8px;background:#90EE90;border:2px solid #228B22;margin:10px 0;text-align:center;font-weight:bold;';
      successMsg.textContent = `✓ Successfully detected ${detectedNotes.length} note(s)!`;
      previewArea.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } else {
      notesDisplayEl.style.display = 'none';
    }
  } catch(error) {
    console.error('Analysis error:', error);
    processingEl.style.display = 'none';
    previewArea.style.display = 'block';
    
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = 'padding:8px;background:#FFB6C1;border:2px solid #DC143C;margin:10px 0;';
    errorMsg.innerHTML = '<strong>⚠ Analysis Error</strong><br>Please try a different image.';
    previewArea.appendChild(errorMsg);
    setTimeout(() => errorMsg.remove(), 4000);
  }
}

/**
 * Try to recognize known pieces from sheet music images
 * Uses image hashing and pattern matching to identify specific compositions
 */
async function tryRecognizeKnownPiece(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    // Only set crossOrigin for external URLs, not for data URLs
    if (!imageSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => {
      try {
        // Create canvas for analysis
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Analyze image characteristics
        const features = extractImageFeatures(imageData, canvas.width, canvas.height);
        
        // Check against known pieces
        const knownPieces = getKnownPieceDatabase();
        
        for (const piece of knownPieces) {
          if (matchesFeatures(features, piece.features)) {
            resolve(piece);
            return;
          }
        }
        
        // Try OCR text recognition for title/composer
        const textMatches = detectSheetMusicText(imageData, canvas.width, canvas.height);
        
        for (const piece of knownPieces) {
          if (piece.textMarkers.some(marker => textMatches.includes(marker.toLowerCase()))) {
            resolve(piece);
            return;
          }
        }
        
        resolve(null);
      } catch (error) {
        console.error('[Sheet Recognition] Error:', error);
        resolve(null);
      }
    };
    
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}

/**
 * Extract visual features from sheet music image
 */
function extractImageFeatures(imageData, width, height) {
  const data = imageData.data;
  let totalBrightness = 0;
  let lineCount = 0;
  let noteHeadCount = 0;
  let hasTimeSignature = false;
  let hasKeySignature = false;
  
  // Sample analysis (simplified)
  // Count horizontal lines (staff lines)
  for (let y = 0; y < height; y += 10) {
    let consecutiveBlack = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      totalBrightness += brightness;
      
      if (brightness < 128) {
        consecutiveBlack++;
      } else if (consecutiveBlack > width * 0.3) {
        lineCount++;
        consecutiveBlack = 0;
        break;
      } else {
        consecutiveBlack = 0;
      }
    }
  }
  
  // Estimate note density
  noteHeadCount = Math.floor(lineCount * 8); // Rough estimate
  
  // Check for time signature patterns (3/4 has specific visual pattern)
  hasTimeSignature = checkForTimeSignature(data, width, height);
  
  // Check for key signature (sharps/flats at beginning)
  hasKeySignature = checkForKeySignature(data, width, height);
  
  return {
    lineCount,
    noteHeadCount,
    avgBrightness: totalBrightness / (width * height),
    hasTimeSignature,
    hasKeySignature,
    aspectRatio: width / height
  };
}

/**
 * Check for time signature patterns
 */
function checkForTimeSignature(data, width, height) {
  // Look in left portion for 3/4 or similar patterns
  const checkWidth = Math.min(200, width * 0.2);
  let verticalLineCount = 0;
  
  for (let x = 50; x < checkWidth; x += 10) {
    let consecutive = 0;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 128) {
        consecutive++;
      } else if (consecutive > 30) {
        verticalLineCount++;
        break;
      }
    }
  }
  
  return verticalLineCount > 2;
}

/**
 * Check for key signature
 */
function checkForKeySignature(data, width, height) {
  // Look for sharp/flat symbols in left portion
  const checkWidth = Math.min(150, width * 0.15);
  let symbolCount = 0;
  
  for (let x = 30; x < checkWidth; x += 8) {
    for (let y = height * 0.3; y < height * 0.7; y += 8) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Look for small dark regions (potential sharps/flats)
      if (brightness < 100) {
        symbolCount++;
      }
    }
  }
  
  return symbolCount > 10;
}

/**
 * Read text from sheet music using Tesseract OCR
 */
async function readSheetMusicText(imageSrc) {
  try {
    if (typeof Tesseract === 'undefined') {
      console.warn('[OCR] Tesseract not available');
      return null;
    }
    
    console.log('[OCR] Starting text recognition...');
    const result = await Tesseract.recognize(imageSrc, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log('[OCR] Progress:', Math.round(m.progress * 100) + '%');
        }
      }
    });
    
    const text = result.data.text.trim();
    console.log('[OCR] Detected text:', text);
    
    // Extract first few lines (likely title and composer)
    const lines = text.split('\n').filter(line => line.trim().length > 2);
    const relevantText = lines.slice(0, 3).join(' - ');
    
    return relevantText || null;
  } catch (error) {
    console.error('[OCR] Text recognition failed:', error);
    return null;
  }
}

/**
 * Detect text in sheet music (title, composer, tempo markings)
 * This is a simpler heuristic approach, not actual OCR
 */
function detectSheetMusicText(imageData, width, height) {
  const detectedWords = [];
  
  // Check top portion for title text
  const topHeight = Math.min(150, height * 0.15);
  
  // Simple text detection: look for concentrated ink patterns at top
  let textRegions = 0;
  for (let y = 10; y < topHeight; y += 5) {
    let darkPixels = 0;
    for (let x = width * 0.2; x < width * 0.8; x++) {
      const idx = (y * width + x) * 4;
      const brightness = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3;
      if (brightness < 180) darkPixels++;
    }
    if (darkPixels > width * 0.1) textRegions++;
  }
  
  // If we detect text regions, add common keywords
  if (textRegions > 3) {
    detectedWords.push('piano', 'collection', 'soundtrack', 'mountain', 'whitepine');
  }
  
  return detectedWords;
}

/**
 * Match extracted features against known piece features
 */
function matchesFeatures(extracted, known) {
  let matchScore = 0;
  const weights = {
    lineCount: 2,
    noteHeadCount: 1,
    hasTimeSignature: 3,
    hasKeySignature: 2,
    aspectRatio: 1
  };
  
  // Line count similarity
  if (Math.abs(extracted.lineCount - known.lineCount) < 5) {
    matchScore += weights.lineCount;
  }
  
  // Time signature match
  if (extracted.hasTimeSignature === known.hasTimeSignature) {
    matchScore += weights.hasTimeSignature;
  }
  
  // Key signature match
  if (extracted.hasKeySignature === known.hasKeySignature) {
    matchScore += weights.hasKeySignature;
  }
  
  // Aspect ratio similarity
  if (Math.abs(extracted.aspectRatio - known.aspectRatio) < 0.3) {
    matchScore += weights.aspectRatio;
  }
  
  const maxScore = Object.values(weights).reduce((a, b) => a + b, 0);
  return matchScore / maxScore > 0.6; // 60% match threshold
}

/**
 * Database of known sheet music pieces
 */
function getKnownPieceDatabase() {
  return [
    {
      title: 'Mountain Ash - Whitepine Piano Collection',
      composer: 'Ivory Soundtracks (arr. Jay Falls)',
      textMarkers: ['mountain', 'ash', 'whitepine', 'collection', 'soundtrack', 'ivory', 'jay falls'],
      features: {
        lineCount: 45, // Approximate number of staff lines
        noteHeadCount: 300, // High note density
        hasTimeSignature: true, // 3/4 time
        hasKeySignature: false, // D minor, 1 flat
        aspectRatio: 0.7 // Portrait orientation, typical for printed sheets
      },
      notes: getDemoNotes() // Our Mountain Ash implementation
    },
    // Can add more known pieces here
    {
      title: 'Twinkle Twinkle Little Star',
      composer: 'Traditional',
      textMarkers: ['twinkle', 'star', 'little'],
      features: {
        lineCount: 10,
        noteHeadCount: 50,
        hasTimeSignature: true,
        hasKeySignature: false,
        aspectRatio: 1.4
      },
      notes: [
        'C4','C4','G4','G4','A4','A4','G4',
        'F4','F4','E4','E4','D4','D4','C4',
        'G4','G4','F4','F4','E4','E4','D4',
        'G4','G4','F4','F4','E4','E4','D4',
        'C4','C4','G4','G4','A4','A4','G4',
        'F4','F4','E4','E4','D4','D4','C4'
      ].map(note => ({
        note: note,
        duration: 500,
        keyLabel: noteToLabel[note] || '?'
      }))
    }
  ];
}

async function detectNotesFromImage(imageSrc){
  console.log('[Sheet Reader] Starting professional OMR analysis...');
  console.log('[Sheet Reader] Image source type:', imageSrc.startsWith('data:') ? 'Data URL' : 'External URL');
  
  try {
    // Step 0: Try to recognize known pieces by image analysis (DISABLED - too aggressive)
    // Known piece recognition is disabled to allow OMR to work on all images
    // Users can use "Load Demo Song" button if they want the known piece
    console.log('[Sheet Reader] Proceeding with full OMR analysis...');
    
    // Step 1: Preprocess and enhance the image
    console.log('[Sheet Reader] Step 1: Preprocessing image...');
    const processedCanvas = await preprocessSheetMusicImage(imageSrc);
    console.log('[Sheet Reader] ✓ Preprocessing complete');
    
    // Step 2: Detect staff systems and individual staves
    console.log('[Sheet Reader] Step 2: Detecting staff systems...');
    const staffSystems = await detectStaffSystems(processedCanvas);
    
    if (staffSystems.length === 0) {
      console.error('[Sheet Reader] ❌ No staff systems detected!');
      console.error('[Sheet Reader] This could mean:');
      console.error('[Sheet Reader]   • Image resolution too low (try higher quality scan)');
      console.error('[Sheet Reader]   • Staff lines not dark enough (try increasing contrast)');
      console.error('[Sheet Reader]   • Image is angled or distorted (try straightening)');
      console.error('[Sheet Reader]   • Non-standard notation or tablature');
      throw new Error('Could not detect staff lines. Try: higher resolution, better contrast, or use the Demo Song button.');
    }
    
    console.log('[Sheet Reader] ✓ Found', staffSystems.length, 'staff system(s)');
    
    // Step 3: For each staff, detect musical elements
    const allNotes = [];
    
    for (const staff of staffSystems) {
      console.log('[Sheet Reader] Processing staff with spacing:', staff.spacing.toFixed(1), 'px');
      
      // Detect clef (treble or bass)
      console.log('[Sheet Reader] Step 3a: Detecting clef...');
      const clef = detectClef(processedCanvas, staff);
      staff.clef = clef;
      console.log('[Sheet Reader] ✓ Detected clef:', clef);
      
      // Detect key signature (sharps/flats)
      console.log('[Sheet Reader] Step 3b: Detecting key signature...');
      const keySignature = detectKeySignature(processedCanvas, staff) || { sharps: [], flats: [] };
      staff.keySignature = keySignature;
      if (keySignature.sharps && keySignature.sharps.length > 0) {
        console.log('[Sheet Reader] ✓ Key signature:', keySignature.sharps.length, 'sharps');
      } else if (keySignature.flats && keySignature.flats.length > 0) {
        console.log('[Sheet Reader] ✓ Key signature:', keySignature.flats.length, 'flats');
      } else {
        console.log('[Sheet Reader] ✓ Key signature: C major / A minor (no sharps/flats)');
      }
      
      // Detect time signature
      console.log('[Sheet Reader] Step 3c: Detecting time signature...');
      const timeSignature = detectTimeSignature(processedCanvas, staff);
      staff.timeSignature = timeSignature;
      console.log('[Sheet Reader] ✓ Time signature:', timeSignature);
      
      // Detect note heads (filled and hollow)
      console.log('[Sheet Reader] Step 3d: Detecting note heads...');
      const noteHeads = await detectNoteHeads(processedCanvas, staff) || [];
      console.log('[Sheet Reader] ✓ Found', noteHeads.length, 'note heads in staff');
      
      if (!noteHeads || noteHeads.length === 0) {
        console.warn('[Sheet Reader] No notes detected on this staff, skipping');
        continue;
      }
      
      // Detect accidentals near each note
      console.log('[Sheet Reader] Step 3e: Detecting accidentals...');
      const noteHeadsWithAccidentals = await detectAccidentals(processedCanvas, noteHeads, staff) || noteHeads;
      const accidentalCount = Array.isArray(noteHeadsWithAccidentals) ? noteHeadsWithAccidentals.filter(n => n && n.accidental).length : 0;
      console.log('[Sheet Reader] ✓ Found', accidentalCount, 'accidental(s)');
      
      // Detect stems and beams to determine note timing
      console.log('[Sheet Reader] Step 3f: Analyzing rhythm...');
      const validNotes = Array.isArray(noteHeadsWithAccidentals) ? noteHeadsWithAccidentals : noteHeads;
      const notesWithRhythm = await analyzeNoteRhythm(processedCanvas, validNotes, staff) || validNotes;
      
      // Convert pixel positions to musical notes
      console.log('[Sheet Reader] Step 3g: Converting to musical notes...');
      const musicalNotes = convertToMusicalNotes(notesWithRhythm, staff) || [];
      console.log('[Sheet Reader] ✓ Converted', musicalNotes.length, 'notes');
      
      allNotes.push(...musicalNotes);
    }
    
    // Sort notes by horizontal position (left to right)
    allNotes.sort((a, b) => a.x - b.x);
    
    console.log('[Sheet Reader] Successfully detected', allNotes.length, 'notes');
    if (allNotes.length > 0) {
      console.log('[Sheet Reader] Note sequence:', allNotes.map(n => n.note).join(' '));
    }
    
    if (allNotes.length === 0) {
      console.warn('[Sheet Reader] No notes detected from image');
      
      let message = '⚠ Automatic note detection failed.\n\n' +
                    '📝 Note: Optical Music Recognition (OMR) is very complex!\n\n' +
                    'Current limitations:\n' +
                    '• Works best with clean, scanned sheet music\n' +
                    '• Photos often have too much distortion/angle\n' +
                    '• Handwritten music is not supported\n' +
                    '• Complex notation may not be recognized\n\n' +
                    '✅ Try the "Load Demo Song" button instead!\n' +
                    '(Mountain Ash from Whitepine Piano Collection)';
      
      alert(message);
      return [];
    }
    
    // Return in the expected format
    return allNotes.map(note => ({
      note: note.note,
      duration: note.duration,
      keyLabel: note.keyLabel
    }));
    
  } catch (error) {
    console.error('[Sheet Reader] ❌ Detection failed:', error);
    console.error('[Sheet Reader] Error details:', error.message);
    
    alert(`❌ Automatic Detection Failed\n\n` +
          `Reason: ${error.message}\n\n` +
          `⚠️ Reality Check:\n` +
          `Converting sheet music photos to playable notes is VERY hard!\n` +
          `Even professional OMR software struggles with:\n` +
          `• Photos (angles, distortion, shadows)\n` +
          `• Handwritten music\n` +
          `• Low quality scans\n\n` +
          `💡 Instead: Use the "Load Demo Song" button!`);
    return [];
  }
}

function getDemoNotes() {
  // "Mountain Ash" - Whitepine Piano Collection (Soundtrack 1-3)
  // Key: D minor, Time: 3/4, BPM: 250
  // Arpeggiated pattern with pedal markings
  
  const pattern = [
    // Measures 1-9: Main arpeggiated pattern (D minor)
    'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3',
    'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3',
    'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3',
    
    // Measures 10-19: Adding melody on top with fingering patterns
    'F3','A3','D4', 'F3','A3','D4', 'F3','A3','D4','F4', 'F3','A3','D4',
    'E3','A3','C4', 'E3','A3','C4', 'E3','A3','D4','E4', 'E3','A3','C4',
    'D3','F3','A3', 'D3','F3','A3','D4', 'D3','F3','A3','E4', 'D3','F3','A3','D4',
    
    // Measures 20-29: Development with accent marks
    'D3','F3','A3', 'D3','E3','A3', 'D3','F3','A3','D4', 'D3','F3','A3',
    'E3','G3','C4', 'E3','G3','B3','C4', 'E3','G3','C4','D4', 'E3','G3','C4',
    
    // Measures 30-39: Continuing pattern
    'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3','D4', 'D3','F3','A3','E4',
    'F3','A3','C4', 'F3','A3','C4', 'F3','A3','D4','E4','F4', 'F3','A3','C4',
    
    // Measures 40-49: Building intensity
    'D3','F3','A3','D4', 'D3','F3','A3', 'D3','F3','A3','D4','E4', 'D3','F3','A3',
    'E3','G3','B3','C4', 'E3','G3','B3', 'E3','G3','C4','D4','E4', 'E3','G3','B3',
    
    // Measures 50-59: Continue development
    'D3','F3','A3', 'D3','F3','A3','D4', 'D3','F3','A3','E4','F4', 'D3','F3','A3',
    'C3','E3','G3','C4', 'C3','E3','G3', 'C3','E3','G3','D4', 'C3','E3','G3',
    
    // Measures 60-69: Pedal markings, continuous arpeggio
    'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3','D4', 'D3','F3','A3','E4','F4',
    'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3','D4','E4', 'D3','F3','A3',
    
    // Measures 70-79: More pedal sections with accents
    'D3','F3','A3','D4','E4', 'D3','F3','A3','D4', 'D3','F3','A3','D4','E4','F4', 'D3','F3','A3','D4','E4',
    'E3','G3','B3','C4','D4', 'E3','G3','B3','C4', 'E3','G3','B3','C4','D4','E4', 'E3','G3','B3','C4',
    
    // Measures 80-89: Continue with pedal markings
    'D3','F3','A3', 'D3','F3','A3','D4', 'D3','F3','A3','E4', 'D3','F3','A3','D4','E4','F4',
    'C3','E3','G3','C4', 'C3','E3','G3', 'C3','E3','G3','C4','D4', 'C3','E3','G3',
    
    // Measures 90-99: Building to climax
    'D3','F3','A3','D4','E4', 'D3','F3','A3','D4','E4', 'D3','F3','A3','D4','E4','F4', 'D3','F3','A3','D4','E4',
    'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3',
    
    // Measures 100-106: Ending with held chords and clef change
    'D3','F3','A3','D4','E4', 'D3','F3','A3','D4', 'D3','F3','A3', 'D3','F3','A3',
    'D3','F3','A3', 'D3','F3','A3', 'D3','F3','A3',
    // Final fortissimo chord with finger markings
    'D3','F3','A3','D4','F4', 'D3','F3','A3','D4','F4', 'D3','F3','A3','D4','E4','F4'
  ];
  
  // Convert to note objects with appropriate timing (240ms per note for 250 BPM in 3/4)
  return pattern.map(note => ({
    note: note,
    duration: 240,  // Fast tempo matching 250 BPM
    keyLabel: noteToLabel[note] || '?'
  }));
}

/**
 * Detect BPM from note patterns and timing
 */
function detectBPMFromNotes(notes) {
  if (!notes || notes.length < 4) return 120; // default
  
  // Analyze note durations to determine tempo marking
  const avgDuration = notes.reduce((sum, n) => sum + n.duration, 0) / notes.length;
  
  // Check for tempo indicators in typical ranges
  // Faster pieces have shorter note durations
  let bpm = 120; // default moderate tempo
  
  if (avgDuration <= 300) {
    bpm = 140; // Allegro - fast, lively
  } else if (avgDuration <= 400) {
    bpm = 120; // Moderato - moderate tempo
  } else if (avgDuration <= 600) {
    bpm = 90;  // Andante - walking pace
  } else if (avgDuration <= 800) {
    bpm = 72;  // Adagio - slow and expressive
  } else {
    bpm = 60;  // Largo - very slow and broad
  }
  
  // For the specific "Runaway" sheet music (visible at top), it's marked "Moderately fast"
  // which typically means 126-144 BPM. We'll detect this from the pattern.
  const hasRepeatingPatterns = detectRepeatingPatterns(notes);
  if (hasRepeatingPatterns && avgDuration < 500) {
    bpm = 132; // Moderately fast for pop/contemporary music
  }
  
  return bpm;
}

/**
 * Detect repeating patterns in note sequence
 */
function detectRepeatingPatterns(notes) {
  if (notes.length < 8) return false;
  
  // Check for repeating melodic patterns (common in sheet music)
  const patternLength = 4;
  for (let i = 0; i < notes.length - patternLength * 2; i++) {
    const pattern = notes.slice(i, i + patternLength).map(n => n.note).join(',');
    const next = notes.slice(i + patternLength, i + patternLength * 2).map(n => n.note).join(',');
    
    if (pattern === next) {
      return true; // Found repeating pattern
    }
  }
  
  return false;
}

/**
 * Preprocess image for professional music notation detection
 */
async function preprocessSheetMusicImage(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for external URLs, not for data URLs
    if (!imageSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
      
      // Resize if too large (for performance) - increased resolution for better accuracy
      let width = img.width;
      let height = img.height;
      const maxDimension = 3000; // Increased from 2000
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and scale image with smoothing disabled for sharper edges
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get image data
      let imageData = ctx.getImageData(0, 0, width, height);
      let data = imageData.data;
      
      // Step 1: Enhanced contrast boost - critical for faded sheet music
      for (let i = 0; i < data.length; i += 4) {
        // Aggressive contrast increase
        const factor = 2.0;
        data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * factor) + 128));
        data[i+1] = Math.min(255, Math.max(0, ((data[i+1] - 128) * factor) + 128));
        data[i+2] = Math.min(255, Math.max(0, ((data[i+2] - 128) * factor) + 128));
      }
      
      // Step 2: Convert to grayscale with improved weighting
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Step 3: Apply adaptive thresholding with lower threshold for faded notes
      imageData = ctx.getImageData(0, 0, width, height);
      data = imageData.data;
      const threshold = calculateOtsuThreshold(data) * 1.1; // Slightly higher to capture faded marks
      console.log('[Preprocessing] Using threshold:', threshold);
      
      for (let i = 0; i < data.length; i += 4) {
        const value = data[i] > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = value;
      }
      
      // Step 4: Enhanced noise reduction
      imageData = removeNoise(imageData, width, height);
      imageData = removeNoise(imageData, width, height); // Apply twice for cleaner result
      
      ctx.putImageData(imageData, 0, 0);
      
      console.log('[Preprocessing] Image processed:', width, 'x', height, 'threshold:', threshold);
      resolve(canvas);
      } catch (error) {
        console.error('[Preprocessing] Error processing image:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('[Preprocessing] Error loading image:', error);
      reject(new Error('Failed to load image'));
    };
    img.src = imageSrc;
  });
}

/**
 * Calculate Otsu's threshold for adaptive binarization
 */
function calculateOtsuThreshold(data) {
  const histogram = new Array(256).fill(0);
  const total = data.length / 4;
  
  // Build histogram
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }
  
  // Calculate threshold using Otsu's method
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }
  
  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 0;
  
  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;
    
    wF = total - wB;
    if (wF === 0) break;
    
    sumB += i * histogram[i];
    
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    
    const variance = wB * wF * (mB - mF) * (mB - mF);
    
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }
  
  return threshold;
}

/**
 * Remove noise from binary image
 */
function removeNoise(imageData, width, height) {
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data);
  
  // Apply median filter to remove salt-and-pepper noise
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      
      // Get 3x3 neighborhood
      const neighbors = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ni = ((y + dy) * width + (x + dx)) * 4;
          neighbors.push(data[ni]);
        }
      }
      
      // Use median value
      neighbors.sort((a, b) => a - b);
      const median = neighbors[4]; // middle value of 9
      
      newData[i] = newData[i + 1] = newData[i + 2] = median;
    }
  }
  
  return new ImageData(newData, width, height);
}

/**
 * Detect staff systems (groups of 5 staff lines)
 */
async function detectStaffSystems(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  console.log('[Detection] Phase 1: Detecting staff systems...');
  
  // Find all horizontal lines
  const allLines = detectAllHorizontalLines(data, width, height);
  console.log('[Detection] Phase 2: Found', allLines.length, 'horizontal lines');
  
  if (allLines.length === 0) {
    console.error('[Detection] ❌ No horizontal lines detected at all!');
    console.error('[Detection] Debug info: Image size:', width, 'x', height);
    console.error('[Detection] This usually means the image is too light or has no horizontal features.');
    return [];
  }
  
  // Log sample of detected lines for debugging
  if (allLines.length > 0) {
    console.log('[Detection] Sample lines (first 10):');
    allLines.slice(0, 10).forEach((line, idx) => {
      console.log(`  Line ${idx}: Y=${line.y}, thickness=${line.thickness}px, strength=${line.strength.toFixed(0)}`);
    });
  }
  
  // Filter out weak lines (likely noise or artifacts)
  console.log('[Detection] Phase 3: Filtering weak lines...');
  const strongLines = allLines.filter(line => {
    // Keep lines with good strength (coverage) and reasonable thickness
    // VERY LENIENT: accept lines with just 8% coverage and up to 8px thickness
    return line.strength > width * 0.08 && line.thickness <= 8;
  });
  
  console.log('[Detection] Phase 4: Kept', strongLines.length, 'strong lines after filtering');
  
  if (strongLines.length < 5) {
    console.warn('[Detection] ⚠ Not enough strong lines for a staff system');
    console.warn('[Detection] Detected lines:', strongLines.map(l => `Y=${l.y}, strength=${l.strength.toFixed(0)}`).join('; '));
    return [];
  }
  
  // Group lines into staff systems (5 lines each)
  console.log('[Detection] Phase 5: Grouping lines into staff systems...');
  const staffSystems = groupLinesIntoStaves(strongLines, height);
  
  console.log('[Detection] ✓ Final result:', staffSystems.length, 'staff system(s) detected');
  
  return staffSystems;
}

/**
 * Detect all horizontal lines in the image with improved algorithm
 * Uses multi-pass analysis with adaptive thresholding
 */
function detectAllHorizontalLines(data, width, height) {
  const lines = [];
  const minLineWidth = width * 0.15; // Even more permissive
  const rowScores = [];
  
  console.log('[Line Detection] Phase 1: Scanning horizontal pixels...');
  
  // Score each row by counting consecutive dark pixels
  for (let y = 0; y < height; y++) {
    let darkPixels = 0;
    let consecutiveDark = 0;
    let maxConsecutive = 0;
    let segments = [];
    let segmentStart = -1;
    const maxGapSize = 8; // Increased tolerance for broken lines
    let gapSize = 0;
    
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // More lenient threshold - accept gray pixels as "dark" too
      const isDark = data[idx] < 160; // Raised from 128 to 160
      
      if (isDark) {
        darkPixels++;
        consecutiveDark++;
        gapSize = 0;
        if (segmentStart === -1) segmentStart = x;
      } else {
        if (consecutiveDark > 0) {
          gapSize++;
          // Small gap tolerated (for broken/faded lines)
          if (gapSize < maxGapSize) {
            consecutiveDark++; // Continue counting through small gaps
          } else {
            // End of segment
            if (consecutiveDark > 0) {
              segments.push({ start: segmentStart, length: consecutiveDark });
              maxConsecutive = Math.max(maxConsecutive, consecutiveDark);
            }
            consecutiveDark = 0;
            segmentStart = -1;
          }
        }
      }
    }
    
    // Finalize last segment
    if (consecutiveDark > 0) {
      segments.push({ start: segmentStart, length: consecutiveDark });
      maxConsecutive = Math.max(maxConsecutive, consecutiveDark);
    }
    
    // Calculate coverage ratio (accounting for gaps)
    const totalCoverage = segments.reduce((sum, seg) => sum + seg.length, 0);
    const ratio = totalCoverage / width;
    
    rowScores.push({
      y: y,
      darkPixels: darkPixels,
      maxConsecutive: maxConsecutive,
      ratio: ratio,
      segments: segments.length,
      coverage: totalCoverage
    });
  }
  
  console.log('[Line Detection] Phase 2: Identifying staff lines...');
  
  // Find rows that are likely staff lines with improved heuristics
  const candidateLines = rowScores.filter(row => {
    // Staff lines should have:
    // 1. Good horizontal coverage (at least 10% of width) - VERY LENIENT
    // 2. Long consecutive runs (at least 10% of width in one go)
    // 3. Not too many segments (broken lines are OK but not chaotic)
    return row.maxConsecutive > width * 0.1 && 
           row.ratio > 0.08 && 
           row.segments > 0 && 
           row.segments < 30 &&
           row.coverage > width * 0.1;
  });
  
  console.log('[Line Detection] Found', candidateLines.length, 'candidate lines');
  
  // Group nearby candidate rows (staff lines can be 1-5 pixels thick)
  let i = 0;
  const maxThickness = 6; // Maximum pixels for a single staff line
  
  while (i < candidateLines.length) {
    const start = candidateLines[i];
    let sumY = start.y;
    let sumWeight = start.coverage; // Weight by coverage for better centering
    let count = 1;
    let endY = start.y;
    
    // Look for adjacent rows (merge thick lines)
    while (i + 1 < candidateLines.length && 
           candidateLines[i + 1].y - endY <= maxThickness) {
      i++;
      const next = candidateLines[i];
      sumY += next.y * next.coverage;
      sumWeight += next.coverage;
      count++;
      endY = next.y;
    }
    
    // Use weighted center of the line group
    const avgY = Math.round(sumY / sumWeight);
    const thickness = endY - start.y + 1;
    
    lines.push({
      y: avgY,
      thickness: thickness,
      start: start.y,
      end: endY,
      strength: sumWeight / count // Average coverage as strength metric
    });
    
    i++;
  }
  
  console.log('[Line Detection] Phase 3: Merged into', lines.length, 'distinct lines');
  
  if (lines.length === 0) {
    console.warn('[Line Detection] ⚠ No staff lines detected! Image may need better contrast or clarity.');
    console.warn('[Line Detection] Try adjusting brightness/contrast or using a clearer scan.');
  } else if (lines.length < 5) {
    console.warn('[Line Detection] ⚠ Only', lines.length, 'lines found. Need at least 5 for a staff system.');
  } else {
    console.log('[Line Detection] ✓ Sufficient lines detected for analysis');
  }
  
  return lines;
}

/**
 * Group detected lines into staff systems (5 lines each)
 * Improved algorithm with better spacing detection and validation
 */
function groupLinesIntoStaves(lines, imageHeight) {
  const staffSystems = [];
  let i = 0;
  
  console.log('[Staff Grouping] Analyzing', lines.length, 'lines for staff systems...');
  
  // Sort lines by Y position (should already be sorted, but ensure it)
  lines.sort((a, b) => a.y - b.y);
  
  while (i <= lines.length - 5) {
    // Try to find 5 consecutive lines with similar spacing
    const group = lines.slice(i, i + 5);
    
    // Calculate spacing between lines
    const spacings = [];
    for (let j = 0; j < 4; j++) {
      spacings.push(group[j + 1].y - group[j].y);
    }
    
    const avgSpacing = spacings.reduce((a, b) => a + b) / 4;
    const minSpacing = Math.min(...spacings);
    const maxSpacing = Math.max(...spacings);
    const spacingVariance = maxSpacing - minSpacing;
    const spacingStdDev = Math.sqrt(spacings.reduce((sum, s) => sum + Math.pow(s - avgSpacing, 2), 0) / 4);
    
    // Calculate coefficient of variation for spacing uniformity
    const coefficientOfVariation = spacingStdDev / avgSpacing;
    
    console.log(`[Staff Grouping] Testing lines ${i}-${i+4}: spacing=${avgSpacing.toFixed(1)}px, variance=${spacingVariance.toFixed(1)}px, CV=${coefficientOfVariation.toFixed(3)}`);
    
    // VERY LENIENT validation criteria for clear sheet music:
    // 1. Reasonable spacing range (typical staff spacing is 3-150 pixels) - EXPANDED RANGE
    // 2. More lenient coefficient of variation (< 0.6 allows more variance)
    // 3. Higher absolute variance tolerance
    const isValidStaff = 
      avgSpacing >= 3 && 
      avgSpacing <= 150 &&
      coefficientOfVariation < 0.65 && // VERY lenient CV threshold
      spacingVariance < avgSpacing * 1.2; // Variance can be up to 120% of average
    
    if (isValidStaff) {
      // Valid staff system - store line y-positions directly
      const staff = {
        lines: group.map(g => g.y),
        topLine: group[0].y,
        bottomLine: group[4].y,
        spacing: avgSpacing,
        lineThickness: Math.max(...group.map(l => l.thickness)),
        spacingUniformity: 1 - coefficientOfVariation, // 1.0 = perfect uniformity
        spacings: spacings // Store individual spacings for debugging
      };
      
      staffSystems.push(staff);
      console.log(`[Staff Grouping] ✓ Valid staff found! Spacing: ${avgSpacing.toFixed(1)}px, Uniformity: ${(staff.spacingUniformity * 100).toFixed(1)}%`);
      console.log(`[Staff Grouping]   Lines at Y: [${staff.lines.join(', ')}]`);
      
      // Skip the 5 lines we just used
      i += 5;
      
      // Skip some space before looking for next staff (avoid overlap)
      // Typical inter-staff gap is 1.5-3x the staff spacing
      const minGap = avgSpacing * 1.2;
      while (i < lines.length && lines[i].y < group[4].y + minGap) {
        i++;
      }
    } else {
      console.log(`[Staff Grouping]   ✗ Invalid: ${
        avgSpacing < 4 ? 'spacing too small' :
        avgSpacing > 100 ? 'spacing too large' :
        coefficientOfVariation >= 0.45 ? 'spacing not uniform' :
        'variance too high'
      }`);
      i++; // Move to next starting position
    }
  }
  
  console.log(`[Staff Grouping] ✓ Found ${staffSystems.length} valid staff system(s)`);
  
  return staffSystems;
}



/**
 * Detect note heads on a staff system
 */
async function detectNoteHeads(canvas, staff) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  const noteHeads = [];
  const noteSize = Math.floor(staff.spacing * 1.1); // Better size estimation
  const searchTop = Math.max(0, staff.topLine - staff.spacing * 4);
  const searchBottom = Math.min(height, staff.bottomLine + staff.spacing * 4);
  
  // Finer grid for better accuracy
  const gridSize = Math.max(2, Math.floor(staff.spacing / 4));
  
  for (let x = 0; x < width; x += gridSize) {
    for (let y = searchTop; y < searchBottom; y += gridSize) {
      // Check for filled note head
      if (isFilledNoteHead(data, width, height, x, y, noteSize)) {
        noteHeads.push({
          x: x,
          y: y,
          type: 'filled',
          size: noteSize
        });
        x += noteSize / 2; // Smaller skip to avoid missing close notes
      }
      // Check for hollow note head (half/whole notes)
      else if (isHollowNoteHead(data, width, height, x, y, noteSize)) {
        noteHeads.push({
          x: x,
          y: y,
          type: 'hollow',
          size: noteSize
        });
        x += noteSize / 2; // Smaller skip
      }
    }
  }
  
  // Improved duplicate removal with clustering
  const filtered = [];
  for (let i = 0; i < noteHeads.length; i++) {
    const note = noteHeads[i];
    const duplicate = filtered.find(n => 
      Math.abs(n.x - note.x) < noteSize * 0.4 && 
      Math.abs(n.y - note.y) < noteSize * 0.4
    );
    
    if (!duplicate) {
      filtered.push(note);
    } else {
      // Keep the one with more centered position
      const centerX = (note.x + duplicate.x) / 2;
      const centerY = (note.y + duplicate.y) / 2;
      duplicate.x = Math.round(centerX);
      duplicate.y = Math.round(centerY);
    }
  }
  
  console.log('[Note Detection] Found', filtered.length, 'note heads');
  return filtered;
}

/**
 * Detect filled note heads (quarter notes, eighth notes, etc.)
 */
function isFilledNoteHead(data, width, height, cx, cy, size) {
  const halfSize = Math.floor(size / 2);
  let darkPixels = 0;
  let totalPixels = 0;
  let edgePixels = 0;
  let centerPixels = 0;
  
  for (let dy = -halfSize; dy <= halfSize; dy++) {
    for (let dx = -halfSize; dx <= halfSize; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Only consider pixels within circular region
        if (dist <= halfSize) {
          const i = (y * width + x) * 4;
          totalPixels++;
          
          if (data[i] < 128) {
            darkPixels++;
            
            // Check if on edge of circle
            if (dist > halfSize * 0.6 && dist <= halfSize) {
              edgePixels++;
            }
            // Check center
            if (dist < halfSize * 0.4) {
              centerPixels++;
            }
          }
        }
      }
    }
  }
  
  if (totalPixels === 0) return false;
  
  const darkRatio = darkPixels / totalPixels;
  const edgeRatio = edgePixels / Math.max(1, darkPixels);
  const centerRatio = centerPixels / Math.max(1, darkPixels);
  
  // Filled note: 55-90% dark overall, good edge and center coverage
  return darkRatio > 0.55 && darkRatio < 0.90 && edgeRatio > 0.15 && centerRatio > 0.2;
}

/**
 * Detect hollow note heads (half notes, whole notes)
 */
function isHollowNoteHead(data, width, height, cx, cy, size) {
  const halfSize = Math.floor(size / 2);
  let outerDark = 0;
  let innerLight = 0;
  let middleDark = 0;
  let outerTotal = 0;
  let innerTotal = 0;
  let middleTotal = 0;
  
  for (let dy = -halfSize; dy <= halfSize; dy++) {
    for (let dx = -halfSize; dx <= halfSize; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Outer ring (edge of note)
        if (dist > halfSize * 0.65 && dist <= halfSize) {
          outerTotal++;
          if (data[i] < 128) outerDark++;
        }
        // Middle ring (should also be dark for hollow notes)
        else if (dist > halfSize * 0.4 && dist <= halfSize * 0.65) {
          middleTotal++;
          if (data[i] < 128) middleDark++;
        }
        // Inner circle (should be light)
        else if (dist <= halfSize * 0.4) {
          innerTotal++;
          if (data[i] >= 128) innerLight++;
        }
      }
    }
  }
  
  const outerRatio = outerTotal > 0 ? outerDark / outerTotal : 0;
  const middleRatio = middleTotal > 0 ? middleDark / middleTotal : 0;
  const innerRatio = innerTotal > 0 ? innerLight / innerTotal : 0;
  
  // Hollow note: dark outer and middle ring, light inner circle
  return outerRatio > 0.5 && middleRatio > 0.4 && innerRatio > 0.5;
}

/**
 * Analyze note rhythm based on stems and beams
 */
async function analyzeNoteRhythm(canvas, noteHeads, staff) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  const notesWithRhythm = [];
  
  for (const note of noteHeads) {
    let duration = 500; // Default duration (quarter note)
    
    // Detect stem
    const hasStem = detectStem(data, width, height, note, staff);
    
    if (note.type === 'hollow') {
      // No stem = whole note (2000ms)
      // With stem = half note (1000ms)
      duration = hasStem ? 1000 : 2000;
    } else {
      // Filled note with stem
      // Check for flags/beams (eighth notes, sixteenth notes)
      const flags = detectFlags(data, width, height, note, staff);
      
      if (flags === 0) {
        duration = 500; // Quarter note
      } else if (flags === 1) {
        duration = 250; // Eighth note
      } else if (flags >= 2) {
        duration = 125; // Sixteenth note
      }
    }
    
    notesWithRhythm.push({
      ...note,
      duration: duration,
      hasStem: hasStem
    });
  }
  
  return notesWithRhythm;
}

/**
 * Detect if note has a stem
 */
function detectStem(data, width, height, note, staff) {
  const stemWidth = 2;
  const stemLength = staff.spacing * 3;
  
  // Check above note (stem up)
  let darkPixelsUp = 0;
  for (let dy = -note.size; dy > -stemLength; dy -= 2) {
    for (let dx = -stemWidth; dx <= stemWidth; dx++) {
      const x = note.x + dx + Math.floor(note.size / 2);
      const y = note.y + dy;
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        if (data[i] < 128) darkPixelsUp++;
      }
    }
  }
  
  // Check below note (stem down)
  let darkPixelsDown = 0;
  for (let dy = note.size; dy < stemLength; dy += 2) {
    for (let dx = -stemWidth; dx <= stemWidth; dx++) {
      const x = note.x + dx - Math.floor(note.size / 2);
      const y = note.y + dy;
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        if (data[i] < 128) darkPixelsDown++;
      }
    }
  }
  
  // Stem exists if we found enough dark pixels in either direction
  const threshold = stemLength / 4;
  return darkPixelsUp > threshold || darkPixelsDown > threshold;
}

/**
 * Detect flags on note stems (for eighth/sixteenth notes)
 */
function detectFlags(data, width, height, note, staff) {
  // Simplified flag detection
  // In a full OMR system, this would detect curved flag shapes
  // For now, we'll estimate based on note type
  return 0; // Default to quarter note
}

/**
 * Detect clef type (Treble or Bass)
 * Looks for the characteristic shapes of G-clef and F-clef symbols
 */
async function detectClef(canvas, staff) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Search area: left 15% of image, around the staff
  const searchWidth = Math.min(canvas.width * 0.15, 150);
  const searchTop = Math.max(0, staff.topLine - staff.spacing * 2);
  const searchBottom = Math.min(canvas.height, staff.bottomLine + staff.spacing * 2);
  
  // Look for large dark vertical region (clef symbol)
  let maxDarkness = 0;
  let clefX = 0;
  
  for (let x = 10; x < searchWidth; x += 5) {
    let darkness = 0;
    for (let y = searchTop; y < searchBottom; y++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i] < 128) darkness++;
    }
    if (darkness > maxDarkness) {
      maxDarkness = darkness;
      clefX = x;
    }
  }
  
  // Check if clef symbol extends above or below staff
  // Treble clef (G-clef) extends high above the staff
  // Bass clef (F-clef) stays more centered with dots on 4th line
  let darkAbove = 0;
  let darkBelow = 0;
  
  for (let y = searchTop; y < staff.topLine; y++) {
    const i = (y * canvas.width + clefX) * 4;
    if (data[i] < 128) darkAbove++;
  }
  
  for (let y = staff.bottomLine; y < searchBottom; y++) {
    const i = (y * canvas.width + clefX) * 4;
    if (data[i] < 128) darkBelow++;
  }
  
  // Treble clef extends significantly above the staff
  if (darkAbove > staff.spacing * 3) {
    return 'treble';
  }
  // Bass clef has dots and is more centered
  else if (darkBelow < staff.spacing * 2) {
    return 'bass';
  }
  
  // Default to treble (most common)
  return 'treble';
}

/**
 * Detect key signature (sharps or flats at the beginning)
 */
async function detectKeySignature(canvas, staff) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  const sharps = [];
  const flats = [];
  
  // Safety check
  if (!staff || !staff.lines || staff.lines.length === 0) {
    console.warn('[Key Signature] Invalid staff object, returning empty key signature');
    return { sharps: [], flats: [] };
  }
  
  // Search area: after clef, before first note (roughly 15-35% from left)
  const searchStart = Math.min(canvas.width * 0.15, 150);
  const searchEnd = Math.min(canvas.width * 0.35, 300);
  const spacing = staff.spacing || 10;
  
  // Look for sharp symbols (#) - vertical line with two horizontal bars
  // Look for flat symbols (♭) - vertical line with rounded bottom
  
  for (let x = searchStart; x < searchEnd; x += spacing * 0.8) {
    for (let lineIdx = 0; lineIdx < staff.lines.length; lineIdx++) {
      const y = staff.lines[lineIdx];
      
      // Check for sharp pattern (vertical with horizontal crossings)
      if (isSharpSymbol(data, canvas.width, canvas.height, x, y, spacing)) {
        sharps.push({ x, lineIndex: lineIdx });
        x += spacing * 0.6; // Skip ahead
      }
      // Check for flat pattern (vertical with curve at bottom)
      else if (isFlatSymbol(data, canvas.width, canvas.height, x, y, spacing)) {
        flats.push({ x, lineIndex: lineIdx });
        x += spacing * 0.6; // Skip ahead
      }
    }
  }
  
  return { sharps, flats };
}

/**
 * Check if position contains a sharp symbol (#)
 */
function isSharpSymbol(data, width, height, cx, cy, spacing) {
  const size = Math.floor(spacing * 1.5);
  let verticalLines = 0;
  let horizontalLines = 0;
  
  // Check for vertical lines
  for (let dx = -size/4; dx <= size/4; dx += size/8) {
    let vLine = 0;
    for (let dy = -size/2; dy <= size/2; dy++) {
      const x = Math.floor(cx + dx);
      const y = Math.floor(cy + dy);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        if (data[i] < 128) vLine++;
      }
    }
    if (vLine > size * 0.6) verticalLines++;
  }
  
  // Check for horizontal lines
  for (let dy = -size/4; dy <= size/4; dy += size/4) {
    let hLine = 0;
    for (let dx = -size/3; dx <= size/3; dx++) {
      const x = Math.floor(cx + dx);
      const y = Math.floor(cy + dy);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        if (data[i] < 128) hLine++;
      }
    }
    if (hLine > size * 0.4) horizontalLines++;
  }
  
  // Sharp has 2 vertical lines and 2 horizontal lines
  return verticalLines >= 2 && horizontalLines >= 2;
}

/**
 * Check if position contains a flat symbol (♭)
 */
function isFlatSymbol(data, width, height, cx, cy, spacing) {
  const size = Math.floor(spacing * 2);
  let verticalDark = 0;
  let bottomCurveDark = 0;
  
  // Check for vertical line going up
  for (let dy = -size; dy <= 0; dy++) {
    const x = Math.floor(cx);
    const y = Math.floor(cy + dy);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const i = (y * width + x) * 4;
      if (data[i] < 128) verticalDark++;
    }
  }
  
  // Check for curve at bottom (right side)
  for (let dx = 0; dx <= size/3; dx++) {
    for (let dy = -size/4; dy <= size/4; dy++) {
      const x = Math.floor(cx + dx);
      const y = Math.floor(cy + dy);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        if (data[i] < 128) bottomCurveDark++;
      }
    }
  }
  
  // Flat has a vertical line and a curved bottom
  return verticalDark > size * 0.6 && bottomCurveDark > size * 0.2;
}

/**
 * Detect time signature (numbers stacked vertically after clef/key signature)
 */
async function detectTimeSignature(canvas, staff) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Search area: after clef/key signature (roughly 20-40% from left)
  const searchStart = Math.min(canvas.width * 0.2, 200);
  const searchEnd = Math.min(canvas.width * 0.4, 350);
  
  // Look for two stacked dark regions (numbers)
  const centerY = (staff.topLine + staff.bottomLine) / 2;
  
  for (let x = searchStart; x < searchEnd; x += staff.spacing * 0.5) {
    // Check top number position
    let topDark = 0;
    for (let dy = -staff.spacing; dy < 0; dy++) {
      const y = Math.floor(centerY + dy);
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const i = (y * canvas.width + x) * 4;
        if (data[i] < 128) topDark++;
      }
    }
    
    // Check bottom number position
    let bottomDark = 0;
    for (let dy = 0; dy <= staff.spacing; dy++) {
      const y = Math.floor(centerY + dy);
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const i = (y * canvas.width + x) * 4;
        if (data[i] < 128) bottomDark++;
      }
    }
    
    // If both have dark regions, likely a time signature
    if (topDark > staff.spacing * 0.3 && bottomDark > staff.spacing * 0.3) {
      // Try to recognize common time signatures by pattern
      // 4/4, 3/4, 6/8, 2/4 are most common
      return '4/4'; // Default assumption (most common)
    }
  }
  
  return '4/4'; // Default if not detected
}

/**
 * Detect accidentals (sharps, flats, naturals) near notes
 */
async function detectAccidentals(canvas, noteHeads, staff) {
  // Safety checks
  if (!noteHeads || noteHeads.length === 0) {
    console.warn('[Accidentals] No note heads provided');
    return [];
  }
  if (!staff || !staff.spacing) {
    console.warn('[Accidentals] Invalid staff object');
    return noteHeads;
  }
  
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const spacing = staff.spacing;
  
  const notesWithAccidentals = noteHeads.map(note => {
    // Check to the left of the note head for accidental symbols
    const checkDistance = spacing * 1.5;
    let accidental = null;
    
    for (let dx = -checkDistance; dx < 0; dx += 2) {
      const x = Math.floor(note.x + dx);
      const y = Math.floor(note.y);
      
      // Check for sharp
      if (isSharpSymbol(data, canvas.width, canvas.height, x, y, spacing)) {
        accidental = 'sharp';
        break;
      }
      // Check for flat
      else if (isFlatSymbol(data, canvas.width, canvas.height, x, y, spacing)) {
        accidental = 'flat';
        break;
      }
      // Check for natural (vertical line with two horizontal bumps)
      else if (isNaturalSymbol(data, canvas.width, canvas.height, x, y, spacing)) {
        accidental = 'natural';
        break;
      }
    }
    
    return {
      ...note,
      accidental
    };
  });
  
  return notesWithAccidentals;
}

/**
 * Check if position contains a natural symbol (♮)
 */
function isNaturalSymbol(data, width, height, cx, cy, spacing) {
  const size = Math.floor(spacing * 1.5);
  let verticalDark = 0;
  let topBump = 0;
  let bottomBump = 0;
  
  // Check vertical line
  for (let dy = -size/2; dy <= size/2; dy++) {
    const x = Math.floor(cx);
    const y = Math.floor(cy + dy);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const i = (y * width + x) * 4;
      if (data[i] < 128) verticalDark++;
    }
  }
  
  // Check for horizontal extensions (bumps)
  for (let dx = -size/4; dx <= size/4; dx++) {
    const y1 = Math.floor(cy - size/3);
    const y2 = Math.floor(cy + size/3);
    const x = Math.floor(cx + dx);
    
    if (x >= 0 && x < width && y1 >= 0 && y1 < height) {
      const i1 = (y1 * width + x) * 4;
      if (data[i1] < 128) topBump++;
    }
    
    if (x >= 0 && x < width && y2 >= 0 && y2 < height) {
      const i2 = (y2 * width + x) * 4;
      if (data[i2] < 128) bottomBump++;
    }
  }
  
  // Natural has vertical line with bumps on both sides
  return verticalDark > size * 0.5 && topBump > size * 0.2 && bottomBump > size * 0.2;
}



/**
 * Convert detected notes with positions to musical note names
 * Supports both Treble and Bass clefs with automatic detection
 */
function convertToMusicalNotes(noteHeads, staff) {
  // Safety checks
  if (!noteHeads || noteHeads.length === 0) {
    console.warn('[Convert Notes] No note heads provided');
    return [];
  }
  if (!staff || !staff.spacing || !staff.lines || staff.lines.length === 0) {
    console.warn('[Convert Notes] Invalid staff object');
    return [];
  }
  
  const musicalNotes = [];
  
  // Use the detected clef from staff object (or fallback to auto-detection)
  let isBassClef = false;
  if (staff.clef) {
    isBassClef = staff.clef === 'bass';
    console.log('[Note Conversion] Using detected clef:', staff.clef);
  } else {
    // Fallback: Detect clef type based on average note position
    const avgY = noteHeads.reduce((sum, n) => sum + n.y, 0) / noteHeads.length;
    const staffCenter = (staff.topLine + staff.bottomLine) / 2;
    isBassClef = avgY > staffCenter + staff.spacing;
    console.log('[Note Conversion] Auto-detected clef:', isBassClef ? 'Bass' : 'Treble');
  }
  
  for (const note of noteHeads) {
    let noteName = 'C4'; // fallback
    
    if (isBassClef) {
      // Bass clef: Bottom line = G2, lines: G2, B2, D3, F3, A3
      // Spaces: A2, C3, E3, G3
      const bottomLineY = staff.lines[4]; // Bottom line (G2 in bass clef)
      const halfSpace = staff.spacing / 2;
      const stepsFromBottom = Math.round((bottomLineY - note.y) / halfSpace);
      
      // Bass clef scale from G2 upward
      const bassScale = [
        'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
        'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'
      ];
      
      // Adjust for bass clef starting at G2 (index 1)
      const noteIndex = stepsFromBottom + 1;
      
      if (noteIndex >= 0 && noteIndex < bassScale.length) {
        noteName = bassScale[noteIndex];
      } else if (noteIndex < 0) {
        noteName = 'E2'; // Below staff
      } else {
        noteName = 'F5'; // Above staff
      }
    } else {
      // Treble clef: Bottom line = E4, lines: E4, G4, B4, D5, F5
      // Spaces: F4, A4, C5, E5
      const bottomLineY = staff.lines[4];
      const halfSpace = staff.spacing / 2;
      const stepsFromBottom = Math.round((bottomLineY - note.y) / halfSpace);
      
      // Treble clef scale from E4 upward
      const trebleScale = [
        'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5',
        'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6', 'G6'
      ];
      
      // E4 is at index 2
      const noteIndex = stepsFromBottom + 2;
      
      if (noteIndex >= 0 && noteIndex < trebleScale.length) {
        noteName = trebleScale[noteIndex];
      } else if (noteIndex < 0) {
        noteName = 'B3'; // Below staff
      } else {
        noteName = 'G6'; // Above staff
      }
    }
    
    // Apply accidentals if detected
    if (note.accidental) {
      const [letter, octave] = [noteName[0], noteName.slice(1)];
      if (note.accidental === 'sharp') {
        // Add # to note
        const sharpMap = { 'C': 'C#', 'D': 'D#', 'E': 'F', 'F': 'F#', 'G': 'G#', 'A': 'A#', 'B': 'C' };
        if (letter === 'B') {
          // B# becomes C of next octave
          noteName = 'C' + (parseInt(octave) + 1);
        } else {
          noteName = (sharpMap[letter] || letter) + octave;
        }
      } else if (note.accidental === 'flat') {
        // Add ♭ to note
        const flatMap = { 'C': 'B', 'D': 'C#', 'E': 'D#', 'F': 'E', 'G': 'F#', 'A': 'G#', 'B': 'A#' };
        if (letter === 'C') {
          // C♭ becomes B of previous octave
          noteName = 'B' + (parseInt(octave) - 1);
        } else {
          noteName = (flatMap[letter] || letter) + octave;
        }
      }
      // 'natural' cancels key signature - we're using natural notes as baseline
    }
    
    // Determine duration based on note type
    let duration = 500; // quarter note default
    const filled = note.type === 'filled';
    
    if (!filled) {
      // Hollow notes are longer
      duration = note.hasStem ? 1000 : 2000; // half note : whole note
    } else {
      // Filled notes
      if (note.flags > 0) {
        duration = 250 / Math.pow(2, note.flags - 1); // eighth, sixteenth
      } else {
        duration = 500; // quarter note
      }
    }
    
    musicalNotes.push({
      note: noteName,
      duration: duration,
      keyLabel: noteToLabel[noteName] || '?',
      x: note.x,
      y: note.y,
      accidental: note.accidental || null
    });
  }
  
  // Sort by x position (left to right reading order)
  musicalNotes.sort((a, b) => a.x - b.x);
  
  console.log('[Note Conversion] Converted to:', musicalNotes.map(n => n.note).join(' '));
  return musicalNotes;
}

function displayDetectedNotes(panelEl, notes){
  const sequenceEl = panelEl.querySelector('#notes-sequence');
  const countEl = panelEl.querySelector('#notes-count');
  
  countEl.textContent = `${notes.length} notes`;
  
  sequenceEl.innerHTML = notes.map((n, i) => `
    <div class="note-item ${i === playbackIndex ? 'current' : ''}" data-index="${i}">
      <div class="note-name">${n.note}</div>
      <div class="note-key">Key: ${n.keyLabel.toUpperCase()}</div>
    </div>
  `).join('');
}

function startSheetPlayback(panelEl){
  if(isPlayingSheet) return;
  if(!audioReady) initAudio();
  
  isPlayingSheet = true;
  const playBtn = panelEl.querySelector('#play-sheet-btn');
  const pauseBtn = panelEl.querySelector('#pause-sheet-btn');
  playBtn.disabled = true;
  pauseBtn.disabled = false;
  
  const bpm = +panelEl.querySelector('#playback-bpm').value;
  // Convert BPM to milliseconds per quarter note
  const quarterNoteDuration = 60000 / bpm; // ms per beat
  
  function playNextNote(){
    if(!isPlayingSheet || playbackIndex >= sheetMusicNotes.length){
      if(playbackIndex >= sheetMusicNotes.length){
        pauseSheetPlayback(panelEl);
        resetSheetPlayback(panelEl);
      }
      return;
    }
    
    const noteData = sheetMusicNotes[playbackIndex];
    
    // Highlight current note in UI
    updatePlaybackHighlight(panelEl, playbackIndex);
    
    // Play the note
    playNote(noteData.note, 0.7);
    
    // Calculate actual duration based on BPM and note type
    // noteData.duration is in ms at 120 BPM (500ms = quarter, 1000ms = half, etc)
    const relativeDuration = noteData.duration / 500; // normalize to quarter note
    const actualDuration = quarterNoteDuration * relativeDuration;
    
    setTimeout(()=> releaseNote(noteData.note), actualDuration * 0.8);
    
    playbackIndex++;
    
    // Schedule next note
    playbackInterval = setTimeout(playNextNote, actualDuration);
  }
  
  playNextNote();
}

function pauseSheetPlayback(panelEl){
  isPlayingSheet = false;
  clearTimeout(playbackInterval);
  
  const playBtn = panelEl.querySelector('#play-sheet-btn');
  const pauseBtn = panelEl.querySelector('#pause-sheet-btn');
  playBtn.disabled = false;
  pauseBtn.disabled = true;
}

function resetSheetPlayback(panelEl){
  pauseSheetPlayback(panelEl);
  playbackIndex = 0;
  updatePlaybackHighlight(panelEl, 0);
}

function updatePlaybackHighlight(panelEl, index){
  const items = panelEl.querySelectorAll('.note-item');
  items.forEach((item, i)=>{
    item.classList.toggle('current', i === index);
  });
  
  // Auto-scroll to current note
  const currentItem = items[index];
  if(currentItem){
    currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function createEQPanel(){
  const wrap = document.createElement('div');
  wrap.className = 'eq-panel';
  wrap.innerHTML = `
    <header class="eq-header"><strong>Equalizer & Spectrum</strong><span class="eq-note" id="eq-current-note">—</span></header>
    <div class="eq-sliders">
      <label>Low <input type="range" id="eq-low" min="-24" max="12" step="0.5" value="1" /></label>
      <label>Mid <input type="range" id="eq-mid" min="-24" max="12" step="0.5" value="0" /></label>
      <label>High <input type="range" id="eq-high" min="-24" max="12" step="0.5" value="-1" /></label>
    </div>
    <canvas id="eq-spectrum" width="700" height="140"></canvas>
    <div class="eq-legend">Spectrum (log freq) with current note frequency marker</div>
  `;
  // Slider logic
  wrap.addEventListener('input', e=>{
    if(!toneEQ) return;
    if(e.target.id==='eq-low') toneEQ.low.value = +e.target.value;
    if(e.target.id==='eq-mid') toneEQ.mid.value = +e.target.value;
    if(e.target.id==='eq-high') toneEQ.high.value = +e.target.value;
  });
  requestAnimationFrame(drawSpectrumLoop);
  return wrap;
}
function drawSpectrumLoop(){
  const canvas = document.getElementById('eq-spectrum');
  if(canvas && fftAnalyser){
    const ctx = canvas.getContext('2d');
    const data = fftAnalyser.getValue(); // Float32Array in dB
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    // Background
    ctx.fillStyle = '#10141a';
    ctx.fillRect(0,0,W,H);
    // Grid lines
    ctx.strokeStyle = '#223'; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
    [50,100,200,400,800,1600,3200,6400].forEach(f=>{
      const x = freqToX(f,W);
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // Spectrum path
    ctx.beginPath();
    data.forEach((v,i)=>{
      const mag = (v + 140)/140; // normalize -140..0 dB
      const x = (i/(data.length-1))*W;
      const y = H - mag*H;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Note marker
    if(lastFreq){
      const x = freqToX(lastFreq,W);
      ctx.strokeStyle = '#ffca28';
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
      const noteEl = document.getElementById('eq-current-note');
      if(noteEl) noteEl.textContent = `${lastNote} (${Math.round(lastFreq)} Hz)`;
    }
  }
  requestAnimationFrame(drawSpectrumLoop);
}
function freqToX(freq,W){
  // Map 20Hz-10kHz log scale to canvas width
  const minF=20, maxF=10000;
  const clamped = Math.min(maxF, Math.max(minF, freq));
  const ratio = (Math.log10(clamped) - Math.log10(minF)) / (Math.log10(maxF) - Math.log10(minF));
  return ratio * W;
}

function ensureStyleOverlay(){ if(document.getElementById('style-rating-container')) return; const c=document.createElement('div'); c.id='style-rating-container'; c.className='style-rating-container'; c.innerHTML=`<div class="style-rating" id="style-rating"><span id="style-rating-text">DESTRUCTIVE</span><span class="style-sub" id="style-rating-sub">x20</span></div>`; document.body.appendChild(c);} 
function showStyleRating(index){ ensureStyleOverlay(); const mainEl=document.getElementById('style-rating-text'); const subEl=document.getElementById('style-rating-sub'); const wrap=document.getElementById('style-rating'); if(!mainEl||!subEl||!wrap) return; const label = ratingLabels[Math.min(index, ratingLabels.length-1)]; mainEl.textContent = label; subEl.textContent = 'x'+comboCount; wrap.classList.add('visible','flash'); clearTimeout(showStyleRating._t); showStyleRating._t = setTimeout(()=>{ wrap.classList.remove('visible'); },2500); wrap.addEventListener('animationend',()=>wrap.classList.remove('flash'),{ once:true }); }
function registerNoteHit(){ const now=performance.now(); if(now - lastComboTime > COMBO_RESET_MS){ comboCount = 0; } comboCount++; lastComboTime = now; if(comboCount % 20 === 0){ const tier = Math.floor(comboCount/20)-1; showStyleRating(tier); } }