/**
 * Visualization Module
 * Handles spectrum analyzer, waveforms, and visual effects
 */

export class Visualization {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.spectrumCanvas = null;
    this.spectrumCtx = null;
    this.animationFrame = null;
    this.enabled = false;
    
    // Starry background
    this.backgroundCanvas = null;
    this.backgroundCtx = null;
    this.stars = [];
    this.backgroundAnimationFrame = null;
  }

  /**
   * Initialize visualization
   */
  initialize() {
    this.createEQPanel();
    this.createStarryBackground();
    console.log('[Visualization] Initialized');
  }

  /**
   * Create EQ panel with spectrum analyzer
   */
  createEQPanel() {
    const panel = document.createElement('div');
    panel.className = 'eq-panel';
    panel.innerHTML = `
      <div class="eq-header">
        <span>🎚️ Equalizer & Spectrum</span>
        <button id="toggle-spectrum" class="toggle-btn">Show Spectrum</button>
      </div>
      
      <div class="eq-sliders">
        <label>
          <span>Low (Bass)</span>
          <input type="range" id="eq-low" min="-20" max="20" step="1" value="0">
          <span id="eq-low-val">0 dB</span>
        </label>
        
        <label>
          <span>Mid</span>
          <input type="range" id="eq-mid" min="-20" max="20" step="1" value="0">
          <span id="eq-mid-val">0 dB</span>
        </label>
        
        <label>
          <span>High (Treble)</span>
          <input type="range" id="eq-high" min="-20" max="20" step="1" value="0">
          <span id="eq-high-val">0 dB</span>
        </label>
      </div>
      
      <canvas id="eq-spectrum" width="800" height="150" style="display:none;"></canvas>
      <div class="eq-legend">Real-time frequency spectrum</div>
    `;

    document.body.appendChild(panel);
    this.wireEQEvents();
    
    this.spectrumCanvas = document.getElementById('eq-spectrum');
    this.spectrumCtx = this.spectrumCanvas.getContext('2d');
  }

  /**
   * Wire EQ panel events
   */
  wireEQEvents() {
    // EQ controls
    const eqLow = document.getElementById('eq-low');
    const eqMid = document.getElementById('eq-mid');
    const eqHigh = document.getElementById('eq-high');
    const eqLowVal = document.getElementById('eq-low-val');
    const eqMidVal = document.getElementById('eq-mid-val');
    const eqHighVal = document.getElementById('eq-high-val');

    eqLow.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      eqLowVal.textContent = `${val > 0 ? '+' : ''}${val} dB`;
      this.audioEngine.updateEQ('low', val);
    });

    eqMid.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      eqMidVal.textContent = `${val > 0 ? '+' : ''}${val} dB`;
      this.audioEngine.updateEQ('mid', val);
    });

    eqHigh.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      eqHighVal.textContent = `${val > 0 ? '+' : ''}${val} dB`;
      this.audioEngine.updateEQ('high', val);
    });

    // Toggle spectrum
    const toggleBtn = document.getElementById('toggle-spectrum');
    toggleBtn.addEventListener('click', () => {
      this.enabled = !this.enabled;
      this.spectrumCanvas.style.display = this.enabled ? 'block' : 'none';
      toggleBtn.textContent = this.enabled ? 'Hide Spectrum' : 'Show Spectrum';
      
      if (this.enabled) {
        this.startVisualization();
      } else {
        this.stopVisualization();
      }
    });
  }

  /**
   * Start spectrum visualization
   */
  startVisualization() {
    if (!this.enabled || this.animationFrame) return;
    
    const draw = () => {
      this.drawSpectrum();
      this.animationFrame = requestAnimationFrame(draw);
    };
    
    draw();
  }

  /**
   * Stop spectrum visualization
   */
  stopVisualization() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Clear canvas
    if (this.spectrumCtx) {
      this.spectrumCtx.clearRect(0, 0, this.spectrumCanvas.width, this.spectrumCanvas.height);
    }
  }

  /**
   * Draw spectrum analyzer
   */
  drawSpectrum() {
    if (!this.spectrumCtx || !this.audioEngine.audioReady) return;
    
    const fftData = this.audioEngine.getFFTData();
    if (!fftData) return;
    
    const width = this.spectrumCanvas.width;
    const height = this.spectrumCanvas.height;
    const ctx = this.spectrumCtx;
    
    // Clear
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, width, height);
    
    // Draw frequency bars
    const barCount = Math.min(fftData.length, 128);
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const value = fftData[i];
      const normalized = (value + 100) / 100; // Normalize from -100..0 dB
      const barHeight = Math.max(0, normalized * height);
      
      // Color gradient based on frequency
      const hue = (i / barCount) * 240; // 0 (red) to 240 (blue)
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      
      ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth - 1,
        barHeight
      );
    }
    
    // Draw frequency labels
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    
    const freqLabels = ['20Hz', '100Hz', '500Hz', '1kHz', '5kHz', '20kHz'];
    const positions = [0, 0.15, 0.35, 0.5, 0.75, 1.0];
    
    freqLabels.forEach((label, i) => {
      const x = positions[i] * width;
      ctx.fillText(label, x, height - 5);
    });
  }

  /**
   * Create starry background
   */
  createStarryBackground() {
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCanvas.id = 'starry-background';
    this.backgroundCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;';
    document.body.appendChild(this.backgroundCanvas);
    
    this.backgroundCtx = this.backgroundCanvas.getContext('2d');
    
    this.resizeBackground();
    window.addEventListener('resize', () => this.resizeBackground());
    
    this.generateStars();
    this.animateStars();
  }

  /**
   * Resize background canvas
   */
  resizeBackground() {
    if (!this.backgroundCanvas) return;
    this.backgroundCanvas.width = window.innerWidth;
    this.backgroundCanvas.height = window.innerHeight;
  }

  /**
   * Generate stars
   */
  generateStars() {
    this.stars = [];
    const numStars = 200;
    
    for (let i = 0; i < numStars; i++) {
      this.stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005
      });
    }
  }

  /**
   * Animate stars
   */
  animateStars() {
    if (!this.backgroundCtx || !this.backgroundCanvas) return;
    
    const ctx = this.backgroundCtx;
    const width = this.backgroundCanvas.width;
    const height = this.backgroundCanvas.height;
    
    // Clear with gradient
    const isDark = document.body.classList.contains('dark');
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    
    if (isDark) {
      gradient.addColorStop(0, '#1a1d2e');
      gradient.addColorStop(1, '#16213e');
    } else {
      gradient.addColorStop(0, '#f5f7fa');
      gradient.addColorStop(1, '#c3cfe2');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw stars
    this.stars.forEach(star => {
      // Twinkle effect
      star.opacity += star.twinkleSpeed;
      if (star.opacity > 1 || star.opacity < 0.3) {
        star.twinkleSpeed *= -1;
      }
      
      // Move star slightly
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
      
      // Draw
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = isDark 
        ? `rgba(179, 157, 219, ${star.opacity})`
        : `rgba(102, 126, 234, ${star.opacity})`;
      ctx.fill();
    });
    
    this.backgroundAnimationFrame = requestAnimationFrame(() => this.animateStars());
  }

  /**
   * Cleanup
   */
  dispose() {
    this.stopVisualization();
    
    if (this.backgroundAnimationFrame) {
      cancelAnimationFrame(this.backgroundAnimationFrame);
    }
    
    if (this.backgroundCanvas) {
      this.backgroundCanvas.remove();
    }
    
    const eqPanel = document.querySelector('.eq-panel');
    if (eqPanel) {
      eqPanel.remove();
    }
  }
}
