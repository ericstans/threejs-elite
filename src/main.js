import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';
import { Spaceship } from './Spaceship.js';
import { Planet } from './Planet.js';
import { Controls } from './Controls.js';
import { UI } from './UI.js';
import { Laser } from './Laser.js';
import { Asteroid } from './Asteroid.js';
import { Explosion } from './Explosion.js';

class Game {
  constructor() {
    this.gameEngine = new GameEngine();
    this.spaceship = new Spaceship();
    this.controls = new Controls(this.spaceship);
    this.ui = new UI();
    this.lasers = [];
    this.asteroids = [];
    this.explosions = [];
    
    this.setupGame();
    this.setupControls();
    this.start();
  }

  setupGame() {
    // Add spaceship to game engine for physics updates, but don't render the mesh
    this.gameEngine.addEntity(this.spaceship);
    // Hide the spaceship mesh since we're in cockpit view
    this.spaceship.mesh.visible = false;
    
    // Create planets
    const planet1 = new Planet(2, new THREE.Vector3(20, 0, -50), 0x8B4513); // Brown planet
    const planet2 = new Planet(1.5, new THREE.Vector3(-30, 10, -80), 0x4169E1); // Blue planet
    
    this.gameEngine.addEntity(planet1);
    this.gameEngine.addEntity(planet2);
    
    // Create asteroid field between the planets
    this.createAsteroidField();
    
    // Position camera at spaceship center (cockpit view)
    this.gameEngine.camera.position.set(0, 0, 0);
    this.gameEngine.camera.rotation.set(0, 0, 0);
  }

  createAsteroidField() {
    // Create asteroid field between the two planets
    const asteroidCount = 25;
    const fieldCenter = new THREE.Vector3(-5, 5, -65); // Between the planets
    const fieldSize = 30; // Size of the asteroid field
    
    for (let i = 0; i < asteroidCount; i++) {
      // Random position within the field
      const position = new THREE.Vector3(
        fieldCenter.x + (Math.random() - 0.5) * fieldSize,
        fieldCenter.y + (Math.random() - 0.5) * fieldSize,
        fieldCenter.z + (Math.random() - 0.5) * fieldSize
      );
      
      // Random size between 0.5 and 2.0
      const size = 0.5 + Math.random() * 1.5;
      
      const asteroid = new Asteroid(position, size);
      this.asteroids.push(asteroid);
      this.gameEngine.addEntity(asteroid);
    }
  }

  setupControls() {
    // Handle shooting
    this.controls.setOnShoot(() => {
      this.shootLaser();
    });

    // Handle window resize
    this.controls.setOnResize(() => {
      this.gameEngine.resize();
    });
  }

  shootLaser() {
    // Get spaceship position and forward direction
    const spaceshipPos = this.spaceship.getPosition();
    const spaceshipRot = this.spaceship.getRotation();
    
    // Calculate forward direction from spaceship rotation
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(spaceshipRot);
    
    // Create laser slightly in front of spaceship
    const laserStartPos = spaceshipPos.clone().add(forward.clone().multiplyScalar(2));
    
    // Create new laser
    const laser = new Laser(laserStartPos, forward);
    this.lasers.push(laser);
    this.gameEngine.addEntity(laser);
  }

  update(deltaTime) {
    // Update controls
    this.controls.update(deltaTime);
    
    // Update UI
    this.ui.updateThrottle(this.spaceship.getThrottle());
    
    // Update and cleanup lasers
    this.updateLasers(deltaTime);
    
    // Update and cleanup explosions
    this.updateExplosions(deltaTime);
    
    // Check for laser-asteroid collisions
    this.checkCollisions();
    
    // Update camera to follow spaceship position and rotation exactly
    const spaceshipPos = this.spaceship.getPosition();
    const spaceshipRot = this.spaceship.getRotation();
    
    this.gameEngine.camera.position.copy(spaceshipPos);
    this.gameEngine.camera.rotation.copy(spaceshipRot);
  }

  updateLasers(deltaTime) {
    // Update lasers and remove expired ones
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      const shouldDestroy = laser.update(deltaTime);
      
      if (shouldDestroy) {
        this.gameEngine.removeEntity(laser);
        this.lasers.splice(i, 1);
      }
    }
  }

  updateExplosions(deltaTime) {
    // Update explosions and remove expired ones
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      const shouldDestroy = explosion.update(deltaTime);
      
      if (shouldDestroy) {
        this.gameEngine.removeEntity(explosion);
        this.explosions.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    // Check each laser against each asteroid
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j];
        
        if (!asteroid.isAlive()) continue;
        
        // Simple distance-based collision detection
        const distance = laser.getPosition().distanceTo(asteroid.getPosition());
        const collisionRadius = asteroid.getSize() + 0.1; // Small buffer
        
        if (distance < collisionRadius) {
          // Collision detected!
          this.handleLaserAsteroidCollision(laser, asteroid, i, j);
          break; // Laser can only hit one asteroid
        }
      }
    }
  }

  handleLaserAsteroidCollision(laser, asteroid, laserIndex, asteroidIndex) {
    // Remove the laser
    this.gameEngine.removeEntity(laser);
    this.lasers.splice(laserIndex, 1);
    
    // Damage the asteroid
    const wasDestroyed = asteroid.takeDamage(1);
    
    if (wasDestroyed) {
      // Asteroid destroyed - create large explosion at center
      const explosion = new Explosion(asteroid.getPosition(), asteroid.getSize() * 2, 1.0);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
      
      // Remove asteroid
      this.gameEngine.removeEntity(asteroid);
      this.asteroids.splice(asteroidIndex, 1);
    } else {
      // Asteroid hit but not destroyed - create small explosion on surface
      const hitPosition = asteroid.getPosition().clone();
      // Add some randomness to the hit position
      hitPosition.x += (Math.random() - 0.5) * asteroid.getSize();
      hitPosition.y += (Math.random() - 0.5) * asteroid.getSize();
      hitPosition.z += (Math.random() - 0.5) * asteroid.getSize();
      
      const explosion = new Explosion(hitPosition, 0.3, 0.3);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
    }
  }

  start() {
    // Override the game engine's update to include our custom update
    const originalUpdate = this.gameEngine.update.bind(this.gameEngine);
    this.gameEngine.update = (deltaTime) => {
      originalUpdate(deltaTime);
      this.update(deltaTime);
    };
    
    // Start the game loop
    this.gameEngine.animate();
  }
}

// Start the game
new Game();
