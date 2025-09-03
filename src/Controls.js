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
        this.startMusic();
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
    
    // Targeting
    if (this.keys['KeyT']) {
      if (this.onTarget) {
        this.onTarget();
      }
      // Clear the key to prevent repeated targeting
      this.keys['KeyT'] = false;
    }
    
    // Navigation targeting
    if (this.keys['KeyY']) {
      if (this.onNavTarget) {
        this.onNavTarget();
      }
      // Clear the key to prevent repeated targeting
      this.keys['KeyY'] = false;
    }
    
    // Communications
    if (this.keys['KeyC']) {
      if (this.onComms) {
        this.onComms();
      }
      // Clear the key to prevent repeated calls
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
    if (this.game && !this.game.musicStarted) {
      this.game.musicStarted = true;
      
      try {
        // Initialize music manager
        await this.game.musicManager.init();
        
        // Start ambient track
        this.game.musicManager.playTrack('ambient');
        this.game.musicManager.fadeIn(3000); // 3 second fade in
      } catch (error) {
        console.error('Failed to start music system:', error);
      }
    }
  }
}
