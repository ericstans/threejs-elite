import * as THREE from 'three';

export class Resource {
  constructor(position, elementType) {
    this.position = position.clone();
    this.elementType = elementType;
    this.id = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.isAlive = () => true; // Resources don't get destroyed by lasers
    this.isCommable = false;
    this.isNavTargetable = false; // Resources are not nav targetable
    this.isCombatTargetable = true; // Resources can be targeted for combat
    
    // Resource properties
    this.mass = 0.1; // Lightweight
    this.health = 1;
    this.maxHealth = 1;
    
    this.createMesh();
    this.setupPhysics();
  }

  static getResourceTypes() {
    return {
      // Common elements (80% chance)
      common: [
        { name: 'Iron', color: 0x8B4513, rarity: 0.3 },      // Brown
        { name: 'Carbon', color: 0x2F2F2F, rarity: 0.25 },   // Dark grey
        { name: 'Silicon', color: 0x708090, rarity: 0.2 },   // Slate grey
        { name: 'Aluminum', color: 0xC0C0C0, rarity: 0.15 }, // Silver
        { name: 'Copper', color: 0xB87333, rarity: 0.1 },    // Bronze
        { name: 'Nickel', color: 0x8B8B8B, rarity: 0.1 },    // Grey
        { name: 'Titanium', color: 0xE6E6FA, rarity: 0.08 }, // Lavender
        { name: 'Chromium', color: 0x4682B4, rarity: 0.07 }  // Steel blue
      ],
      // Rare elements (20% chance)
      rare: [
        { name: 'Platinum', color: 0xE5E4E2, rarity: 0.02 }, // Platinum
        { name: 'Gold', color: 0xFFD700, rarity: 0.01 }      // Gold
      ]
    };
  }

  static getRandomElementType() {
    const types = Resource.getResourceTypes();
    const allElements = [...types.common, ...types.rare];
    
    // Weighted random selection based on rarity
    const random = Math.random();
    let cumulative = 0;
    
    for (const element of allElements) {
      cumulative += element.rarity;
      if (random <= cumulative) {
        return element;
      }
    }
    
    // Fallback to most common element
    return types.common[0];
  }

  createMesh() {
    // Create small cylinder for resource
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: this.elementType.color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: new THREE.Color(this.elementType.color).multiplyScalar(0.1)
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Add slight rotation for visual interest
    this.mesh.rotation.x = Math.random() * Math.PI;
    this.mesh.rotation.z = Math.random() * Math.PI;
  }

  setupPhysics() {
    // Add gentle floating motion
    this.floatSpeed = 0.5 + Math.random() * 0.5;
    this.floatAmplitude = 0.2 + Math.random() * 0.3;
    this.rotationSpeed = 0.01 + Math.random() * 0.02;
    this.timeOffset = Math.random() * Math.PI * 2;
  }

  update() {
    if (!this.mesh) return;
    
    // Gentle floating motion
    const time = Date.now() * 0.001;
    this.mesh.position.y = this.position.y + Math.sin(time * this.floatSpeed + this.timeOffset) * this.floatAmplitude;
    
    // Slow rotation
    this.mesh.rotation.y += this.rotationSpeed;
    this.mesh.rotation.x += this.rotationSpeed * 0.5;
  }

  getPosition() {
    return this.mesh ? this.mesh.position : this.position;
  }

  getId() {
    return this.id;
  }

  getName() {
    return `${this.elementType.name} Resource`;
  }

  getType() {
    return 'resource';
  }

  getMass() {
    return this.mass;
  }

  getHealth() {
    return this.health;
  }

  getMaxHealth() {
    return this.maxHealth;
  }

  // Resources are always alive (can't be destroyed by lasers)
  destroy() {
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.mesh = null;
  }

  // For radar display
  getRadarColor() {
    return '#808080'; // Grey for all resources
  }

  // For targeting system
  getTargetInfo() {
    return {
      id: this.id,
      name: this.getName(),
      type: 'resource',
      mass: this.mass,
      health: this.health,
      maxHealth: this.maxHealth,
      distance: 0, // Will be calculated by targeting system
      isCommable: this.isCommable,
      isNavTargetable: this.isNavTargetable,
      isCombatTargetable: this.isCombatTargetable,
      __ref: this
    };
  }

  // Required for targeting system
  setTargeted(targeted) {
    // Resources don't have visual targeting indicators, but we can store the state
    this._targeted = targeted;
  }

  setNavTargeted(targeted) {
    // Resources don't have visual targeting indicators, but we can store the state
    this._navTargeted = targeted;
  }
}
