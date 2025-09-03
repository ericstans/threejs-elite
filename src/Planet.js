import * as THREE from 'three';

export class Planet {
  constructor(radius = 1, position = new THREE.Vector3(0, 0, 0), color = 0x8B4513, name = "Planet", greeting = "Thank you for contacting us.") {
    this.radius = radius;
    this.position = position;
    this.color = color;
    this.name = name;
    this.greeting = greeting;
    this.rotationSpeed = 0.1;
    this.currentRotation = 0;
    
    // Navigation targeting
    this.id = Math.random().toString(36).substr(2, 9); // Generate unique ID
    this.mass = radius * radius * radius * 1000; // Much larger mass than asteroids
    this.isNavTargeted = false;
    this.isCommable = true; // All planets are commable
    
    this.mesh = this.createPlanetMesh();
    this.mesh.position.copy(this.position);
  }

  createPlanetMesh() {
    // Create a low-poly sphere for flat-shaded look
    const geometry = new THREE.SphereGeometry(this.radius, 8, 6);
    const material = new THREE.MeshLambertMaterial({ 
      color: this.color,
      flatShading: true 
    });
    
    const planet = new THREE.Mesh(geometry, material);
    return planet;
  }

  update(deltaTime) {
    // Rotate the planet
    this.currentRotation += this.rotationSpeed * deltaTime;
    this.mesh.rotation.y = this.currentRotation;
  }

  // Navigation targeting methods
  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getMass() {
    return this.mass;
  }

  setNavTargeted(targeted) {
    this.isNavTargeted = targeted;
  }

  isNavTarget() {
    return this.isNavTargeted;
  }

  getPosition() {
    return this.position.clone();
  }

  isCommable() {
    return this.isCommable;
  }

  getGreeting() {
    return this.greeting;
  }
}
