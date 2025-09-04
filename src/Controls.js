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
      if (this.game && !this.game.musicStarted) {
        if (DEBUG) console.log('Controls: X key pressed, starting music');
        this.startMusic();
      } else {
        if (DEBUG) console.log('Controls: X key pressed but music already started or game not available');
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
    
    // Navigation targeting
    if (this.keys['KeyY']) {
      if (this.onNavTarget) {
        this.onNavTarget();
      }
      // Clear the key to prevent repeated targeting
      this.keys['KeyY'] = false;
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
