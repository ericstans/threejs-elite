// import * as THREE from 'three';
import { createCargoItem } from '../data/CargoItemsData.js';

const DEBUG = false;

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

  collectResource(resource, _resourceIndex) {
    // Check if cargo bay is full
    if (this.cargo.length >= this.maxCargoSlots) {
      if (DEBUG) console.log('Cargo bay is full!');
      return;
    }

    // Create unified cargo item from resource
    const cargoItem = createCargoItem(resource.cargoItemData.name, 'mined');
    if (!cargoItem) {
      if (DEBUG) console.log('Failed to create cargo item from resource');
      return;
    }

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

    if (DEBUG) console.log(`Collected ${cargoItem.name} resource!`);
  }

  updateCargoUI() {
    if (!this.cargoUI) return;

    // Clear all cargo slots
    this.cargoUI.clearAllCargo();

    // Fill slots with collected cargo
    for (let i = 0; i < this.cargo.length && i < this.maxCargoSlots; i++) {
      const item = this.cargo[i];
      const icon = item.icon || '●'; // Use item-specific icon or fallback to circle
      const tooltip = item.name;

      // Create colored element with icon
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

  // Add cargo item directly (for purchased items)
  addCargoItem(itemName, source = 'purchased') {
    if (this.cargo.length >= this.maxCargoSlots) {
      if (DEBUG) console.log('Cargo bay is full!');
      return false;
    }

    const cargoItem = createCargoItem(itemName, source);
    if (!cargoItem) {
      if (DEBUG) console.log('Failed to create cargo item:', itemName);
      return false;
    }

    this.cargo.push(cargoItem);
    this.updateCargoUI();
    
    if (DEBUG) console.log(`Added ${cargoItem.name} to cargo bay`);
    return true;
  }

  // Add test cargo items for debugging
  addTestCargo() {
    const testItems = [
      'Iron Ore',
      'Copper Ore', 
      'Gold Ore',
      'Steel Ingots',
      'Electronics',
      'Energy Cells',
      'Fuel Rods',
      'Food Rations'
    ];

    // Add test items to cargo
    testItems.forEach(itemName => {
      if (this.cargo.length < this.maxCargoSlots) {
        this.addCargoItem(itemName, 'test');
      }
    });

    console.log(`Added ${testItems.length} test cargo items`);
  }

  // Helper method to convert Three.js color value to hex string
  threeColorToHex(colorValue) {
    // Convert Three.js color value (0xRRGGBB) to hex string (#RRGGBB)
    const hex = colorValue.toString(16).padStart(6, '0');
    return `#${hex}`;
  }

  // Cash management methods
  getCash() {
    const spaceship = this.getSpaceship();
    return spaceship ? spaceship.getCash() : 0;
  }

  addCash(amount) {
    const spaceship = this.getSpaceship();
    return spaceship ? spaceship.addCash(amount) : 0;
  }

  removeCash(amount) {
    const spaceship = this.getSpaceship();
    return spaceship ? spaceship.removeCash(amount) : 0;
  }

  setCash(amount) {
    const spaceship = this.getSpaceship();
    return spaceship ? spaceship.setCash(amount) : 0;
  }
}
