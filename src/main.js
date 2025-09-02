import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';
import { Spaceship } from './Spaceship.js';
import { Planet } from './Planet.js';
import { Controls } from './Controls.js';
import { UI } from './UI.js';

class Game {
  constructor() {
    this.gameEngine = new GameEngine();
    this.spaceship = new Spaceship();
    this.controls = new Controls(this.spaceship);
    this.ui = new UI();
    
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
    
    // Position camera at spaceship center (cockpit view)
    this.gameEngine.camera.position.set(0, 0, 0);
    this.gameEngine.camera.rotation.set(0, 0, 0);
  }

  setupControls() {
    // Handle shooting
    this.controls.setOnShoot(() => {
      console.log('Pew! Laser fired!');
      // TODO: Implement laser shooting
    });

    // Handle window resize
    this.controls.setOnResize(() => {
      this.gameEngine.resize();
    });
  }

  update(deltaTime) {
    // Update controls
    this.controls.update(deltaTime);
    
    // Update UI
    this.ui.updateThrottle(this.spaceship.getThrottle());
    
    // Update camera to follow spaceship position and rotation exactly
    const spaceshipPos = this.spaceship.getPosition();
    const spaceshipRot = this.spaceship.getRotation();
    
    this.gameEngine.camera.position.copy(spaceshipPos);
    this.gameEngine.camera.rotation.copy(spaceshipRot);
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
