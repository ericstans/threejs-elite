import * as THREE from 'three';

export class Laser {
  constructor(position, direction, speed = 100) {
    this.speed = speed;
    this.lifetime = 3.0; // 3 seconds
    this.age = 0;

    this.mesh = this.createLaserMesh();
    this.position = position.clone();
    this.direction = direction.clone().normalize();
    this.velocity = this.direction.clone().multiplyScalar(this.speed);

    // Update mesh position
    this.mesh.position.copy(this.position);

    // Orient the laser to face the direction it's traveling
    this.mesh.lookAt(this.position.clone().add(this.direction));
  }

  createLaserMesh() {
    // Create a simple laser beam geometry
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
    const material = new THREE.MeshLambertMaterial({
      color: 0xff0000, // Red laser
      flatShading: true,
      emissive: 0x330000 // Slight glow
    });

    const laser = new THREE.Mesh(geometry, material);
    return laser;
  }

  update(deltaTime) {
    // Update age
    this.age += deltaTime;

    // Move the laser
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.mesh.position.copy(this.position);

    // Check if laser should be destroyed
    return this.age >= this.lifetime;
  }

  getPosition() {
    return this.position.clone();
  }

  getAge() {
    return this.age;
  }

  getLifetime() {
    return this.lifetime;
  }
}
