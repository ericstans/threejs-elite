export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.masterVolume = 0.3; // Default volume level
    
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
}
