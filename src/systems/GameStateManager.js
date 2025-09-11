/**
 * GameStateManager handles all game state management including:
 * - Pause/resume functionality
 * - Global flags management
 * - Audio/soundtrack management
 * - State persistence
 */
export class GameStateManager {
  constructor(musicManager, soundManager) {
    this.musicManager = musicManager;
    this.soundManager = soundManager;
    
    // Game state
    this.paused = false;
    this.isPaused = false; // Legacy compatibility
    
    // Global flags for game state tracking
    this.globalFlags = {
      gameStarted: false,
      firstDocking: false,
      soundtracks: ['ambient'] // Default soundtracks
    };
  }

  // Pause/Resume functionality
  pause() {
    this.paused = true;
    this.isPaused = true; // Legacy compatibility
    // Pause music
    if (this.musicManager && this.musicManager.pauseTrack) {
      this.musicManager.pauseTrack();
    }
    // Stop engine rumble
    if (this.soundManager && this.soundManager.stopEngineRumble) {
      this.soundManager.stopEngineRumble();
    }
  }

  resume() {
    this.paused = false;
    this.isPaused = false; // Legacy compatibility
    // Resume music
    if (this.musicManager && this.musicManager.resumeTrack) {
      this.musicManager.resumeTrack();
    }
    // Restart engine rumble
    if (this.soundManager && this.soundManager.startEngineRumble) {
      this.soundManager.startEngineRumble();
    }
  }

  // Global flag management methods
  setGlobalFlag(flagName, value) {
    this.globalFlags[flagName] = value;
  }

  getGlobalFlag(flagName) {
    return this.globalFlags[flagName] || false;
  }

  hasGlobalFlag(flagName) {
    return Object.prototype.hasOwnProperty.call(this.globalFlags, flagName) && this.globalFlags[flagName];
  }

  getAllGlobalFlags() {
    return { ...this.globalFlags };
  }

  // Audio management methods
  setSoundtracks(soundtracks) {
    this.globalFlags.soundtracks = Array.isArray(soundtracks) ? soundtracks : [soundtracks];
  }

  getCurrentSoundtracks() {
    return this.globalFlags.soundtracks || ['ambient'];
  }

  addSoundtrack(soundtrack) {
    if (!this.globalFlags.soundtracks.includes(soundtrack)) {
      this.globalFlags.soundtracks.push(soundtrack);
    }
  }

  removeSoundtrack(soundtrack) {
    this.globalFlags.soundtracks = this.globalFlags.soundtracks.filter(s => s !== soundtrack);
  }

  // Process flags from conversation options
  processFlags(flags) {
    if (flags.global) {
      for (const [flagName, value] of Object.entries(flags.global)) {
        this.setGlobalFlag(flagName, value);
      }
    }
  }

  // Getters for external access
  get isGamePaused() {
    return this.paused;
  }

  get currentSoundtracks() {
    return [...this.globalFlags.soundtracks];
  }

  // Initialize default state
  initialize() {
    this.paused = false;
    this.isPaused = false;
    this.globalFlags = {
      gameStarted: false,
      firstDocking: false,
      soundtracks: ['ambient']
    };
  }

  // Reset to initial state
  reset() {
    this.initialize();
  }
}
