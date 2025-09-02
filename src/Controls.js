export class Controls {
  constructor(spaceship) {
    this.spaceship = spaceship;
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
    
    // Throttle controls
    if (this.keys['KeyC']) {
      const currentThrottle = this.spaceship.getThrottle();
      this.spaceship.setThrottle(currentThrottle + 0.5 * deltaTime);
    }
    if (this.keys['KeyX']) {
      const currentThrottle = this.spaceship.getThrottle();
      this.spaceship.setThrottle(currentThrottle - 0.5 * deltaTime);
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
}
