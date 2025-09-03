import * as THREE from 'three';

export class Asteroid {
  constructor(position, size = 1) {
    this.size = size;
    this.position = position;
    this.rotationSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5, // Random rotation speeds
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    );
    this.currentRotation = new THREE.Euler(0, 0, 0);
    
    // Damage system
    this.maxHealth = 10;
    this.health = this.maxHealth;
    this.isDestroyed = false;
    
    // Targeting system
    this.id = Math.random().toString(36).substr(2, 9); // Generate unique ID
    this.mass = size * size * size; // Approximate mass based on volume
    this.isTargeted = false;
    this.isCommable = false; // No asteroids are commable for now
    
    this.mesh = this.createAsteroidMesh();
    this.mesh.position.copy(this.position);
  }

  createAsteroidMesh() {
    // Create a random asteroid geometry
    const geometry = new THREE.DodecahedronGeometry(this.size, 0);
    
    // Randomly modify vertices for irregular shape
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Add random noise to vertices
      const noise = 0.3;
      positions.setX(i, x + (Math.random() - 0.5) * noise);
      positions.setY(i, y + (Math.random() - 0.5) * noise);
      positions.setZ(i, z + (Math.random() - 0.5) * noise);
    }
    
    positions.needsUpdate = true;
    
    // Random asteroid color - gradient between grey and tan, weighted toward grey
    const greyColor = new THREE.Color(0x696969); // Medium grey
    const tanColor = new THREE.Color(0xD2B48C);  // Tan color
    
    // Weight toward grey (0.7 = 70% grey, 30% tan)
    const greyWeight = 0.7;
    const randomFactor = Math.random() * greyWeight;
    
    // Interpolate between grey and tan
    const color = greyColor.clone().lerp(tanColor, randomFactor);
    
    const material = new THREE.MeshLambertMaterial({ 
      color: color,
      flatShading: true 
    });
    
    const asteroid = new THREE.Mesh(geometry, material);
    return asteroid;
  }

  update(deltaTime) {
    // Rotate the asteroid
    this.currentRotation.x += this.rotationSpeed.x * deltaTime;
    this.currentRotation.y += this.rotationSpeed.y * deltaTime;
    this.currentRotation.z += this.rotationSpeed.z * deltaTime;
    
    this.mesh.rotation.copy(this.currentRotation);
  }

  // Damage methods
  takeDamage(damage = 1) {
    this.health -= damage;
    if (this.health <= 0) {
      this.isDestroyed = true;
      return true; // Asteroid was destroyed
    }
    return false; // Asteroid still alive
  }

  getHealth() {
    return this.health;
  }

  getMaxHealth() {
    return this.maxHealth;
  }

  isAlive() {
    return !this.isDestroyed;
  }

  getPosition() {
    return this.position.clone();
  }

  getSize() {
    return this.size;
  }

  getId() {
    return this.id;
  }

  getMass() {
    return this.mass;
  }

  setTargeted(targeted) {
    this.isTargeted = targeted;
  }

  isTarget() {
    return this.isTargeted;
  }

  isCommable() {
    return this.isCommable;
  }
}
