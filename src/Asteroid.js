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
    
    // Random asteroid color (brownish/grayish)
    const colors = [0x8B4513, 0x696969, 0x2F4F4F, 0x654321, 0x708090];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
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
}
