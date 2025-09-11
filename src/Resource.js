import * as THREE from 'three';
import { getRandomMineableItem } from './data/CargoItemsData.js';

export class Resource {
  constructor(position, cargoItemData = null) {
    this.position = position.clone();
    this.cargoItemData = cargoItemData || getRandomMineableItem();
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

  static getRandomElementType() {
    return getRandomMineableItem();
  }

  createMesh() {
    // Create small cylinder for resource
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: this.cargoItemData.color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: new THREE.Color(this.cargoItemData.color).multiplyScalar(0.1)
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
    return `${this.cargoItemData.name} Resource`;
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
