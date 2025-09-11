/**
 * AudioManager handles all audio-related functionality including:
 * - Music and soundtrack management
 * - Sound effects coordination
 * - Audio state management
 * - Integration with MusicManager and SoundManager
 */
import { SoundManager } from '../SoundManager.js';
import { MusicManager } from '../MusicManager.js';

export class AudioManager {
  constructor(game, spaceship, gameStateManager) {
    this._soundManager = new SoundManager();
    this._musicManager = new MusicManager(game, spaceship, gameStateManager);
    this.gameStateManager = gameStateManager;
    
    // Update MusicManager with GameStateManager reference if it was provided later
    if (this.gameStateManager) {
      this._musicManager.gameStateManager = this.gameStateManager;
    }
    
    // Audio state tracking
    this.musicStarted = false;
    this._lastEngineDocked = false;
  }

  // Initialize audio systems
  async initialize() {
    this.musicStarted = false;
    this._lastEngineDocked = false;
    
    // Initialize the music manager
    if (this._musicManager && this._musicManager.init) {
      await this._musicManager.init();
      
      // Start playing ambient music
      if (this._musicManager.playTrack) {
        this._musicManager.playTrack('ambient');
        this.musicStarted = true;
      }
    }
  }

  // Update audio systems (called from main game loop)
  update() {
    // Music manager update (handles combat state transitions)
    this._musicManager.update();
  }

  // Handle engine rumble based on docking state and throttle
  updateEngineRumble(spaceship) {
    // Stop engine sound completely when docked, restart when undocked
    let isActuallyDocked = false;
    if (spaceship.flags.isDocked) {
      if (spaceship.flags.stationDocked) {
        isActuallyDocked = true;
      } else if (spaceship.flags.dockContext === 'planet' && spaceship.dockingTarget && spaceship.dockingTarget.getPosition && !spaceship.takeoffActive) {
        isActuallyDocked = true;
      }
    }

    if (isActuallyDocked && !this._lastEngineDocked) {
      this._soundManager.stopEngineRumble();
    }
    if (!isActuallyDocked && this._lastEngineDocked) {
      // Resume engine rumble on undock
      this._soundManager.updateEngineRumble(spaceship.getThrottle(), false);
    }
    this._lastEngineDocked = isActuallyDocked;
    if (!isActuallyDocked) {
      this._soundManager.updateEngineRumble(spaceship.getThrottle(), false);
    }
  }

  // Handle combat music transitions
  onCombatStart() {
    // Set combat flag and switch to combat music when player attacks NPC ship (immediate)
    // Only switch music if we weren't already in combat
    if (!this._musicManager.spaceship?.flags?.isInCombat) {
      this._musicManager.spaceship.flags.isInCombat = true;
      this._musicManager.switchSoundtracksImmediate(['combat']);
    }
  }

  onCombatEnd() {
    // Switch back to ambient music when combat ends
    if (this._musicManager.spaceship?.flags?.isInCombat) {
      this._musicManager.spaceship.flags.isInCombat = false;
      this._musicManager.switchSoundtracksImmediate(['ambient']);
    }
  }

  // Handle sector soundtrack changes
  setSectorSoundtracks(sectorDefinition) {
    if (sectorDefinition && sectorDefinition.soundtracks) {
      this.gameStateManager.setSoundtracks(sectorDefinition.soundtracks);
    } else {
      // Default soundtracks for sectors without explicit definitions
      this.gameStateManager.setSoundtracks(['ambient']);
    }
    
    // Note: Sector soundtrack changes wait for current track to finish naturally
    // The MusicManager will pick up the new soundtracks on the next track
  }

  // Delegate methods to GameStateManager for consistency
  setSoundtracks(soundtracks) {
    this.gameStateManager.setSoundtracks(soundtracks);
  }

  addSoundtrack(soundtrack) {
    this.gameStateManager.addSoundtrack(soundtrack);
  }

  removeSoundtrack(soundtrack) {
    this.gameStateManager.removeSoundtrack(soundtrack);
  }

  // Get current soundtracks
  getCurrentSoundtracks() {
    return this.gameStateManager.currentSoundtracks;
  }

  // Audio system getters for external access
  get musicManager() {
    return this._musicManager;
  }

  get soundManager() {
    return this._soundManager;
  }

  get isMusicStarted() {
    return this.musicStarted;
  }

  set isMusicStarted(value) {
    this.musicStarted = value;
  }

  // Update GameStateManager reference (called after GameStateManager is created)
  setGameStateManager(gameStateManager) {
    this.gameStateManager = gameStateManager;
    this._musicManager.gameStateManager = gameStateManager;
  }
}
