const DEBUG = false;

export class Controls {
  constructor(spaceship, game = null) {
    this.spaceship = spaceship;
    this.game = game;
    this.keys = {};
    this.setupEventListeners();

    // Laser cooldown system
    this.laserCooldown = 0.6; // 600ms cooldown
    this.lastLaserTime = 0;
  }

  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;
      event.preventDefault();
    });

    document.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
      event.preventDefault();
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (this.onResize) {
        this.onResize();
      }
    });
  }

  update(deltaTime) {
    const sensitivity = 1.0;

    // Handle escape key for options menu (only if no other modals are open)
    if (this.keys['Escape']) {
      if (!this._escapeKeyHeld) {
        this._escapeKeyHeld = true;
        if (this.game && this.game.ui) {
          // Only handle options if no other modals are open
          if (!this.game.ui.isCommsModalVisible() &&
              !this.game.ui.isMapModalVisible() &&
              !this.game.ui.isOptionsVisible()) {
            // No modals are open - open options and pause game
            this.game.ui.showOptions();
            this.game.pause();
          }
        }
      }
    } else {
      this._escapeKeyHeld = false;
    }

    // Minimal auto-start music: first detected key press triggers ambient if not already started
    if (this.game && !this.game.musicStarted) {
      // If any key currently held (excluding modifier keys if desired later) start music
      if (Object.values(this.keys).some(v => v)) {
        this.startMusic();
      }
    }

    // WASD movement
    if (this.keys['KeyW']) {
      this.spaceship.pitch(-sensitivity * deltaTime);
    }
    if (this.keys['KeyS']) {
      this.spaceship.pitch(sensitivity * deltaTime);
    }
    if (this.keys['KeyA']) {
      this.spaceship.yaw(sensitivity * deltaTime);
    }
    if (this.keys['KeyD']) {
      this.spaceship.yaw(-sensitivity * deltaTime);
    }

    // Q and E for roll
    if (this.keys['KeyQ']) {
      this.spaceship.roll(sensitivity * deltaTime);
    }
    if (this.keys['KeyE']) {
      this.spaceship.roll(-sensitivity * deltaTime);
    }

    // Throttle controls (faster rate than ship acceleration)
    if (this.keys['KeyX']) {
      const currentThrottle = this.spaceship.getThrottle();
      this.spaceship.setThrottle(currentThrottle + 1.0 * deltaTime);

      // Start music on first X press
      // (Retained for debug logging but auto-start now handled above)
      if (DEBUG && this.game && !this.game.musicStarted) {
        console.log('Controls: X key pressed; music will start via auto-start logic');
      }
    }
    if (this.keys['KeyZ']) {
      const currentThrottle = this.spaceship.getThrottle();
      this.spaceship.setThrottle(currentThrottle - 1.0 * deltaTime);
    }

    // Shooting with cooldown
    if (this.keys['Space']) {
      const currentTime = performance.now() / 1000; // Convert to seconds
      if (currentTime - this.lastLaserTime >= this.laserCooldown) {
        if (this.onShoot) {
          this.onShoot();
          this.lastLaserTime = currentTime;
        }
      }
    }

    // Targeting: hold T to clear, tap T to select
    if (this.keys['KeyT']) {
      if (!this._tKeyHeld) {
        this._tKeyHeld = { start: performance.now(), cleared: false };
      }
      const held = this._tKeyHeld;
      const heldTime = performance.now() - held.start;
      if (heldTime > 350 && !held.cleared) { // Hold >350ms to clear
        if (this.game && this.game.currentTarget) {
          this.game.currentTarget.setTargeted(false);
          this.game.currentTarget = null;
          this.game.ui.clearTargetInfo();
        }
        held.cleared = true;
      }
    } else if (this._tKeyHeld) {
      // On T release: if not held long enough, treat as tap (target)
      if (!this._tKeyHeld.cleared && this.onTarget) {
        this.onTarget();
      }
      this._tKeyHeld = null;
    }

    // Navigation targeting: tap Y to nav target, hold Y to clear nav target
    if (this.keys['KeyY']) {
      if (!this._yKeyHeld) {
        this._yKeyHeld = { start: performance.now(), cleared: false };
      }
      const held = this._yKeyHeld;
      const heldTime = performance.now() - held.start;
      if (heldTime > 350 && !held.cleared) { // Hold >350ms to clear nav target
        if (this.game && this.game.currentNavTarget) {
          this.game.currentNavTarget.setTargeted && this.game.currentNavTarget.setTargeted(false);
          this.game.currentNavTarget = null;
          this.game.ui.clearNavTargetInfo && this.game.ui.clearNavTargetInfo();
        }
        held.cleared = true;
      }
    } else if (this._yKeyHeld) {
      // On Y release: if not held long enough, treat as tap (nav target)
      if (!this._yKeyHeld.cleared && this.onNavTarget) {
        this.onNavTarget();
      }
      this._yKeyHeld = null;
    }

    // Communications (V for target, C for nav target)
    if (this.keys['KeyV']) {
      if (this.onComms) {
        this.onComms();
      }
      this.keys['KeyV'] = false;
    }
    if (this.keys['KeyC']) {
      if (this.onNavComms) {
        this.onNavComms();
      }
      this.keys['KeyC'] = false;
    }

    // Map (M key)
    if (this.keys['KeyM']) {
      if (this.onMapToggle) {
        this.onMapToggle();
      }
      this.keys['KeyM'] = false;
    }

    // ESC to close comms modal
    if (this.keys['Escape']) {
      if (this.onCloseComms) {
        this.onCloseComms();
      }
      // Clear the key to prevent repeated calls
      this.keys['Escape'] = false;
    }

    // Number keys for conversation options (1-9)
    for (let i = 1; i <= 9; i++) {
      const keyName = `Digit${i}`;
      if (this.keys[keyName]) {
        if (this.onCommsOption) {
          this.onCommsOption(i);
        }
        // Clear the key to prevent repeated calls
        this.keys[keyName] = false;
      }
    }

    // F1 toggles third-person mode
    if (this.keys['F1']) {
      if (this.game) {
        if (!this.game.thirdPersonInitialized) {
          this.game.initThirdPerson();
        } else {
          this.game.toggleThirdPerson();
        }
      }
      this.keys['F1'] = false; // prevent repeat
    }
  }

  setOnNavComms(callback) {
    this.onNavComms = callback;
  }

  setOnShoot(callback) {
    this.onShoot = callback;
  }

  setOnResize(callback) {
    this.onResize = callback;
  }

  setOnTarget(callback) {
    this.onTarget = callback;
  }

  setOnNavTarget(callback) {
    this.onNavTarget = callback;
  }

  setOnComms(callback) {
    this.onComms = callback;
  }

  setOnMapToggle(callback) { this.onMapToggle = callback; }

  setOnCloseComms(callback) {
    this.onCloseComms = callback;
  }

  setOnCommsOption(callback) {
    this.onCommsOption = callback;
  }

  async startMusic() {
    if (DEBUG) console.log('startMusic: Method called');
    if (DEBUG) console.log('startMusic: this.game exists:', !!this.game);
    if (DEBUG) console.log('startMusic: this.game.musicStarted:', this.game?.musicStarted);

    if (this.game && !this.game.musicStarted) {
      if (DEBUG) console.log('startMusic: Starting music system');
      this.game.musicStarted = true;

      try {
        // Ensure audio context is resumed (user gesture just occurred triggering this call)
        if (this.game.soundManager?.audioContext && this.game.soundManager.audioContext.state === 'suspended') {
          if (DEBUG) console.log('startMusic: Resuming audio context');
          try { await this.game.soundManager.audioContext.resume(); } catch (_) {}
        }
        // Initialize music manager
        if (DEBUG) console.log('startMusic: Initializing music manager');
        await this.game.musicManager.init();
        if (DEBUG) console.log('startMusic: Music manager initialized successfully');

        // Start ambient track
        if (DEBUG) console.log('startMusic: Playing ambient track');
        this.game.musicManager.playTrack('ambient');
        if (DEBUG) console.log('startMusic: Starting fade in');
        this.game.musicManager.fadeIn(3000); // 3 second fade in
        if (DEBUG) console.log('startMusic: Music system started successfully');

        // Immediately kick engine rumble so it starts exactly with the music
        if (this.game.soundManager && this.game.spaceship) {
          const throttle = this.spaceship?.getThrottle ? this.spaceship.getThrottle() : 0;
          // Provide one immediate update so engine starts without waiting for next frame
          this.game.soundManager.updateEngineRumble(throttle, false);
        }
      } catch (error) {
        console.error('startMusic: Failed to start music system:', error);
        console.error('startMusic: Error details:', error.message);
        console.error('startMusic: Error stack:', error.stack);
      }
    } else {
      if (DEBUG) console.log('startMusic: Music already started or game not available');
    }
  }
}
