import * as THREE from 'three';

export class Planet {
  constructor(radius = 1, position = new THREE.Vector3(0, 0, 0), color = 0x8B4513) {
    this.radius = radius;
    this.position = position;
    this.color = color;
    this.rotationSpeed = 0.1;
    this.currentRotation = 0;
    
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
}
