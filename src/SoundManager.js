export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.masterVolume = 0.3; // Default volume level
    // Engine rumble
    this._engine = {
      started: false,
      layers: [], // each: { source, gain, filter, buffer, phaseOffset }
      lastThrottle: 0
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

  // Volume control
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  getVolume() {
    return this.masterVolume;
  }

  // ================= Engine Rumble =================
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

  _ensureEngine() {
    if (!this.audioContext || this._engine.started) return;
    const ctx = this.audioContext;
    const layerCount = 3; // base + 2 out-of-phase
    const layers = [];
    for (let i = 0; i < layerCount; i++) {
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      // Slightly stagger cutoff per layer
      filter.frequency.value = 140 + i * 20;
      filter.Q.value = 0.7;
      const buffer = this._createEngineBuffer(2.0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      // Base playback rate plus minuscule detune per layer
      source.playbackRate.value = (0.9 + Math.random() * 0.06) * (1 + i * 0.01);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0; // start silent
      // Start each layer with a time offset for phase diversity
      const offset = (buffer.duration / layerCount) * i;
      try { source.start(0, offset % buffer.duration); } catch(_) {}
      layers.push({ source, gain, filter, buffer, phaseOffset: offset });
    }
    this._engine = { started: true, layers, lastThrottle: 0 };
  }

  updateEngineRumble(throttle = 0, isDocked = false, speedRatio = null) {
    if (!this.audioContext) return;
    this._ensureEngine();
    if (!this._engine.started) return;
    // If caller didn't supply speed ratio, approximate with throttle
    if (speedRatio == null) speedRatio = throttle;
    speedRatio = Math.max(0, Math.min(1, speedRatio));
    const idle = 0.05;
    const dockSuppress = isDocked ? 0.3 : 1.0;
    const target = throttle > 0 ? (idle + throttle * 0.35) * dockSuppress : (isDocked ? 0 : idle * 0.4);
    const now = this.audioContext.currentTime;
    const baseRate = 0.9;
    const maxExtra = 0.25;
    this._engine.layers.forEach((layer, i) => {
      const g = layer.gain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      // Slight per-layer scaling (middle slightly louder)
      const layerScale = i === 1 ? 1.1 : 0.9;
      g.linearRampToValueAtTime(target * this.masterVolume * layerScale / this._engine.layers.length, now + 0.15);
      if (layer.source && layer.source.playbackRate) {
        const rateParam = layer.source.playbackRate;
        const detune = (i - 1) * 0.03; // -0.03, 0, +0.03 approx
        const newRate = (baseRate + throttle * maxExtra) * (1 + detune * 0.1);
        try {
          rateParam.cancelScheduledValues(now);
          rateParam.setValueAtTime(rateParam.value, now);
          rateParam.linearRampToValueAtTime(newRate, now + 0.3);
        } catch(_) {}
      }
      // Dynamic filter cutoff: base per-layer + growth with speed ratio
      const baseCut = 140 + i * 20; // original base
      const extra = 180; // max additional Hz when at full speed
      const targetCut = baseCut + extra * speedRatio; // up to ~320-360 Hz
      const f = layer.filter.frequency;
      try {
        f.cancelScheduledValues(now);
        f.setValueAtTime(f.value, now);
        f.linearRampToValueAtTime(targetCut, now + 0.5); // slower smoothing
      } catch(_) {}
    });
    this._engine.lastThrottle = throttle;
  }

  stopEngineRumble() {
    if (!this._engine.started) return;
    this._engine.layers.forEach(l => { try { l.source.stop(); } catch(_) {} });
    this._engine.started = false;
  }
}
