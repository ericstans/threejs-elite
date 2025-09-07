const DEBUG = false;

export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.masterVolume = 0.3; // Default volume level
    // Engine rumble - 3-layer system with phase diversity
    this._engine = {
      started: false,
      layers: [], // each: { source, gain, filter, phaseOffset }
      currentThrottle: 0
    };
    
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Generate laser sound effect
  generateLaserSound() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Laser sound: high frequency, quick burst
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // Generate asteroid hit sound effect
  generateHitSound() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Hit sound: metallic ping
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.25);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.25);
  }

  // Generate explosion sound effect
  generateExplosionSound() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Explosion sound: low frequency rumble - longer duration
    oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.8);
    oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 1.5);
    
    // Volume envelope - longer fade
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.6, this.audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 1.5);
  }

  // Generate target selected sound effect
  generateTargetSelectedSound() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Target selected sound: polite beep - flat frequency
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    
    // Volume envelope - short, polite beep
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  generateResourceCollectedSound() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Resource collection sound: pleasant ascending tone
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + 0.2);
    
    // Volume envelope - gentle collection sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.25);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.25);
  }

  // Play sound methods
  playLaserSound() {
    this.generateLaserSound();
  }

  playHitSound() {
    this.generateHitSound();
  }

  playExplosionSound() {
    this.generateExplosionSound();
  }

  playTargetSelectedSound() {
    this.generateTargetSelectedSound();
  }

  playResourceCollectedSound() {
    this.generateResourceCollectedSound();
  }

  // Volume control
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  getVolume() {
    return this.masterVolume;
  }

  // ================= Engine Rumble =================
  // CORE METHOD: Creates the engine rumble audio buffer - KEEP FOR TESTING
  _createEngineBuffer(duration = 2.0) {
    const ctx = this.audioContext;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    // Brown-ish noise (integrated white) then lightly filtered envelope
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = (Math.random() * 2 - 1);
      last += white * 0.02; // integrate
      // clamp drift
      if (last > 1) last = 1; else if (last < -1) last = -1;
      // gentle damping to avoid runaway DC
      last *= 0.995;
      // subtle low freq pulsation using slow sine (~0.7Hz)
      const t = i / sampleRate;
      const pulse = 0.6 + Math.sin(t * 2 * Math.PI * 0.7) * 0.4;
      data[i] = last * pulse * 0.4; // scale overall amplitude
    }
    return buffer;
  }

  // 3-layer engine initialization with random phase offsets
  _ensureEngine() {
    if (!this.audioContext || this._engine.started) return;
    
    const ctx = this.audioContext;
    const layerCount = 3;
    const layers = [];
    
    // Create buffer once for all layers
    const buffer = this._createEngineBuffer(4.0);
    
    for (let i = 0; i < layerCount; i++) {
      // Create audio nodes for each layer
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const source = ctx.createBufferSource();
      
      // Configure filter with slight variations per layer
      filter.type = 'lowpass';
      filter.frequency.value = 180 + i * 30; // 180, 210, 240 Hz
      filter.Q.value = 0.4 + i * 0.1; // 0.4, 0.5, 0.6
      
      // Configure source
      source.buffer = buffer;
      source.loop = true;
      source.playbackRate.value = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
      
      // Random phase offset for each layer (0 to 4 seconds)
      const phaseOffset = Math.random() * buffer.duration;
      
      // Connect audio graph
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Start silent
      gain.gain.value = 0;
      
      // Start the source with phase offset
      try {
        source.start(0, phaseOffset % buffer.duration);
      } catch (error) {
        console.warn(`Failed to start engine layer ${i}:`, error);
      }
      
      layers.push({ source, gain, filter, phaseOffset });
    }
    
    this._engine.layers = layers;
    this._engine.started = true;
    
    // Debug: Log layer creation
    if (DEBUG) console.log(`Engine initialized with ${layers.length} layers`);
  }

  // Simple real-time engine rumble update
  updateEngineRumble(throttle = 0, isDocked = false) {
    if (!this.audioContext) return;
    
    // Ensure engine is initialized
    this._ensureEngine();
    if (!this._engine.started) return;
    
    // Clamp throttle to 0-1 range
    throttle = Math.max(0, Math.min(1, throttle));
    
    // Skip if throttle hasn't changed significantly (avoid unnecessary updates)
    if (Math.abs(throttle - this._engine.currentThrottle) < 0.01) return;
    
    const now = this.audioContext.currentTime;
    
    // Calculate target volume based on throttle with exponential curve
    const idleVolume = 0.1; // Base idle volume
    const maxVolume = 1;  // Maximum volume at full throttle
    
    // Exponential curve: rises quickly in first half, levels out in second half
    // Using throttle^0.6 gives a curve that rises fast then levels off
    const curvedThrottle = Math.pow(throttle, 0.6);
    const targetVolume = isDocked ? 0 : (idleVolume + curvedThrottle * (maxVolume - idleVolume));
    
    // Update each layer with slight variations
    this._engine.layers.forEach((layer, i) => {
      // All layers at 100% of target volume
      const layerVolume = targetVolume;
      
      // Debug: Log layer volumes (remove this after testing)
      if (throttle > 0.5) {
        if (DEBUG) console.log(`Layer ${i}: throttle=${throttle.toFixed(2)}, targetVolume=${targetVolume.toFixed(2)}, layerVolume=${layerVolume.toFixed(2)}`);
      }
      
      // Update gain (volume) - smooth transition
      layer.gain.gain.cancelScheduledValues(now);
      layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
      layer.gain.gain.linearRampToValueAtTime(
        layerVolume * this.masterVolume, 
        now + 0.1 // Quick but smooth transition
      );
      
      // Update playback rate based on throttle (engine revs up)
      const baseRate = 0.8;
      const maxRate = 1.2;
      const detune = (i - 1) * 0.05; // -0.05, 0, +0.05
      const targetRate = (baseRate + throttle * (maxRate - baseRate)) * (1 + detune);
      
      layer.source.playbackRate.cancelScheduledValues(now);
      layer.source.playbackRate.setValueAtTime(layer.source.playbackRate.value, now);
      layer.source.playbackRate.linearRampToValueAtTime(targetRate, now + 0.2);
      
      // Update filter frequency based on throttle (more aggressive scaling)
      const baseFreq = 120 + i * 15; // 120, 135, 150 Hz base (lower starting point)
      const maxFreq = 800 + i * 100; // 800, 900, 1000 Hz max (much higher max)
      const targetFreq = baseFreq + throttle * (maxFreq - baseFreq);
      
      layer.filter.frequency.cancelScheduledValues(now);
      layer.filter.frequency.setValueAtTime(layer.filter.frequency.value, now);
      layer.filter.frequency.linearRampToValueAtTime(targetFreq, now + 0.3);
    });
    
    this._engine.currentThrottle = throttle;
  }

  // 3-layer engine rumble stop method
  stopEngineRumble() {
    if (!this._engine.started) return;
    
    // Fade out all layers smoothly
    const now = this.audioContext.currentTime;
    this._engine.layers.forEach(layer => {
      layer.gain.gain.cancelScheduledValues(now);
      layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
      layer.gain.gain.linearRampToValueAtTime(0, now + 0.5);
    });
    
    // Stop all sources after fade out
    setTimeout(() => {
      this._engine.layers.forEach(layer => {
        try {
          if (layer.source) {
            layer.source.stop();
          }
        } catch (error) {
          // Source might already be stopped
        }
      });
      this._engine.started = false;
    }, 500);
  }
}
