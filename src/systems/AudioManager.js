/**
 * AudioManager handles all audio-related functionality including:
 * - Music and soundtrack management
 * - Sound effects coordination
 * - Audio state management
 * - Integration with MusicManager and SoundManager
 */
export class AudioManager {
  constructor(musicManager, soundManager, gameStateManager) {
    this._musicManager = musicManager;
    this._soundManager = soundManager;
    this.gameStateManager = gameStateManager;
    
    // Audio state tracking
    this.musicStarted = false;
    this._lastEngineDocked = false;
  }

  // Initialize audio systems
  initialize() {
    this.musicStarted = false;
    this._lastEngineDocked = false;
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
}
