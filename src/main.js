import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';
import { Spaceship } from './Spaceship.js';
import { Planet } from './Planet.js';
import { Controls } from './Controls.js';
import { UI } from './UI.js';
import { Laser } from './Laser.js';
import { Asteroid } from './Asteroid.js';
import { Explosion } from './Explosion.js';
import { SoundManager } from './SoundManager.js';
import { ConversationSystem } from './ConversationSystem.js';

class Game {
  constructor() {
    this.gameEngine = new GameEngine();
    this.spaceship = new Spaceship();
    this.controls = new Controls(this.spaceship);
    this.ui = new UI();
    this.soundManager = new SoundManager();
    this.conversationSystem = new ConversationSystem();
    this.lasers = [];
    this.asteroids = [];
    this.explosions = [];
    this.currentTarget = null;
    this.currentNavTarget = null;
    this.planets = [];
    
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
    const planet1 = new Planet(2, new THREE.Vector3(20, 0, -50), 0x8B4513, "Aridus Prime", "Thank you for contacting Aridus Prime."); // Brown planet
    const planet2 = new Planet(1.5, new THREE.Vector3(-30, 10, -80), 0x4169E1, "Oceanus", "Thank you for contacting Oceanus."); // Blue planet
    
    this.planets.push(planet1);
    this.planets.push(planet2);
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

    // Handle targeting
    this.controls.setOnTarget(() => {
      this.targetNearestAsteroid();
    });

    // Handle navigation targeting
    this.controls.setOnNavTarget(() => {
      this.targetNearestPlanet();
    });

    // Handle communications
    this.controls.setOnComms(() => {
      this.openComms();
    });

    // Handle closing communications
    this.controls.setOnCloseComms(() => {
      this.closeComms();
    });

    // Handle conversation option selection
    this.controls.setOnCommsOption((optionNumber) => {
      this.selectCommsOption(optionNumber);
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
    
    // Check if we have a target and apply auto-aim
    let laserDirection = forward;
    if (this.currentTarget && this.currentTarget.isAlive()) {
      const targetPos = this.currentTarget.getPosition();
      const targetDirection = targetPos.clone().sub(spaceshipPos).normalize();
      
      // Calculate angle between forward direction and target direction
      const angle = forward.angleTo(targetDirection);
      const maxAngle = Math.PI / 18; // 10 degrees in radians
      
      // If target is within 10 degrees, aim at it
      if (angle <= maxAngle) {
        laserDirection = targetDirection;
      }
    }
    
    // Create laser slightly in front of spaceship
    const laserStartPos = spaceshipPos.clone().add(forward.clone().multiplyScalar(2));
    
    // Create new laser with calculated direction
    const laser = new Laser(laserStartPos, laserDirection);
    this.lasers.push(laser);
    this.gameEngine.addEntity(laser);
    
    // Play laser sound
    this.soundManager.playLaserSound();
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
    
    // Update target information
    this.updateTargetInfo();
    
    // Update nav target information
    this.updateNavTargetInfo();
    
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
      
      // Play explosion sound
      this.soundManager.playExplosionSound();
      
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
      
      // Play hit sound
      this.soundManager.playHitSound();
    }
  }

  targetNearestAsteroid() {
    // Clear current target
    if (this.currentTarget) {
      this.currentTarget.setTargeted(false);
      this.currentTarget = null;
    }

    // Find asteroid closest to crosshair (center of screen)
    const camera = this.gameEngine.camera;
    const crosshairCenter = new THREE.Vector2(0, 0); // Center of screen in NDC
    let closestAsteroid = null;
    let closestScreenDistance = Infinity;

    for (const asteroid of this.asteroids) {
      if (!asteroid.isAlive()) continue;
      
      // Convert asteroid 3D position to 2D screen coordinates
      const asteroidPos = asteroid.getPosition();
      const screenPos = asteroidPos.clone();
      screenPos.project(camera);
      
      // Check if asteroid is in front of camera
      if (screenPos.z > 1) continue;
      
      // Calculate distance from crosshair center
      const screenDistance = crosshairCenter.distanceTo(new THREE.Vector2(screenPos.x, screenPos.y));
      
      if (screenDistance < closestScreenDistance) {
        closestScreenDistance = screenDistance;
        closestAsteroid = asteroid;
      }
    }

    // Set new target
    if (closestAsteroid) {
      this.currentTarget = closestAsteroid;
      this.currentTarget.setTargeted(true);
      
      // Play target selected sound
      this.soundManager.playTargetSelectedSound();
    }
  }

  updateTargetInfo() {
    if (this.currentTarget && this.currentTarget.isAlive()) {
      // Update target information in UI
      const spaceshipPos = this.spaceship.getPosition();
      const targetPos = this.currentTarget.getPosition();
      const distance = spaceshipPos.distanceTo(targetPos);
      
      this.ui.updateTargetInfo({
        id: this.currentTarget.getId(),
        mass: this.currentTarget.getMass(),
        distance: distance,
        health: this.currentTarget.getHealth(),
        maxHealth: this.currentTarget.getMaxHealth(),
        isCommable: this.currentTarget.isCommable
      }, targetPos, this.gameEngine.camera);
    } else {
      // Clear target if destroyed or invalid
      if (this.currentTarget) {
        this.currentTarget.setTargeted(false);
        this.currentTarget = null;
      }
      this.ui.clearTargetInfo();
    }
  }

  targetNearestPlanet() {
    // Clear current nav target
    if (this.currentNavTarget) {
      this.currentNavTarget.setNavTargeted(false);
      this.currentNavTarget = null;
    }

    // Find planet closest to crosshair (center of screen)
    const camera = this.gameEngine.camera;
    const crosshairCenter = new THREE.Vector2(0, 0); // Center of screen in NDC
    let closestPlanet = null;
    let closestScreenDistance = Infinity;

    for (const planet of this.planets) {
      // Convert planet 3D position to 2D screen coordinates
      const planetPos = planet.getPosition();
      const screenPos = planetPos.clone();
      screenPos.project(camera);
      
      // Check if planet is in front of camera
      if (screenPos.z > 1) continue;
      
      // Calculate distance from crosshair center
      const screenDistance = crosshairCenter.distanceTo(new THREE.Vector2(screenPos.x, screenPos.y));
      
      if (screenDistance < closestScreenDistance) {
        closestScreenDistance = screenDistance;
        closestPlanet = planet;
      }
    }

    // Set new nav target
    if (closestPlanet) {
      this.currentNavTarget = closestPlanet;
      this.currentNavTarget.setNavTargeted(true);
      
      // Play target selected sound
      this.soundManager.playTargetSelectedSound();
    }
  }

  updateNavTargetInfo() {
    if (this.currentNavTarget) {
      // Update nav target information in UI
      const spaceshipPos = this.spaceship.getPosition();
      const targetPos = this.currentNavTarget.getPosition();
      const distance = spaceshipPos.distanceTo(targetPos);
      
      this.ui.updateNavTargetInfo({
        id: this.currentNavTarget.getId(),
        name: this.currentNavTarget.getName(),
        mass: this.currentNavTarget.getMass(),
        distance: distance,
        isCommable: this.currentNavTarget.isCommable
      }, targetPos, this.gameEngine.camera);
    } else {
      this.ui.clearNavTargetInfo();
    }
  }

  openComms() {
    // Only open comms if we have a nav target and it's commable
    if (this.currentNavTarget && this.currentNavTarget.isCommable) {
      const planetName = this.currentNavTarget.getName();
      const greeting = this.conversationSystem.getGreeting(planetName);
      const initialOptions = this.conversationSystem.getInitialOptions(planetName);
      this.ui.showCommsModal(planetName, greeting, initialOptions);
      this.currentConversationNode = 'initial';
    }
  }

  closeComms() {
    this.ui.hideCommsModal();
    this.currentConversationNode = null;
  }

  selectCommsOption(optionNumber) {
    if (!this.ui.isCommsModalVisible() || !this.currentNavTarget) {
      return;
    }

    const planetName = this.currentNavTarget.getName();
    let options = [];
    let nodeId = this.currentConversationNode;

    // Get current options from the modal
    const optionElements = this.ui.commsOptions.children;
    if (optionNumber <= optionElements.length) {
      const selectedOption = optionElements[optionNumber - 1];
      const optionId = selectedOption.dataset.optionId;

      // Handle special cases
      if (optionId === 'end') {
        this.closeComms();
        return;
      }

      if (optionId === 'back_info') {
        // Go back to information node
        nodeId = 'information';
      } else {
        // Navigate to the selected conversation node
        nodeId = optionId;
      }

      // Get the conversation node
      const conversationNode = this.conversationSystem.getConversationNode(planetName, nodeId);
      if (conversationNode) {
        this.ui.updateCommsModal(conversationNode.response, conversationNode.options);
        this.currentConversationNode = nodeId;
      }
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
