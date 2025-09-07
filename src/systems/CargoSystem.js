import * as THREE from 'three';

export class CargoSystem {
  constructor({ getSpaceship, getResources, gameEngine, cargoUI, soundManager, targetingSystem }) {
    this.getSpaceship = getSpaceship;
    this.getResources = getResources;
    this.gameEngine = gameEngine;
    this.cargoUI = cargoUI;
    this.soundManager = soundManager;
    this.targetingSystem = targetingSystem;
    
    // Cargo storage
    this.cargo = [];
    this.maxCargoSlots = 15; // 5x3 grid
    
    // Collection parameters
    this.collectionRadius = 5.0; // 5u collection radius
    this.magneticRadius = 20.0;  // 20u magnetic pull radius
    this.magneticForce = 2.0;    // Force applied to pull resources
  }

  update(deltaTime) {
    const spaceship = this.getSpaceship();
    if (!spaceship) return;
    
    const spaceshipPos = spaceship.getPosition();
    const resources = this.getResources();
    
    for (let i = resources.length - 1; i >= 0; i--) {
      const resource = resources[i];
      if (!resource || !resource.mesh) continue;
      
      const resourcePos = resource.getPosition();
      const distance = spaceshipPos.distanceTo(resourcePos);
      
      // Check for collection (within 5u)
      if (distance <= this.collectionRadius) {
        this.collectResource(resource, i);
        continue;
      }
      
      // Apply magnetic pull (within 20u)
      if (distance <= this.magneticRadius) {
        this.applyMagneticPull(resource, spaceshipPos, resourcePos, deltaTime);
      }
    }
  }

  applyMagneticPull(resource, spaceshipPos, resourcePos, deltaTime) {
    // Calculate direction from resource to spaceship
    const direction = spaceshipPos.clone().sub(resourcePos).normalize();
    
    // Apply magnetic force (stronger as it gets closer)
    const distance = spaceshipPos.distanceTo(resourcePos);
    const forceMultiplier = 1.0 - (distance / this.magneticRadius);
    const force = this.magneticForce * forceMultiplier * deltaTime;
    
    // Move resource towards spaceship
    const movement = direction.multiplyScalar(force);
    resource.mesh.position.add(movement);
  }

  collectResource(resource, resourceIndex) {
    // Check if cargo bay is full
    if (this.cargo.length >= this.maxCargoSlots) {
      console.log('Cargo bay is full!');
      return;
    }
    
    // Add to cargo
    const cargoItem = {
      id: resource.id,
      name: resource.elementType.name,
      color: this.threeColorToHex(resource.elementType.color),
      elementType: resource.elementType,
      collectedAt: Date.now()
    };
    
    this.cargo.push(cargoItem);
    
    // Check if this resource is currently targeted and detarget it
    if (this.targetingSystem && this.targetingSystem.currentTarget === resource) {
      this.targetingSystem.currentTarget.setTargeted(false);
      this.targetingSystem.currentTarget = null;
      this.targetingSystem.ui.clearTargetInfo();
    }
    
    // Remove resource from space
    this.gameEngine.removeEntity(resource);
    
    // Update cargo UI
    this.updateCargoUI();
    
    // Play collection sound effect
    if (this.soundManager && this.soundManager.playResourceCollectedSound) {
      this.soundManager.playResourceCollectedSound();
    }
    
    console.log(`Collected ${cargoItem.name} resource!`);
  }

  updateCargoUI() {
    if (!this.cargoUI) return;
    
    // Clear all cargo slots
    this.cargoUI.clearAllCargo();
    
    // Fill slots with collected cargo
    for (let i = 0; i < this.cargo.length && i < this.maxCargoSlots; i++) {
      const item = this.cargo[i];
      const icon = '●'; // Circle icon
      const tooltip = item.name;
      
      // Create colored circle element
      this.cargoUI.addCargoWithColor(i, icon, tooltip, item.color);
    }
  }

  // Get cargo information
  getCargo() {
    return [...this.cargo];
  }

  // Get cargo count
  getCargoCount() {
    return this.cargo.length;
  }

  // Check if cargo bay is full
  isFull() {
    return this.cargo.length >= this.maxCargoSlots;
  }

  // Get cargo by element type
  getCargoByType(elementTypeName) {
    return this.cargo.filter(item => item.name === elementTypeName);
  }

  // Remove cargo item (for future use)
  removeCargo(slotIndex) {
    if (slotIndex >= 0 && slotIndex < this.cargo.length) {
      this.cargo.splice(slotIndex, 1);
      this.updateCargoUI();
    }
  }

  // Helper method to convert Three.js color value to hex string
  threeColorToHex(colorValue) {
    // Convert Three.js color value (0xRRGGBB) to hex string (#RRGGBB)
    const hex = colorValue.toString(16).padStart(6, '0');
    return `#${hex}`;
  }
}
